# typescript-ink-use-stdin-events-demo

## 简介

用 `useStdin().stdin.on("data")` 监听终端原始输入，收到什么就显示 hex 和文本。

## 快速开始

```bash
pnpm install
pnpm start
```

## 用法

- 按键、点鼠标、粘贴 → 上方显示最后一次，下方列最近 12 条
- `q` / `esc` 退出
- `c` 清日志

格式：`hex字节 | JSON文本`，例如方向键会看到 `1b 5b 41 | "\u001b[A"`。

## 原理

Ink 的 `useStdin()` 返回 Node.js 的 `stdin` 流。终端不会直接给「Up 键」这种语义，而是发字节；本 demo 不做解析，原样展示。

鼠标默认开启 xterm SGR 追踪（`?1000/1006`），点击会看到 `ESC [ <...` 序列。

## 相关 demo

- `typescript-ink-use-input-capabilities-demo`：对比 `useInput` 高层语义
- `typescript-ink-react-tui-use-input-stdin-conflict-demo`：`useInput` 与 stdin 同时监听
