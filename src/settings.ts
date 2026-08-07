import { invoke } from "@tauri-apps/api/core";

const els = {
  characterName: document.querySelector<HTMLInputElement>("#characterName")!,
  systemPrompt: document.querySelector<HTMLTextAreaElement>("#systemPrompt")!,
  apiKey: document.querySelector<HTMLInputElement>("#apiKey")!,
  model: document.querySelector<HTMLInputElement>("#model")!,
  baseUrl: document.querySelector<HTMLInputElement>("#baseUrl")!,
  save: document.querySelector<HTMLButtonElement>("#save")!,
  status: document.querySelector<HTMLSpanElement>("#status")!,
};

interface Config {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  characterName?: string;
  systemPrompt?: string;
}

async function load() {
  const cfg = await invoke<Config>("get_config").catch(() => ({} as Config));
  els.characterName.value = cfg.characterName ?? "";
  els.systemPrompt.value = cfg.systemPrompt ?? "";
  els.apiKey.value = cfg.apiKey ?? "";
  els.model.value = cfg.model ?? "";
  els.baseUrl.value = cfg.baseUrl ?? "";
}

async function save() {
  const cfg: Config = {
    characterName: els.characterName.value.trim() || undefined,
    systemPrompt: els.systemPrompt.value.trim() || undefined,
    apiKey: els.apiKey.value.trim() || undefined,
    model: els.model.value.trim() || undefined,
    baseUrl: els.baseUrl.value.trim() || undefined,
  };
  await invoke("save_config", { cfg });
  els.status.textContent = "已保存 ✓";
  window.setTimeout(() => {
    els.status.textContent = "";
  }, 1500);
}

els.save.addEventListener("click", () => void save());
void load();
