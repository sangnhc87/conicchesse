// Native UCI Xiangqi engine integration (Pikafish primary, Fairy-Stockfish fallback).
// Directly talks to the engine over UCI — no Python, no HTTP — for the Tauri desktop app.

use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{channel, Receiver};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

const FAMILY_PIKAFISH: &str = "pikafish";
const FAMILY_FAIRY: &str = "fairy";
const FAMILY_UNKNOWN: &str = "unknown";

// ------------------------------------------------------------------ helpers --

fn detect_family(s: &str) -> &'static str {
    let t = s.to_lowercase();
    if t.contains("pikafish") || t.contains("皮卡鱼") {
        FAMILY_PIKAFISH
    } else if t.contains("fairy") || t.contains("stockfish") {
        FAMILY_FAIRY
    } else {
        FAMILY_UNKNOWN
    }
}

fn file_to_col(c: char) -> Option<i32> {
    if ('a'..='i').contains(&c) {
        Some((c as u8 - b'a') as i32)
    } else {
        None
    }
}

/// UCI move -> internal {fromR, fromC, toR, toC}.
/// Internal board: r=0 = black back rank (top), r=9 = red back rank (bottom).
/// Pikafish ranks 0-9, Fairy ranks 1-10.
fn parse_uci(uci: &str, family: &str) -> Option<Value> {
    let chars: Vec<char> = uci.trim().to_lowercase().chars().collect();
    if chars.len() != 4 {
        return None;
    }
    let fc = file_to_col(chars[0])?;
    let fr: i32 = chars[1].to_digit(10)?.try_into().ok()?;
    let tc = file_to_col(chars[2])?;
    let tr: i32 = chars[3].to_digit(10)?.try_into().ok()?;
    let (from_r, to_r) = if family == FAMILY_PIKAFISH {
        (9 - fr, 9 - tr)
    } else {
        (10 - fr, 10 - tr)
    };
    Some(json!({ "fromR": from_r, "fromC": fc, "toR": to_r, "toC": tc }))
}

fn normalize_fen(fen: &str, active_turn: &str) -> String {
    let fen = if fen.trim().is_empty() {
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"
    } else {
        fen
    };
    let parts: Vec<&str> = fen.split_whitespace().collect();
    let board = parts[0];
    let mut turn = if active_turn == "red" { "w" } else { "b" };
    if let Some(t) = parts.get(1) {
        if t.eq_ignore_ascii_case("w") || t.eq_ignore_ascii_case("r") {
            turn = "w";
        } else if t.eq_ignore_ascii_case("b") {
            turn = "b";
        }
    }
    format!("{board} {turn} - - 0 1")
}

fn which(name: &str) -> Option<PathBuf> {
    let path = std::env::var("PATH").ok()?;
    for dir in path.split(':') {
        let p = Path::new(dir).join(name);
        if p.is_file() {
            return Some(p);
        }
    }
    None
}

fn resolve_engine_binary() -> Option<PathBuf> {
    // Explicit override
    if let Ok(p) = std::env::var("PIKAFISH_PATH") {
        let p = PathBuf::from(p);
        if p.is_file() {
            return Some(p);
        }
    }
    // Bundled macOS app: exe is at Contents/MacOS/, resources at Contents/Resources/
    if let Ok(exe) = std::env::current_exe() {
        if let Some(contents) = exe.parent().and_then(|p| p.parent()) {
            for rel in [
                "pikafish/pikafish",
                "resources/pikafish/pikafish",
            ] {
                let p = contents.join("Resources").join(rel);
                if p.is_file() {
                    return Some(p);
                }
            }
        }
    }
    // Dev mode: relative to the working directory
    for rel in [
        "resources/pikafish/pikafish",
        "../scripts/engines/pikafish/pikafish",
        "scripts/engines/pikafish/pikafish",
    ] {
        let p = PathBuf::from(rel);
        if p.is_file() {
            return Some(p);
        }
    }
    // PATH lookup (pikafish first, then fairy-stockfish)
    for name in ["pikafish", "fairy-stockfish", "stockfish"] {
        if let Some(p) = which(name) {
            return Some(p);
        }
    }
    None
}

