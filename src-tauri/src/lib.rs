use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri::Manager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;

#[derive(Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
struct LlmConfig {
    base_url: Option<String>,
    api_key: Option<String>,
    model: Option<String>,
    character_name: Option<String>,
    system_prompt: Option<String>,
}

fn config_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("无法定位配置目录: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("config.local.json"))
}

fn read_config(app: &tauri::AppHandle) -> Result<LlmConfig, String> {
    let path = config_path(app)?;
    if !path.exists() {
        return Ok(LlmConfig::default());
    }
    let raw = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> Result<LlmConfig, String> {
    read_config(&app)
}

#[tauri::command]
fn save_config(cfg: LlmConfig, app: tauri::AppHandle) -> Result<(), String> {
    let path = config_path(&app)?;
    let raw = serde_json::to_string_pretty(&cfg).map_err(|e| e.to_string())?;
    std::fs::write(&path, raw).map_err(|e| e.to_string())
}

fn open_settings(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.show();
        let _ = w.set_focus();
    } else {
        let _ = tauri::WebviewWindowBuilder::new(
            app,
            "settings",
            tauri::WebviewUrl::App("settings.html".into()),
        )
        .title("JingShi Pet 设置")
        .inner_size(440.0, 620.0)
        .resizable(false)
        .build();
    }
}

fn pick_avatar(app: &tauri::AppHandle) {
    use tauri_plugin_dialog::DialogExt;
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let picked = app
            .dialog()
            .file()
            .add_filter("图片", &["png", "jpg", "jpeg", "webp", "gif", "bmp"])
            .blocking_pick_file();
        if let Some(file) = picked {
            if let Ok(src) = file.into_path() {
                if let Ok(dir) = app.path().app_data_dir() {
                    let _ = std::fs::create_dir_all(&dir);
                    let dst = dir.join("avatar.png");
                    if std::fs::copy(&src, &dst).is_ok() {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.emit("avatar-updated", ());
                        }
                    }
                }
            }
        }
    });
}

#[tauri::command]
fn get_avatar_base64(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join("avatar.png");
    if !path.exists() {
        return Ok(String::new());
    }
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
    Ok(format!("data:image/png;base64,{b64}"))
}

#[tauri::command]
async fn ask_llm(history: Vec<serde_json::Value>, app: tauri::AppHandle) -> Result<String, String> {
    let cfg = read_config(&app)?;
    let key = cfg.api_key.ok_or("config.local.json 缺少 apiKey")?;
    let base = cfg
        .base_url
        .unwrap_or_else(|| "https://api.deepseek.com".into());
    let model = cfg.model.unwrap_or_else(|| "deepseek-v4-flash".into());

    // 人设/系统提示（用户画像）注入对话开头
    let mut messages: Vec<serde_json::Value> = Vec::new();
    if let Some(sp) = cfg.system_prompt.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty()) {
        messages.push(serde_json::json!({"role": "system", "content": sp}));
    }
    if let Some(name) = cfg.character_name.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty()) {
        messages.push(serde_json::json!({"role": "system", "content": format!("你的名字叫 {name}，这是你的角色设定，保持角色扮演。")}));
    }
    messages.extend(history);

    let url = format!("{}/v1/chat/completions", base.trim_end_matches('/'));
    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": false
    });

    let result = tauri::async_runtime::spawn_blocking(move || {
        ureq::post(&url)
            .set("Authorization", &format!("Bearer {key}"))
            .send_json(payload)
    })
    .await
    .map_err(|e| format!("任务失败: {e}"))?;

    match result {
        Ok(resp) => {
            let status = resp.status();
            let body: serde_json::Value = resp
                .into_json()
                .map_err(|e| format!("响应解析失败: {e}"))?;
            if status != 200 {
                return Err(format!("LLM API {status}: {body}"));
            }
            body["choices"][0]["message"]["content"]
                .as_str()
                .ok_or_else(|| "LLM 响应缺少 content".to_string())
                .map(|s| s.to_string())
        }
        Err(e) => Err(format!("请求失败: {e}")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let settings_item = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?;
            let upload_item = MenuItem::with_id(app, "upload", "更换头像", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&settings_item, &upload_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("JingShi Pet")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "settings" => open_settings(app),
                    "upload" => pick_avatar(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ask_llm,
            get_config,
            save_config,
            get_avatar_base64
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
