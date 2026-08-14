#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Native Xiangqi Engine Bridge Server
-----------------------------------
Primary engine : Pikafish (UCI Xiangqi engine — siêu đại sư, ELO ~4000+)
Fallback       : Fairy-Stockfish (UCI variant xiangqi) / Stockfish

Serves high-performance engine analysis to the React Web Application.
Supports WASM-free native search: multi-threaded CPU, NNUE evaluation,
depth 1-30, MultiPV analysis and time-limited search.
"""

import sys
import os
import re
import json
import time
import queue
import shutil
import threading
import subprocess
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Server configuration
PORT = int(os.environ.get("PORT", 8712))
HOST = "127.0.0.1"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENGINES_DIR = os.path.join(SCRIPT_DIR, "engines")
PIKAFISH_DIR = os.path.join(ENGINES_DIR, "pikafish")

# Engine families use DIFFERENT UCI rank numbering for Xiangqi:
#   Pikafish        : rank 0 = Red back rank (r=9) ... rank 9  = Black back rank (r=0)
#   Fairy-Stockfish : rank 1 = Red back rank (r=9) ... rank 10 = Black back rank (r=0)
FAMILY_PIKAFISH = "pikafish"
FAMILY_FAIRY = "fairy"
FAMILY_UNKNOWN = "unknown"

COLS = "abcdefghi"


def detect_family(path_or_name):
    """Detect engine family from binary path or engine id name."""
    text = (path_or_name or "").lower()
    if "pikafish" in text or "皮卡鱼" in text:
        return FAMILY_PIKAFISH
    if "fairy" in text or "stockfish" in text:
        return FAMILY_FAIRY
    return FAMILY_UNKNOWN


def uci_to_coords(uci_str, family=FAMILY_FAIRY):
    """
    Converts UCI move string (e.g. 'h2e2' / 'h3e3') to 0-indexed [r, c].
    Internal board convention: r=0 is Black back rank (top), r=9 is Red back rank (bottom).
    """
    if not uci_str:
        return None
    m = re.match(r"^([a-i])(10|[0-9])([a-i])(10|[0-9])$", uci_str.strip().lower())
    if not m:
        return None
    fc, fr, tc, tr = m.groups()
    from_c = COLS.index(fc)
    to_c = COLS.index(tc)
    if family == FAMILY_PIKAFISH:
        from_r = 9 - int(fr)
        to_r = 9 - int(tr)
    else:
        from_r = 10 - int(fr)
        to_r = 10 - int(tr)
    return {"fromR": from_r, "fromC": from_c, "toR": to_r, "toC": to_c}


def coords_to_uci(from_r, from_c, to_r, to_c, family=FAMILY_FAIRY):
    """Converts 0-indexed [r, c] coordinates to UCI string."""
    if family == FAMILY_PIKAFISH:
        return f"{COLS[from_c]}{9 - from_r}{COLS[to_c]}{9 - to_r}"
    return f"{COLS[from_c]}{10 - from_r}{COLS[to_c]}{10 - to_r}"

def normalize_fen(fen_str, active_turn="red"):
    """
    Ensures FEN string is in standard Xiangqi format for Pikafish/Fairy-Stockfish:
    "<piece_placement> <w|b> - - 0 1"
    """
    if not fen_str:
        fen_str = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"
    
    parts = fen_str.strip().split()
    board_part = parts[0]
    
    # Determine side to move
    turn_part = "w" if active_turn == "red" else "b"
    if len(parts) > 1 and parts[1].lower() in ["w", "b", "r"]:
        turn_part = "w" if parts[1].lower() in ["w", "r"] else "b"
        
    return f"{board_part} {turn_part} - - 0 1"

class XiangqiEngineManager:
    """Manages a persistent native UCI Xiangqi engine subprocess (Pikafish preferred)."""
    def __init__(self):
        self.lock = threading.RLock()
        self.proc = None
        self.engine_name = "Pikafish"
        self.engine_family = FAMILY_PIKAFISH
        self.engine_path = None
        self.eval_file = None
        self.threads = max(1, (os.cpu_count() or 4))
        self.hash_mb = 128
        self.default_depth = 16
        self.max_depth = 30
        self.version = "native"
        self.last_error = None
        self._outq = queue.Queue()
        self._reader_thread = None
        self.find_and_start_engine()

    # ------------------------------------------------------------------ #
    #  Engine discovery & process lifecycle                              #
    # ------------------------------------------------------------------ #
    def find_engine_path(self):
        candidates = []
        # 1) Bundled Pikafish installed by scripts/install_pikafish.sh
        candidates.append(os.path.join(PIKAFISH_DIR, "pikafish"))
        # 2) Any engine on PATH (Pikafish first)
        for name in ("pikafish", "fairy-stockfish", "stockfish"):
            p = shutil.which(name)
            if p:
                candidates.append(p)
        # 3) Common absolute locations
        candidates += [
            "/usr/local/bin/pikafish", "/opt/homebrew/bin/pikafish",
            "/usr/local/bin/fairy-stockfish", "/opt/homebrew/bin/fairy-stockfish",
            "/usr/local/bin/stockfish", "/opt/homebrew/bin/stockfish",
        ]
        seen = set()
        for c in candidates:
            if not c:
                continue
            c = os.path.abspath(c)
            if c in seen:
                continue
            seen.add(c)
            if os.path.isfile(c) and os.access(c, os.X_OK):
                return c
        return None

    def _start_reader(self):
        def reader():
            try:
                for line in self.proc.stdout:
                    if line:
                        self._outq.put(line.strip())
            except (ValueError, OSError):
                pass
        self._reader_thread = threading.Thread(target=reader, daemon=True)
        self._reader_thread.start()

    def _readline(self, timeout):
        """Read one line from the engine with a timeout (non-blocking to the caller)."""
        try:
            return self._outq.get(timeout=timeout)
        except queue.Empty:
            return None

    def _wait_for(self, predicate, timeout):
        """Consume engine output until `predicate(line)` is true or timeout."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            remaining = deadline - time.time()
            if remaining <= 0:
                return None
            line = self._readline(remaining)
            if line is None:
                return None
            if predicate(line):
                return line
        return None

    def _drain_output(self, timeout=0.3):
        while self._readline(timeout) is not None:
            pass

    def find_and_start_engine(self, custom_path=None):
        with self.lock:
            if self.proc:
                try:
                    self.send_cmd("quit")
                except Exception:
                    pass
                try:
                    self.proc.terminate()
                except Exception:
                    pass
                self.proc = None

            # Fresh output queue for the new process
            self._outq = queue.Queue()

            path = custom_path or self.find_engine_path()
            self.engine_path = path

            if not path:
                self.engine_name = "Không tìm thấy engine"
                self.engine_family = FAMILY_UNKNOWN
                self.last_error = "No native engine binary found."
                print("[EngineBridge] Warning: Không tìm thấy engine native. "
                      "Chạy: ./scripts/install_pikafish.sh", file=sys.stderr)
                return False

            family = detect_family(path)
            try:
                self.proc = subprocess.Popen(
                    [path],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.DEVNULL,
                    text=True,
                    bufsize=1,
                    cwd=os.path.dirname(path) or None
                )
            except Exception as e:
                self.proc = None
                self.last_error = str(e)
                print(f"[EngineBridge] Failed to launch {path}: {e}", file=sys.stderr)
                return False

            self._start_reader()

            # UCI handshake
            self.send_cmd("uci")
            name_line = self._wait_for(lambda l: l.startswith("id name"), 3.0)
            if name_line:
                self.engine_name = name_line.replace("id name", "").strip()
            detected = detect_family(self.engine_name)
            if detected != FAMILY_UNKNOWN:
                family = detected
            self.engine_family = family
            self._wait_for(lambda l: l == "uciok", 3.0)

            # Fairy-Stockfish needs the xiangqi variant, Pikafish is xiangqi-only
            if family == FAMILY_FAIRY:
                self.send_cmd("setoption name UCI_Variant value xiangqi")

            # Pikafish requires a matching NNUE network file
            if family == FAMILY_PIKAFISH:
                nnue = os.path.join(os.path.dirname(path), "pikafish.nnue")
                if not os.path.isfile(nnue):
                    nnue = os.path.join(PIKAFISH_DIR, "pikafish.nnue")
                if os.path.isfile(nnue):
                    self.eval_file = nnue
                    self.send_cmd(f"setoption name EvalFile value {nnue}")

            self.send_cmd(f"setoption name Threads value {self.threads}")
            self.send_cmd(f"setoption name Hash value {self.hash_mb}")
            self.send_cmd("isready")

            ready = self._wait_for(lambda l: l == "readyok", 4.0)
            if ready is None and self.proc.poll() is None:
                ready = self._wait_for(lambda l: l == "readyok", 4.0)

            if ready is None or self.proc.poll() is not None:
                self.last_error = "Engine did not become ready (check NNUE/variant)."
                self.proc = None
                print(f"[EngineBridge] Failed to start {self.engine_name} at {path}", file=sys.stderr)
                return False

            self.last_error = None
            print(f"[EngineBridge] Successfully started {self.engine_name} "
                  f"({self.engine_family}) at {path}")
            return True

    def send_cmd(self, cmd):
        if self.proc and self.proc.stdin:
            try:
                self.proc.stdin.write(cmd + "\n")
                self.proc.stdin.flush()
            except (BrokenPipeError, OSError):
                pass

    def get_status(self):
        return {
            "status": "ok" if self.proc and self.proc.poll() is None else "fallback",
            "engine": self.engine_name,
            "engineFamily": self.engine_family,
            "enginePath": self.engine_path,
            "evalFile": self.eval_file,
            "isNative": bool(self.proc and self.proc.poll() is None),
            "threads": self.threads,
            "hash": self.hash_mb,
            "defaultDepth": self.default_depth,
            "maxDepth": self.max_depth,
            "version": "pikafish-native-2026",
            "lastError": self.last_error
        }

    def _run_search(self, fen, depth=None, time_ms=None, multi_pv=1, active_turn="red"):
        """Send position + go, then collect info lines until bestmove. Returns a dict."""
        with self.lock:
            if not self.proc or self.proc.poll() is not None:
                if not self.find_and_start_engine():
                    return {"error": self.last_error or "Engine not available"}

            target_depth = int(depth or self.default_depth)
            normalized_fen = normalize_fen(fen, active_turn)
            num_pv = max(1, min(6, int(multi_pv)))

            self._drain_output(0.1)
            self.send_cmd(f"setoption name MultiPV value {num_pv}")
            self.send_cmd(f"position fen {normalized_fen}")
            if time_ms and int(time_ms) > 0:
                self.send_cmd(f"go movetime {int(time_ms)}")
            else:
                self.send_cmd(f"go depth {target_depth}")

            best_move_str = None
            score = 0
            nps = 0
            pv = []
            cur_depth = target_depth
            multipv_map = {}

            deadline = time.time() + 30.0
            while time.time() < deadline:
                line = self._readline(0.2)
                if line is None:
                    continue

                if line.startswith("info"):
                    parts = line.split()
                    if "score" in parts:
                        try:
                            if "cp" in parts:
                                score = int(parts[parts.index("cp") + 1])
                            elif "mate" in parts:
                                mate_in = int(parts[parts.index("mate") + 1])
                                score = (100000 - abs(mate_in) * 100) if mate_in > 0 else (-100000 + abs(mate_in) * 100)
                        except (ValueError, IndexError):
                            pass
                    if "depth" in parts:
                        try:
                            cur_depth = int(parts[parts.index("depth") + 1])
                        except (ValueError, IndexError):
                            pass
                    if "nps" in parts:
                        try:
                            nps = int(parts[parts.index("nps") + 1])
                        except (ValueError, IndexError):
                            pass
                    if "pv" in parts:
                        pv = parts[parts.index("pv") + 1:]
                    if "multipv" in parts and pv:
                        try:
                            mpv_idx = int(parts[parts.index("multipv") + 1])
                            multipv_map[mpv_idx] = {
                                "rank": mpv_idx,
                                "uci": pv[0],
                                "move": uci_to_coords(pv[0], self.engine_family),
                                "score": score,
                                "pv": pv,
                                "depth": cur_depth,
                                "nps": nps
                            }
                        except (ValueError, IndexError):
                            pass

                elif line.startswith("bestmove"):
                    parts = line.split()
                    if len(parts) > 1:
                        best_move_str = parts[1]
                    break

            if not best_move_str or best_move_str == "(none)" or best_move_str == "0000":
                return {"error": "No legal moves / Game over"}

            return {
                "engine": self.engine_name,
                "engineFamily": self.engine_family,
                "bestmove": best_move_str,
                "move": uci_to_coords(best_move_str, self.engine_family),
                "score": score,
                "depth": cur_depth,
                "nps": nps,
                "pv": pv,
                "multipv": multipv_map,
                "turn": "red" if normalized_fen.split()[1] == "w" else "black"
            }

    def get_best_move(self, fen, depth=None, time_ms=None, active_turn="red"):
        res = self._run_search(fen, depth, time_ms, 1, active_turn)
        res.pop("multipv", None)
        return res

    def analyze_strategic_options(self, fen, depth=None, multi_pv=3, active_turn="red"):
        num_pv = max(1, min(5, int(multi_pv or 3)))
        res = self._run_search(fen, depth, None, num_pv, active_turn)
        if "error" in res:
            return res

        engine_short = "Pikafish" if self.engine_family == FAMILY_PIKAFISH else "Stockfish"

        # Style templates
        style_templates = [
            {
                "style": "attack",
                "label": f"⚔️ Tấn Công Vũ Bão ({engine_short})",
                "badgeColor": "border-red-500/50 bg-red-950/30 text-red-300",
                "description": "Lựa chọn công phá sắc bén nhất được Native Engine tính toán chuẩn xác.",
                "risk": "Ưu thế tấn công tuyệt đối, ép đối phương vào thế bị động phòng thủ."
            },
            {
                "style": "solid",
                "label": f"🛡️ An Toàn Tuyệt Đối ({engine_short})",
                "badgeColor": "border-emerald-500/50 bg-emerald-950/30 text-emerald-300",
                "description": "Nước cờ củng cố thế trận kiên cố, triệt tiêu mọi cơ hội phản đòn của đối thủ.",
                "risk": "Cực kỳ chắc chắn, tạo bàn đạp vững chắc kiểm soát toàn bộ bàn cờ."
            },
            {
                "style": "control",
                "label": f"🔒 Khống Chế Bóp Nghẹt ({engine_short})",
                "badgeColor": "border-amber-500/50 bg-amber-950/30 text-amber-300",
                "description": "Chiếm lĩnh các giao điểm yết hầu, khóa chặt đường di chuyển của đối phương.",
                "risk": "Tiết tấu chắc chắn, ép đối thủ rơi vào thế cạn kiệt nước đi hợp lệ."
            }
        ]

        multipv_map = res.get("multipv", {})
        candidates = []
        for i in range(1, num_pv + 1):
            if i in multipv_map:
                cand = multipv_map[i]
                tmpl = style_templates[(i - 1) % len(style_templates)]
                candidates.append({**cand, **tmpl, "evalText": f"{cand['score'] / 100:.1f}"})

        # Fallback: if MultiPV wasn't fully populated, reuse the best move line
        if not candidates and res.get("move"):
            cand = {
                "rank": 1,
                "uci": res["bestmove"],
                "move": res["move"],
                "score": res["score"],
                "pv": res.get("pv", []),
                "depth": res["depth"],
                "nps": res.get("nps", 0)
            }
            candidates.append({**cand, **style_templates[0], "evalText": f"{cand['score'] / 100:.1f}"})

        return {
            "engine": self.engine_name,
            "engineFamily": self.engine_family,
            "depth": res.get("depth", depth),
            "nps": res.get("nps", 0),
            "candidates": candidates
        }