// --------------------------------------------------------------- engine proc --

struct EngineProcess {
    child: Child,
    stdin: ChildStdin,
    rx: Receiver<String>,
}

impl EngineProcess {
    fn spawn(binary: &Path) -> std::io::Result<Self> {
        let cwd = binary.parent().unwrap_or_else(|| Path::new("."));
        let mut child = Command::new(binary)
            .current_dir(cwd)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()?;
        let stdin = child.stdin.take().expect("stdin");
        let stdout = child.stdout.take().expect("stdout");
        let (tx, rx) = channel::<String>();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                match line {
                    Ok(l) => {
                        if tx.send(l).is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
        });
        Ok(Self { child, stdin, rx })
    }

    fn send(&mut self, cmd: &str) {
        let _ = writeln!(self.stdin, "{cmd}");
        let _ = self.stdin.flush();
    }

    fn read_line(&self, timeout: Duration) -> Option<String> {
        match self.rx.recv_timeout(timeout) {
            Ok(l) => Some(l),
            Err(_) => None,
        }
    }

    fn wait_for(&self, pred: impl Fn(&str) -> bool, timeout: Duration) -> Option<String> {
        let deadline = Instant::now() + timeout;
        while Instant::now() < deadline {
            let remaining = deadline.saturating_duration_since(Instant::now());
            if remaining.is_zero() {
                break;
            }
            match self.read_line(remaining) {
                Some(l) if pred(&l) => return Some(l),
                Some(_) => continue,
                None => return None,
            }
        }
        None
    }

    fn alive(&mut self) -> bool {
        matches!(self.child.try_wait(), Ok(None))
    }

    fn kill(&mut self) {
        let _ = writeln!(self.stdin, "quit");
        let _ = self.stdin.flush();
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

// ------------------------------------------------------------------- state --

struct Inner {
    proc: Option<EngineProcess>,
    engine_name: String,
    engine_family: String,
    engine_path: Option<PathBuf>,
    eval_file: Option<PathBuf>,
    threads: i32,
    hash_mb: i32,
    default_depth: i32,
    max_depth: i32,
    last_error: Option<String>,
}

impl Default for Inner {
    fn default() -> Self {
        let cpus = std::thread::available_parallelism()
            .map(|n| n.get() as i32)
            .unwrap_or(8);
        Self {
            proc: None,
            engine_name: "Pikafish".into(),
            engine_family: FAMILY_PIKAFISH.into(),
            engine_path: None,
            eval_file: None,
            threads: (cpus / 2).max(1),
            hash_mb: 128,
            default_depth: 16,
            max_depth: 30,
            last_error: None,
        }
    }
}

use std::sync::atomic::{AtomicBool, Ordering};

pub struct EngineState {
    inner: Mutex<Inner>,
    cached: Mutex<Value>,
    abort_flag: AtomicBool,
}

impl EngineState {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(Inner::default()),
            cached: Mutex::new(json!({
                "status": "ready",
                "engine": "Pikafish",
                "engineFamily": "pikafish",
                "isNative": true,
                "version": "pikafish-native-tauri"
            })),
            abort_flag: AtomicBool::new(false),
        }
    }

    pub fn start_engine(&self, custom_path: Option<PathBuf>) -> bool {
        let mut inner = self.inner.lock().unwrap();
        let ok = self.start_engine_locked(&mut inner, custom_path);
        self.refresh_cache(&mut inner);
        ok
    }

    fn refresh_cache(&self, inner: &mut Inner) {
        let alive = inner.proc.as_mut().map(|p| p.alive()).unwrap_or(false);
        let status_text = if alive { "ok" } else { "fallback" };
        let status = json!({
            "status": status_text,
            "engine": &inner.engine_name,
            "engineFamily": &inner.engine_family,
            "enginePath": inner.engine_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            "evalFile": inner.eval_file.as_ref().map(|p| p.to_string_lossy().to_string()),
            "isNative": alive,
            "threads": inner.threads,
            "hash": inner.hash_mb,
            "defaultDepth": inner.default_depth,
            "maxDepth": inner.max_depth,
            "version": "pikafish-native-tauri",
            "lastError": &inner.last_error
        });
        if let Ok(mut cached) = self.cached.lock() {
            *cached = status;
        }
    }

