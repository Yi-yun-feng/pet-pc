use serde::Deserialize;
use tauri::Manager;

#[derive(Deserialize, Default)]
struct LlmConfig {
    base_url: Option<String>,
    api_key: Option<String>,
    model: Option<String>,
}

fn read_config(app: &tauri::AppHandle) -> Result<LlmConfig, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("无法定位配置目录: {e}"))?;
    let path = dir.join("config.local.json");
    if !path.exists() {
        return Err("未找到 config.local.json，请创建后填入 apiKey（见 README 或 config.local.json.example）".into());
    }
    let raw = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
async fn ask_llm(history: Vec<serde_json::Value>, app: tauri::AppHandle) -> Result<String, String> {
    let cfg = read_config(&app)?;
    let key = cfg.api_key.ok_or("config.local.json 缺少 apiKey")?;
    let base = cfg
        .base_url
        .unwrap_or_else(|| "https://api.deepseek.com".into());
    let model = cfg.model.unwrap_or_else(|| "deepseek-v4-flash".into());

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{}/v1/chat/completions", base.trim_end_matches('/')))
        .bearer_auth(&key)
        .json(&serde_json::json!({
            "model": model,
            "messages": history,
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| format!("请求失败: {e}"))?;

    let status = resp.status();
    let body: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("LLM API {status}: {body}"));
    }
    let text = body["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "LLM 响应缺少 content".to_string())?
        .to_string();
    Ok(text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![ask_llm])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
