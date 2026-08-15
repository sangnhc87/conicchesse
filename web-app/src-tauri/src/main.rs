#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod engine;

use engine::EngineState;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn get_downloads_dir() -> PathBuf {
    if let Some(home) = std::env::var_os("HOME") {
        let p = PathBuf::from(home).join("Downloads");
        if p.exists() {
            return p;
        }
    }
    std::env::temp_dir()
}

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

#[tauri::command(rename_all = "camelCase")]
fn export_book_html(content: String, filename: Option<String>) -> Result<String, String> {
    let raw_name = filename.unwrap_or_else(|| "Ky_Pho_Co_Tuong_Conic".to_string());
    let safe_name = raw_name.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    let full_filename = if safe_name.ends_with(".html") {
        safe_name
    } else {
        format!("{}.html", safe_name)
    };

    let dir = get_downloads_dir();
    let target_path = dir.join(&full_filename);

    fs::write(&target_path, content.as_bytes())
        .map_err(|e| format!("Failed writing file: {}", e))?;

    let path_str = target_path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg("-R").arg(&path_str).spawn();
    }

    Ok(path_str)
}

#[tauri::command(rename_all = "camelCase")]
fn print_or_open_html(
    content: String,
    filename: Option<String>,
    auto_print: Option<bool>,
) -> Result<String, String> {
    let mut final_content = content;
    if auto_print.unwrap_or(true) {
        if !final_content.contains("window.print()") {
            let script = "<script>window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 400); });</script>";
            if let Some(pos) = final_content.rfind("</body>") {
                final_content.insert_str(pos, script);
            } else {
                final_content.push_str(script);
            }
        }
    }

    let raw_name = filename.unwrap_or_else(|| "Ky_Pho_Co_Tuong_Conic_In_Sach".to_string());
    let safe_name = raw_name.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    let full_filename = if safe_name.ends_with(".html") {
        safe_name
    } else {
        format!("{}.html", safe_name)
    };

    let dir = get_downloads_dir();
    let target_path = dir.join(&full_filename);

    fs::write(&target_path, final_content.as_bytes())
        .map_err(|e| format!("Failed writing file: {}", e))?;

    let path_str = target_path.to_string_lossy().to_string();

    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&path_str).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("cmd").args(["/C", "start", &path_str]).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("xdg-open").arg(&path_str).spawn();
    }

    Ok(path_str)
}

#[tauri::command(rename_all = "camelCase")]
async fn export_pdf_direct(content: String, filename: Option<String>) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let raw_name = filename.unwrap_or_else(|| "Ky_Pho_Co_Tuong_Conic".to_string());
        let safe_name = raw_name.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
        let pdf_filename = if safe_name.ends_with(".pdf") {
            safe_name
        } else {
            format!("{}.pdf", safe_name)
        };

        let dir = get_downloads_dir();
        let target_pdf_path = dir.join(&pdf_filename);

        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis();
        let temp_html_path = std::env::temp_dir().join(format!("temp_book_{}.html", ts));

        fs::write(&temp_html_path, content.as_bytes())
            .map_err(|e| format!("Failed writing temp HTML: {}", e))?;

        let user_data_dir = std::env::temp_dir().join(format!("chrome_pdf_{}", ts));
        let crash_dumps_dir = std::env::temp_dir();

        let browser_candidates = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ];

        let mut generated_pdf = false;

        for candidate in &browser_candidates {
            if std::path::Path::new(candidate).exists() {
                if let Ok(mut child) = Command::new(candidate)
                    .args([
                        "--headless=new",
                        "--disable-gpu",
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-software-rasterizer",
                        "--disable-extensions",
                        "--disable-background-networking",
                        "--disable-default-apps",
                        "--disable-sync",
                        "--disable-translate",
                        "--mute-audio",
                        "--no-first-run",
                        "--no-default-browser-check",
                        "--run-all-compositor-stages-before-draw",
                        &format!("--user-data-dir={}", user_data_dir.to_string_lossy()),
                        &format!("--crash-dumps-dir={}", crash_dumps_dir.to_string_lossy()),
                        "--no-pdf-header-footer",
                        &format!("--print-to-pdf={}", target_pdf_path.to_string_lossy()),
                        &temp_html_path.to_string_lossy(),
                    ])
                    .spawn()
                {
                    // Actively monitor until PDF file is completely written
                    let mut prev_size = 0u64;
                    let mut stable_count = 0;
                    for _ in 0..80 {
                        std::thread::sleep(std::time::Duration::from_millis(250));
                        if target_pdf_path.exists() {
                            if let Ok(meta) = fs::metadata(&target_pdf_path) {
                                let cur_size = meta.len();
                                if cur_size > 1024 {
                                    if cur_size == prev_size {
                                        stable_count += 1;
                                        if stable_count >= 2 {
                                            generated_pdf = true;
                                            break;
                                        }
                                    } else {
                                        prev_size = cur_size;
                                        stable_count = 0;
                                    }
                                }
                            }
                        }
                        if let Ok(Some(status)) = child.try_wait() {
                            if status.success() && target_pdf_path.exists() {
                                generated_pdf = true;
                            }
                            break;
                        }
                    }

                    // Terminate child helper processes immediately so Tauri never waits or hangs
                    let _ = child.kill();
                    let _ = child.wait();

                    if generated_pdf {
                        break;
                    }
                }
            }
        }

        let _ = fs::remove_file(&temp_html_path);
        let _ = fs::remove_dir_all(&user_data_dir);

        if generated_pdf {
            let path_str = target_pdf_path.to_string_lossy().to_string();
            #[cfg(target_os = "macos")]
            {
                let _ = Command::new("open").arg(&path_str).spawn();
                let _ = Command::new("open").arg("-R").arg(&path_str).spawn();
            }
            #[cfg(target_os = "windows")]
            {
                let _ = Command::new("cmd").args(["/C", "start", &path_str]).spawn();
            }
            #[cfg(target_os = "linux")]
            {
                let _ = Command::new("xdg-open").arg(&path_str).spawn();
            }
            Ok(path_str)
        } else {
            // Fallback: If no headless browser is available, open HTML in browser
            print_or_open_html(content, Some(pdf_filename.replace(".pdf", "")), Some(true))
        }
    })
    .await
    .map_err(|e| format!("Asynchronous task failed: {}", e))?
}

fn main() {
    tauri::Builder::default()
        .manage(EngineState::new())
        .invoke_handler(tauri::generate_handler![
            get_status,
            best_move,
            analyze,
            configure,
            export_book_html,
            print_or_open_html,
            export_pdf_direct
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