    fn ensure_engine(&self, inner: &mut Inner) -> bool {
        let alive = inner.proc.as_mut().map(|p| p.alive()).unwrap_or(false);
        if alive {
            true
        } else {
            drop(inner.proc.take());
            self.start_engine_locked(inner, None)
        }
    }

    fn start_engine_locked(&self, inner: &mut Inner, custom_path: Option<PathBuf>) -> bool {
        if let Some(mut p) = inner.proc.take() {
            p.kill();
        }
        let binary = custom_path
            .or_else(|| inner.engine_path.clone())
            .or_else(resolve_engine_binary);
        inner.engine_path = binary.clone();
        inner.eval_file = None;

        let Some(binary) = binary else {
            inner.engine_name = "Không tìm thấy engine".into();
            inner.engine_family = FAMILY_UNKNOWN.into();
            inner.last_error = Some("No native engine binary found.".into());
            return false;
        };

        let mut family = detect_family(&binary.to_string_lossy());
        let mut proc = match EngineProcess::spawn(&binary) {
            Ok(p) => p,
            Err(e) => {
                inner.last_error = Some(format!("Failed to launch: {e}"));
                return false;
            }
        };

        proc.send("uci");
        if let Some(line) = proc.wait_for(|l| l.starts_with("id name"), Duration::from_secs(3)) {
            inner.engine_name = line.trim_start_matches("id name").trim().to_string();
        }
        let detected = detect_family(&inner.engine_name);
        if detected != FAMILY_UNKNOWN {
            family = detected;
        }
        inner.engine_family = family.to_string();
        proc.wait_for(|l| l == "uciok", Duration::from_secs(3));

        if family == FAMILY_FAIRY {
            proc.send("setoption name UCI_Variant value xiangqi");
        }
        if family == FAMILY_PIKAFISH {
            if let Some(nn) = binary
                .parent()
                .map(|d| d.join("pikafish.nnue"))
                .filter(|p| p.is_file())
            {
                inner.eval_file = Some(nn.clone());
                proc.send(&format!("setoption name EvalFile value {}", nn.display()));
            }
        }

        proc.send(&format!("setoption name Threads value {}", inner.threads));
        proc.send(&format!("setoption name Hash value {}", inner.hash_mb));
        proc.send("isready");

        let ready = proc.wait_for(|l| l == "readyok", Duration::from_secs(4));
        let ready = if ready.is_none() && proc.alive() {
            proc.wait_for(|l| l == "readyok", Duration::from_secs(4))
        } else {
            ready
        };

        if ready.is_none() || !proc.alive() {
            inner.last_error = Some("Engine did not become ready (check NNUE/variant).".into());
            return false;
        }

        inner.last_error = None;
        inner.proc = Some(proc);
        true
    }

