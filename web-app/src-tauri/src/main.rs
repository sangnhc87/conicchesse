#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod engine;

use engine::EngineState;
use serde_json::Value;

#[tauri::command]
fn get_status(state: tauri::State<'_, EngineState>) -> Value {
    state.status()
}

#[tauri::command(rename_all = "camelCase")]
fn best_move(
    state: tauri::State<'_, EngineState>,
    fen: String,
    depth: Option<i32>,
    time_ms: Option<u64>,
    turn: Option<String>,
) -> Value {
    state.best_move(&fen, depth, time_ms, turn.as_deref().unwrap_or("red"))
}

#[tauri::command(rename_all = "camelCase")]
fn analyze(
    state: tauri::State<'_, EngineState>,
    fen: String,
    depth: Option<i32>,
    multi_pv: Option<i32>,
    turn: Option<String>,
) -> Value {
    state.analyze(&fen, depth, multi_pv.unwrap_or(3), turn.as_deref().unwrap_or("red"))
}

#[tauri::command(rename_all = "camelCase")]
fn configure(
    state: tauri::State<'_, EngineState>,
    engine_path: Option<String>,
    threads: Option<i32>,
    hash: Option<i32>,
    default_depth: Option<i32>,
) -> Value {
    state.configure(engine_path, threads, hash, default_depth)
}

fn main() {
    tauri::Builder::default()
        .manage(EngineState::new())
        .invoke_handler(tauri::generate_handler![get_status, best_move, analyze, configure])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
