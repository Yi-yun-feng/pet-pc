import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";

const stage = document.querySelector<HTMLElement>("#stage")!;
const placeholder = document.querySelector<HTMLDivElement>("#character")!;
const nameEl = document.querySelector<HTMLDivElement>("#pet-name")!;

const MODEL_URL = "models/model.model3.json";

async function loadLive2D(): Promise<boolean> {
  const resp = await fetch(MODEL_URL, { method: "HEAD" }).catch(() => null);
  if (!resp || !resp.ok) return false;

  const app = new PIXI.Application({
    resizeTo: window,
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

  nameEl.textContent = "JingShi Pet";
  return true;
}

void loadLive2D().catch(() => {
  // 模型不可用时保留 CSS 占位
});
