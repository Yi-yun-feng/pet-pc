import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { MarkdownConverter } from "../engine/jingshi.js";

const stage = document.querySelector<HTMLElement>("#stage")!;
const placeholder = document.querySelector<HTMLDivElement>("#character")!;
const messagesEl = document.querySelector<HTMLDivElement>("#messages")!;
const inputEl = document.querySelector<HTMLInputElement>("#input")!;
const sendBtn = document.querySelector<HTMLButtonElement>("#send")!;

const MODEL_URL = "models/model.model3.json";
const converter = new MarkdownConverter();

type ChatRole = "user" | "assistant";
interface ChatEntry {
  role: ChatRole;
  content: string;
}
const history: ChatEntry[] = [];

// 拖拽窗口（透明无边框窗口必须手动接管；Windows 生效，Linux/Wayland 受限）
const appWindow = getCurrentWindow();
stage.addEventListener("pointerdown", (e) => {
  if (e.button === 0) void appWindow.startDragging();
});

function appendBubble(role: ChatRole, text: string) {
  const el = document.createElement("div");
  el.className = `bubble ${role}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setThinking(on: boolean) {
  sendBtn.disabled = on;
  if (on) {
    const el = document.createElement("div");
    el.className = "bubble assistant thinking";
    el.textContent = "…";
    el.id = "thinking";
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } else {
    document.getElementById("thinking")?.remove();
  }
}

async function send() {
  const text = inputEl.value.trim();
  if (!text || sendBtn.disabled) return;
  inputEl.value = "";
  appendBubble("user", text);
  history.push({ role: "user", content: text });

  setThinking(true);
  try {
    const raw = await invoke<string>("ask_llm", { history });
    const clean = converter.convert(raw);
    appendBubble("assistant", clean);
    history.push({ role: "assistant", content: raw });
  } catch (err) {
    appendBubble("assistant", `（出错了：${String(err)}）`);
  } finally {
    setThinking(false);
  }
}

sendBtn.addEventListener("click", () => void send());
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") void send();
});

// Live2D 渲染（无模型时保留 CSS 占位角色）
async function loadLive2D(): Promise<boolean> {
  const resp = await fetch(MODEL_URL, { method: "HEAD" }).catch(() => null);
  if (!resp || !resp.ok) return false;

  const app = new PIXI.Application({
    resizeTo: stage,
    backgroundAlpha: 0,
    antialias: true,
  });
  stage.appendChild(app.view as HTMLCanvasElement);
  placeholder.style.display = "none";

  const model = await Live2DModel.from(MODEL_URL);
  app.stage.addChild(model as unknown as PIXI.DisplayObject);
  model.anchor.set(0.5, 0.5);
  model.scale.set(0.15);
  model.x = app.screen.width / 2;
  model.y = app.screen.height / 2;

  app.ticker.add((delta) => {
    model.update(delta);
  });
  return true;
}

void loadLive2D().catch(() => {
  // 模型不可用时保留 CSS 占位
});
