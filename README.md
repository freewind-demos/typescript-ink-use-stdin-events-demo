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

## 为什么 vendor `ink-input`

本 demo 复用 ink 内部两块解析逻辑：

| 模块 | 作用 |
|---|---|
| `createInputParser` | stdin 分块、bracket paste、pending escape |
| `parseKeypress` | 单键解析（含 kitty protocol） |

ink 官方只 export `useInput`，且 `package.json` 的 `exports` 仅 `./build/index.js`，**不能** `import from "ink/build/parse-keypress.js"`。因此把 `ink@7` 对应源码原样 vend 到 `src/vendor/ink-input/`。

mouse / focus 映射在 `parse-input-event.ts` 自写，不来自 ink。

## 第三方替代方案

npm 上**没有**公开包提供与本 demo 同形态的「统一 `InputEvent` + React hook」。常见选项是拆开的：

| 方案 | 覆盖 | 说明 |
|---|---|---|
| ink `useInput` + `usePaste` | 键盘 + 粘贴 | 官方 API；无鼠标、无终端窗口 focus |
| [ink-use-mouse](https://github.com/AskExe/ink-use-mouse) | 鼠标 | 需配 `useInput` 吞 escape；不管 paste/focus |
| [@zenobius/ink-mouse](https://github.com/zenobi-us/ink-mouse) | 鼠标 + hit test | 偏组件交互，非统一事件流 |
| [tty-events](https://github.com/dd-pardal/tty-events) | key + mouse + paste + focus | 非 React/ink；与 ink 抢 stdin，需自行桥接 |

若只需键盘，直接用 ink 官方 hook 即可，不必 vendor。

## 注意

- 不要和 `useInput` 同时处理同一逻辑
- 需真实 TTY；hook 内会 `setRawMode(true)`
- ink 升级后需手动 sync `vendor/ink-input/` 三个 `.js` 文件
