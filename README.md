# 净式 AI 桌宠 JingShi Pet

> 桌面 AI 宠物：Live2D 二次元角色 + LLM 对话 + 净式净化引擎。姊妹项目，与 [jingshi-pc](https://github.com/Yi-yun-feng/jingshi-pc)（净式 PC 端）同栈（Tauri 2.x）。

## 定位

一个常驻桌面的陪伴型 AI 角色：
- 透明无边框、置顶、可拖拽的桌面窗口 + 系统托盘
- Live2D 动画角色（空闲待机 / 对话口型 / 情绪动作）
- LLM 对话（DeepSeek / 百炼 API，key 仅本地配置，不入库、不上云）
- 集成净化引擎：LLM 输出中的 LaTeX/Markdown 自动转成聊天可读纯文本（复用 jingshi-pc 引擎）

## 架构

```
jingshi-pet/
├── engine/            # 净化引擎（与 jingshi-pc 共用，平台无关零依赖）
├── src/               # Tauri 壳
│   ├── frontend/      #   WebView 前端（Live2D 渲染 + 聊天 UI）
│   └── tauri/         #   Rust 侧（托盘/窗口/配置）
├── models/            # Live2D 模型素材（仅收录可商用/CC 许可模型）
├── docs/              # 设计文档 + 开源检查清单
└── package.json
```

技术栈：**Tauri 2.x** + Live2D（pixi-live2d-display，MIT）+ 净式净化引擎。目标产物：Windows/macOS/Linux 三平台。

## 许可与合规（开源前必读）

- 代码：MIT
- Live2D Cubism Core：官方免费许可（非开源，仅二进制分发，见 Cubism 许可条款）
- 模型素材：仅收录 CC 许可或明确可商用的模型；默认仓库不内置模型，首次启动引导下载
- LLM API key：一律走本地配置文件（`config.local.json`，已 gitignore），禁止提交

## 当前进度

- [ ] 立项骨架（本仓库）
- [ ] Live2D 渲染验证（透明窗口 + 模型加载）
- [ ] 对话管线（LLM API + 净化引擎集成）
- [ ] 托盘/常驻/交互打磨
- [ ] 开源发布（GitHub + CI 三平台构建）

## 路线图

| 阶段 | 内容 |
|------|------|
| M0 | 骨架 + 透明窗口 + Live2D 加载跑通 |
| M1 | LLM 对话 + 净化引擎接入 |
| M2 | 角色交互（动作/情绪/提醒）+ 配置界面 |
| M3 | 开源打磨：README + 素材合规 + CI + release |

## 运行

（依赖 jingshi-pc 的 engine/；Tauri 工具链就绪后填充）
