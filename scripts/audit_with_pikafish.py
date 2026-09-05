#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pikafish NNUE Mate Verifier & Auditor
Use the world's #1 Xiangqi engine (Pikafish NNUE) to verify mate in N moves.
"""

import os
import sys
import subprocess
import time

ENGINE_PATH = os.path.abspath("scripts/engines/pikafish/pikafish")

class PikafishAuditor:
    def __init__(self, engine_path=ENGINE_PATH):
        if not os.path.exists(engine_path):
            raise FileNotFoundError(f"Engine not found at {engine_path}")
        self.process = subprocess.Popen(
            [engine_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self._send("uci")
        self._wait_for("uciok")
        self._send("setoption name MultiPV value 2") # Detect dual solutions
        self._send("isready")
        self._wait_for("readyok")

    def _send(self, cmd):
        self.process.stdin.write(f"{cmd}\n")
        self.process.stdin.flush()

    def _wait_for(self, target):
        while True:
            line = self.process.stdout.readline()
            if not line or target in line:
                break

    def verify_mate(self, fen, expected_mate_n=None, max_depth=15, timeout=5.0):
        """
        Verify if a FEN position has a forced checkmate.
        Returns: { 'is_mate': bool, 'mate_n': int, 'best_move': str, 'pv': list, 'dual': bool }
        """
        self._send(f"position fen {fen}")
        if expected_mate_n:
            self._send(f"go mate {expected_mate_n}")
        else:
            self._send(f"go depth {max_depth}")

        start_time = time.time()
        best_move = ""
        pv_moves = []
        found_mate = False
        mate_moves = None
        multipv_mates = []

        while True:
            if time.time() - start_time > timeout:
                self._send("stop")

            line = self.process.stdout.readline()
            if not line:
                break
            line = line.strip()

            if line.startswith("info") and "score mate" in line:
                parts = line.split()
                try:
                    score_idx = parts.index("mate")
                    mate_val = int(parts[score_idx + 1])
                    if mate_val > 0: # Positive mate for active player
                        found_mate = True
                        mate_moves = mate_val
                        if "pv" in parts:
                            pv_idx = parts.index("pv")
                            pv_moves = parts[pv_idx + 1:]
                        if "multipv" in parts:
                            mpv_idx = parts.index("multipv")
                            multipv_mates.append((int(parts[mpv_idx + 1]), mate_val))
                except:
                    pass

            if line.startswith("bestmove"):
                parts = line.split()
                if len(parts) > 1:
                    best_move = parts[1]
                break

        dual = False
        # If multipv 1 and multipv 2 both have positive mate with same or close score
        if len(multipv_mates) >= 2:
            m1 = [m[1] for m in multipv_mates if m[0] == 1]
            m2 = [m[1] for m in multipv_mates if m[0] == 2]
            if m1 and m2 and m1[-1] == m2[-1]:
                dual = True

        return {
            "is_mate": found_mate,
            "mate_n": mate_moves,
            "best_move": best_move,
            "pv": pv_moves,
            "dual": dual
        }

    def close(self):
        try:
            self._send("quit")
            self.process.terminate()
        except:
            pass

def main():
    print("🤖 Đang khởi động Pikafish NNUE để thẩm định sát cục...")
    auditor = PikafishAuditor()

    test_fens = [
        ("3ak4/4a4/9/9/9/9/9/4R4/9/4K4 w - - 0 1", 1, "Xe đâm đáy"),
        ("5a3/4a4/3kb2NC/9/9/9/9/3C5/5p1n1/3AK1c2 w - - 0 1", 2, "Mã Pháo Sát (2 nước)"),
        ("9/4a4/3ak4/N8/9/9/9/9/9/5K3 w - - 0 1", 3, "Đơn Mã Sát (3 nước)")
    ]

    print("-" * 60)
    for fen, expected_n, desc in test_fens:
        print(f"Kiểm tra: {desc} (Kỳ vọng {expected_n} nước bí)")
        res = auditor.verify_mate(fen, expected_mate_n=expected_n)
        status = "✅ CHUẨN XÁC" if res["is_mate"] and res["mate_n"] == expected_n else "⚠️ CHƯA KHỚP"
        print(f"  Kết quả: {status} | Mate: {res['mate_n']} nước | Nước đi tối ưu: {res['best_move']} | PV: {' '.join(res['pv'][:4])}")
        print("-" * 60)

    auditor.close()
    print("🎉 Thẩm định hoàn tất!")

if __name__ == "__main__":
    main()