engine_manager = XiangqiEngineManager()

class XiangqiRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/", "/api/status", "/status"]:
            self._respond_json(200, engine_manager.get_status())
        elif parsed.path in ["/api/engines", "/engines"]:
            self._respond_json(200, {
                "engines": [
                    {
                        "id": "pikafish",
                        "name": "Pikafish",
                        "path": os.path.join(PIKAFISH_DIR, "pikafish"),
                        "available": os.path.isfile(os.path.join(PIKAFISH_DIR, "pikafish")),
                        "description": "UCI Xiangqi engine (NNUE), ELO ~4000+"
                    },
                    {
                        "id": "fairy",
                        "name": "Fairy-Stockfish",
                        "path": shutil.which("fairy-stockfish") or "/usr/local/bin/fairy-stockfish",
                        "available": bool(shutil.which("fairy-stockfish")) or os.path.isfile("/usr/local/bin/fairy-stockfish"),
                        "description": "UCI variant engine (xiangqi), ELO ~3200+"
                    }
                ]
            })
        else:
            self._respond_json(404, {"error": "Not Found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            req = json.loads(body)
        except Exception:
            self._respond_json(400, {"error": "Invalid JSON format"})
            return

        if parsed.path == "/api/bestmove":
            fen = req.get("fen", "")
            depth = req.get("depth", engine_manager.default_depth)
            time_ms = req.get("timeMs")
            turn = req.get("turn", "red")
            res = engine_manager.get_best_move(fen, depth, time_ms, turn)
            self._respond_json(200, res)

        elif parsed.path == "/api/analyze":
            fen = req.get("fen", "")
            depth = req.get("depth", engine_manager.default_depth)
            multi_pv = req.get("multiPv", 3)
            turn = req.get("turn", "red")
            res = engine_manager.analyze_strategic_options(fen, depth, multi_pv, turn)
            self._respond_json(200, res)

        elif parsed.path == "/api/config":
            custom_path = req.get("enginePath")
            if "threads" in req:
                engine_manager.threads = max(1, int(req["threads"]))
            if "hash" in req:
                engine_manager.hash_mb = max(16, int(req["hash"]))
            if "defaultDepth" in req:
                engine_manager.default_depth = max(1, min(engine_manager.max_depth, int(req["defaultDepth"])))

            success = engine_manager.find_and_start_engine(custom_path)
            self._respond_json(200, {
                "success": success,
                **engine_manager.get_status()
            })
        else:
            self._respond_json(404, {"error": "Not Found"})

    def _respond_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        # Mute normal HTTP logs to keep console neat
        if os.environ.get("DEBUG"):
            super().log_message(format, *args)

def run_server():
    server_address = (HOST, PORT)
    httpd = ThreadingHTTPServer(server_address, XiangqiRequestHandler)
    status = engine_manager.get_status()
    print("=" * 62)
    print("   👑 MÁY CHỦ NATIVE XIANGQI ENGINE BRIDGE (PIKAFISH) ")
    print(f"   Đang chạy tại      : http://{HOST}:{PORT}")
    print(f"   Engine hoạt động   : {status['engine']} ({status['engineFamily']})")
    print(f"   Đường dẫn          : {status['enginePath']}")
    print(f"   Cấu hình           : {status['threads']} threads | Hash {status['hash']}MB")
    print("=" * 62)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[EngineBridge] Đang dừng máy chủ...")
        httpd.server_close()
        if engine_manager.proc:
            try:
                engine_manager.send_cmd("quit")
                engine_manager.proc.terminate()
            except Exception:
                pass

if __name__ == "__main__":
    run_server()
