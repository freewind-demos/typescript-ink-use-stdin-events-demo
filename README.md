# typescript-ink-use-stdin-events-demo

## 简介

在 `useStdin` 原始字节之上封装 **`useInputEvent`** hook：每次回调拿到一个确定的 `InputEvent`（键盘 / 鼠标 / 粘贴 / 焦点 / 文本）。

## 快速开始

```bash
pnpm install
pnpm start
```

## useInputEvent

```tsx
import { useInputEvent } from "./use-input-event.js"

useInputEvent((event) => {
  if (event.type === "key" && event.name === "up") {
    // 方向键
  }

  if (event.type === "mouse" && event.button === "left" && event.action === "press") {
    // 左键点击 @ event.column, event.row
  }

  if (event.type === "paste") {
    // event.text
  }
})
```

## InputEvent 类型

| type | 含义 |
|---|---|
| `key` | 单键：name / text / modifiers / action |
| `text` | 连续可打印字符 |
| `paste` | bracket paste 整段 |
| `mouse` | 左/中/右/滚轮/move + 坐标 |
| `focus` | 终端窗口 focus in/out |
| `unknown` | 未识别 escape |

## 目录

```
src/
  index.tsx              演示入口
  input-event.ts         类型
  parse-input-event.ts   字节 → InputEvent
  use-input-event.ts     hook
  vendor/ink-input/      ink 键盘解析（vend，因 ink 未 export 内部模块）
```

## 注意

- 不要和 `useInput` 同时处理同一逻辑
- 需真实 TTY；hook 内会 `setRawMode(true)`