    fn run_search(
        &self,
        fen: &str,
        depth: Option<i32>,
        time_ms: Option<u64>,
        multi_pv: i32,
        active_turn: &str,
    ) -> Value {
        self.abort_flag.store(true, Ordering::SeqCst);
        let mut inner = self.inner.lock().unwrap();
        self.abort_flag.store(false, Ordering::SeqCst);
        
        if !self.ensure_engine(&mut inner) {
            return json!({ "error": inner.last_error.clone().unwrap_or_else(|| "Engine not available".into()) });
        }

        let target_depth = depth.unwrap_or(inner.default_depth);
        let normalized = normalize_fen(fen, active_turn);
        let num_pv = multi_pv.clamp(1, 6);

        let family = inner.engine_family.clone();
        let engine_name = inner.engine_name.clone();

        let proc = inner.proc.as_mut().unwrap();
        // Drain any leftover output from a previous search
        while proc.read_line(Duration::from_millis(80)).is_some() {}

        proc.send(&format!("setoption name MultiPV value {num_pv}"));
        proc.send(&format!("position fen {normalized}"));
        if let Some(t) = time_ms {
            if t > 0 {
                proc.send(&format!("go movetime {t}"));
            } else {
                proc.send(&format!("go depth {target_depth}"));
            }
        } else {
            proc.send(&format!("go depth {target_depth}"));
        }

        let mut best_move: Option<String> = None;
        let mut score: i64 = 0;
        let mut nps: i64 = 0;
        let mut pv: Vec<String> = Vec::new();
        let mut cur_depth = target_depth;
        let mut multipv: BTreeMap<i32, Value> = BTreeMap::new();

        let deadline = Instant::now() + Duration::from_secs(30);
        while Instant::now() < deadline {
            if self.abort_flag.load(Ordering::SeqCst) {
                // Another request came in, abort the current search!
                proc.send("stop");
                // Consume output briefly until bestmove or timeout
                let abort_deadline = Instant::now() + Duration::from_millis(500);
                while Instant::now() < abort_deadline {
                    if let Some(l) = proc.read_line(Duration::from_millis(50)) {
                        if l.starts_with("bestmove") {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                return json!({ "error": "aborted by new request" });
            }

            let line = match proc.read_line(Duration::from_millis(100)) {
                Some(l) => l,
                None => continue,
            };

            if line.starts_with("info") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                let mut line_score: Option<i64> = None;
                let mut mate_in: Option<i64> = None;
                let mut line_depth: Option<i32> = None;
                let mut line_nps: Option<i64> = None;
                let mut line_pv: Vec<String> = Vec::new();
                let mut mpv_idx: Option<i32> = None;

                let mut i = 0;
                while i < parts.len() {
                    match parts[i] {
                        "cp" => line_score = parts.get(i + 1).and_then(|s| s.parse().ok()),
                        "mate" => mate_in = parts.get(i + 1).and_then(|s| s.parse().ok()),
                        "depth" => line_depth = parts.get(i + 1).and_then(|s| s.parse().ok()),
                        "nps" => line_nps = parts.get(i + 1).and_then(|s| s.parse().ok()),
                        "multipv" => mpv_idx = parts.get(i + 1).and_then(|s| s.parse().ok()),
                        "pv" => {
                            line_pv = parts[i + 1..].iter().map(|s| s.to_string()).collect();
                            break;
                        }
                        _ => {}
                    }
                    i += 1;
                }

                if let Some(m) = mate_in {
                    score = if m > 0 {
                        100_000 - m.abs() * 100
                    } else {
                        -100_000 + m.abs() * 100
                    };
                } else if let Some(s) = line_score {
                    score = s;
                }
                if let Some(d) = line_depth {
                    cur_depth = d;
                }
                if let Some(n) = line_nps {
                    nps = n;
                }
                if !line_pv.is_empty() {
                    pv = line_pv.clone();
                }
                if let Some(idx) = mpv_idx {
                    if let Some(first) = line_pv.first() {
                        let score_text = if let Some(m) = mate_in {
                            format!("{}M{}", if m > 0 { "#" } else { "-#" }, m.abs())
                        } else {
                            format!("{:.2}", score as f64 / 100.0)
                        };
                        multipv.insert(
                            idx,
                            json!({
                                "rank": idx,
                                "uci": first,
                                "move": parse_uci(first, &family),
                                "score": score,
                                "scoreText": score_text,
                                "pv": line_pv,
                                "depth": cur_depth,
                                "nps": nps
                            }),
                        );
                    }
                }
            } else if line.starts_with("bestmove") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() > 1 {
                    best_move = Some(parts[1].to_string());
                }
                break;
            }
        }

        let Some(bm) = best_move else {
            return json!({ "error": "No legal moves / Game over" });
        };
        if bm == "(none)" || bm == "0000" {
            return json!({ "error": "No legal moves / Game over" });
        }

        let mv = parse_uci(&bm, &family);
        let turn = if normalized.split_whitespace().nth(1) == Some("w") {
            "red"
        } else {
            "black"
        };

        json!({
            "engine": engine_name,
            "engineFamily": family,
            "bestmove": bm,
            "move": mv,
            "score": score,
            "depth": cur_depth,
            "nps": nps,
            "pv": pv,
            "turn": turn,
            "multipv": multipv
        })
    }

    // ------------------------------------------------------------ public API --

    pub fn status(&self) -> Value {
        // Non-blocking: if a search is in progress, serve the cached snapshot.
        if let Ok(mut inner) = self.inner.try_lock() {
            self.refresh_cache(&mut inner);
        }
        self.cached.lock().unwrap().clone()
    }

    pub fn best_move(
        &self,
        fen: &str,
        depth: Option<i32>,
        time_ms: Option<u64>,
        active_turn: &str,
    ) -> Value {
        let mut res = self.run_search(fen, depth, time_ms, 1, active_turn);
        if let Value::Object(ref mut map) = res {
            map.remove("multipv");
        }
        res
    }

    pub fn analyze(
        &self,
        fen: &str,
        depth: Option<i32>,
        multi_pv: i32,
        active_turn: &str,
    ) -> Value {
        let num_pv = multi_pv.clamp(1, 5);
        let res = self.run_search(fen, depth, None, num_pv, active_turn);
        if res.get("error").is_some() {
            return res;
        }

        let inner = self.inner.lock().unwrap();
        let engine_name = inner.engine_name.clone();
        let family = inner.engine_family.clone();
        drop(inner);

        let engine_short = if family == FAMILY_PIKAFISH {
            "Pikafish"
        } else {
            "Stockfish"
        };

        let styles = [
            json!({
                "style": "attack",
                "label": format!("⚔️ Tấn Công Vũ Bão ({engine_short})"),
                "badgeColor": "border-red-500/50 bg-red-950/30 text-red-300",
                "description": "Lựa chọn công phá sắc bén nhất được Native Engine tính toán chuẩn xác.",
                "risk": "Ưu thế tấn công tuyệt đối, ép đối phương vào thế bị động phòng thủ."
            }),
            json!({
                "style": "solid",
                "label": format!("🛡️ An Toàn Tuyệt Đối ({engine_short})"),
                "badgeColor": "border-emerald-500/50 bg-emerald-950/30 text-emerald-300",
                "description": "Nước cờ củng cố thế trận kiên cố, triệt tiêu mọi cơ hội phản đòn của đối thủ.",
                "risk": "Cực kỳ chắc chắn, tạo bàn đạp vững chắc kiểm soát toàn bộ bàn cờ."
            }),
            json!({
                "style": "control",
                "label": format!("🔒 Khống Chế Bóp Nghẹt ({engine_short})"),
                "badgeColor": "border-amber-500/50 bg-amber-950/30 text-amber-300",
                "description": "Chiếm lĩnh các giao điểm yết hầu, khóa chặt đường di chuyển của đối phương.",
                "risk": "Tiết tấu chắc chắn, ép đối thủ rơi vào thế cạn kiệt nước đi hợp lệ."
            }),
        ];

        let multipv = res
            .get("multipv")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default();
        let mut candidates = Vec::new();
        for i in 1..=num_pv {
            if let Some(cand) = multipv.get(&i.to_string()) {
                let mut c = cand.clone();
                if let Value::Object(obj) = &mut c {
                    let tmpl = &styles[((i as usize) - 1) % styles.len()];
                    for (k, v) in tmpl.as_object().unwrap() {
                        obj.insert(k.clone(), v.clone());
                    }
                    let score = obj.get("score").and_then(Value::as_i64).unwrap_or(0);
                    if score >= 99000 {
                        let mate_in = ((100000 - score) / 100).max(1);
                        obj.insert("isMate".into(), json!(true));
                        obj.insert("mateIn".into(), json!(mate_in));
                        obj.insert("scoreText".into(), json!(format!("#M{mate_in}")));
                        obj.insert("evalText".into(), json!(format!("#M{mate_in}")));
                    } else if score <= -99000 {
                        let mate_in = ((100000 + score) / 100).min(-1);
                        obj.insert("isMate".into(), json!(true));
                        obj.insert("mateIn".into(), json!(mate_in));
                        obj.insert("scoreText".into(), json!(format!("-#M{}", -mate_in)));
                        obj.insert("evalText".into(), json!(format!("-#M{}", -mate_in)));
                    } else {
                        obj.insert("isMate".into(), json!(false));
                        obj.insert("scoreText".into(), json!(format!("cp {score}")));
                        obj.insert("evalText".into(), json!(format!("{:.1}", score as f64 / 100.0)));
                    }
                }
                candidates.push(c);
            }
        }

        json!({
            "engine": engine_name,
            "engineFamily": family,
            "depth": res.get("depth").cloned().unwrap_or_else(|| json!(0)),
            "nps": res.get("nps").cloned().unwrap_or_else(|| json!(0)),
            "candidates": candidates
        })
    }

    pub fn find_mate(&self, fen: &str, active_turn: &str, max_moves: i32, time_ms: Option<u64>) -> Value {
        let mut inner = self.inner.lock().unwrap();
        if !self.ensure_engine(&mut inner) {
            return json!({ "error": inner.last_error.clone().unwrap_or_else(|| "Engine not available".into()) });
        }

        let normalized = normalize_fen(fen, active_turn);
        // plies = nước Đen x2 để tính cả nước phản thủ (mỗi nước Đỏ cần 1 reply từ Đen)
        let plies = (max_moves * 2).clamp(2, 200);
        // Thời gian tối đa: ưu tiên user truyền vào, fallback theo độ sâu
        let time_limit_ms = time_ms.unwrap_or_else(|| {
            // Cắt giảm thời gian tối đa để tránh treo app quá lâu nếu không có sát cục
            if max_moves <= 5 { 5_000 }
            else if max_moves <= 10 { 8_000 }
            else { 15_000 }
        });

        let family = inner.engine_family.clone();
        let engine_name = inner.engine_name.clone();
        let max_threads = inner.threads;

        let proc = inner.proc.as_mut().unwrap();
        while proc.read_line(Duration::from_millis(80)).is_some() {}

        // Tối ưu cho mate search: MultiPV=1, thread max, hash lớn
        proc.send("setoption name MultiPV value 1");
        proc.send(&format!("setoption name Threads value {max_threads}"));
        proc.send("setoption name Hash value 512");
        proc.send(&format!("position fen {normalized}"));
        // Sử dụng tìm kiếm tiêu chuẩn (alpha-beta) thay vì "go mate".
        // Lệnh "go mate" trong Pikafish đôi khi bị bỏ qua hoặc tìm kiếm quá lâu (dùng breadth-first).
        proc.send(&format!("go depth 40 movetime {time_limit_ms}"));

        let mut mate_in: Option<i64> = None;
        let mut best_move: Option<String> = None;
        let mut pv: Vec<String> = Vec::new();
        let mut cur_depth = 0i32;
        let mut nps = 0i64;
        let mut last_info_score: Option<i64> = None;

        // Deadline đủ rộng để không bị timeout trước engine
        let deadline = Instant::now() + Duration::from_millis(time_limit_ms + 5000);
        while Instant::now() < deadline {
            let line = match proc.read_line(Duration::from_millis(200)) {
                Some(l) => l,
                None => continue,
            };
            if line.starts_with("info") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                let mut i = 0;
                let mut line_pv: Vec<String> = Vec::new();
                let mut found_mate: Option<i64> = None;
                while i < parts.len() {
                    match parts[i] {
                        "mate" => {
                            found_mate = parts.get(i + 1).and_then(|s| s.parse().ok());
                            if let Some(m) = found_mate {
                                last_info_score = Some(if m > 0 { 100_000 - m * 100 } else { -100_000 + m.abs() * 100 });
                            }
                        }
                        "depth" => cur_depth = parts.get(i + 1).and_then(|s| s.parse().ok()).unwrap_or(cur_depth),
                        "nps" => nps = parts.get(i + 1).and_then(|s| s.parse().ok()).unwrap_or(nps),
                        "pv" => {
                            line_pv = parts[i + 1..].iter().map(|s| s.to_string()).collect();
                            break;
                        }
                        _ => {}
                    }
                    i += 1;
                }
                // Chỉ cập nhật kết quả nếu đây là mate dương (Red thắng)
                if let Some(m) = found_mate {
                    if m > 0 {
                        mate_in = found_mate;
                        if !line_pv.is_empty() {
                            pv = line_pv;
                        }
                    }
                    // Dù là mate âm hay dương, thế cờ đã được giải quyết triệt để (có người bị chiếu bí).
                    // Gửi lệnh stop ngay lập tức để tiết kiệm thời gian (thay vì đợi hết movetime).
                    proc.send("stop");
                }
            } else if line.starts_with("bestmove") {
                let p: Vec<&str> = line.split_whitespace().collect();
                if p.len() > 1 {
                    best_move = Some(p[1].to_string());
                }
                break;
            }
        }

        // Restore threads về mức mặc định sau mate search
        if let Some(proc2) = inner.proc.as_mut() {
            proc2.send(&format!("setoption name Threads value {max_threads}"));
            proc2.send("setoption name Hash value 128");
        }

        let Some(bm) = best_move else {
            return json!({ "mate": false, "error": "No bestmove returned" });
        };
        if bm == "(none)" || bm == "0000" {
            return json!({ "mate": false, "error": "No legal moves / Game over" });
        }

        // is_mate: engine trả mate dương (Red chiếu bí Black)
        let is_mate = mate_in.map(|m| m > 0).unwrap_or(false);

        // Build moves array từ PV — bao gồm cả nước Đen phản thủ
        let moves: Vec<Value> = pv
            .iter()
            .filter_map(|u| {
                parse_uci(u, &family).map(|mv| json!({ "uci": u, "move": mv }))
            })
            .collect();

        let score_text = if is_mate {
            format!("#M{}", mate_in.unwrap_or(1))
        } else {
            last_info_score.map(|s| format!("{:.1}", s as f64 / 100.0)).unwrap_or_else(|| "?".into())
        };

        json!({
            "engine": engine_name,
            "engineFamily": family,
            "mate": is_mate,
            "mateIn": mate_in,
            "bestmove": bm,
            "move": parse_uci(&bm, &family),
            "pv": pv,
            "moves": moves,
            "depth": cur_depth,
            "nps": nps,
            "scoreText": score_text,
            "turn": if normalized.split_whitespace().nth(1) == Some("w") { "red" } else { "black" }
        })
    }

    pub fn configure(
        &self,
        engine_path: Option<String>,
        threads: Option<i32>,
        hash: Option<i32>,
        depth: Option<i32>,
    ) -> Value {
        {
            let mut inner = self.inner.lock().unwrap();
            if let Some(t) = threads {
                inner.threads = t.max(1);
            }
            if let Some(h) = hash {
                inner.hash_mb = h.max(16);
            }
            if let Some(d) = depth {
                inner.default_depth = d.clamp(1, inner.max_depth);
            }
        }

        let custom = engine_path.and_then(|p| {
            let path = PathBuf::from(p);
            if path.is_file() {
                Some(path)
            } else {
                None
            }
        });

        let ok = self.start_engine(custom);
        let status = self.status();
        let mut map = status
            .as_object()
            .cloned()
            .unwrap_or_default();
        map.insert("success".into(), json!(ok));
        Value::Object(map)
    }
}

// Manual drop of the Sender type so the reader thread ends cleanly when dropped.
impl Drop for EngineProcess {
    fn drop(&mut self) {
        // The child process and reader thread are cleaned up when the channel is closed.
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
