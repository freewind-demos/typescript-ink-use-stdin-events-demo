import parseKeypress, { nonAlphanumericKeys } from "./vendor/ink-input/index.js"
import type {
  FocusInputEvent,
  InputEvent,
  KeyAction,
  KeyInputEvent,
  MouseButton,
  MouseInputEvent,
  PasteInputEvent,
  TextInputEvent,
  UnknownInputEvent,
} from "./input-event.js"

const focusInSequence = "\u001B[I"
const focusOutSequence = "\u001B[O"
const mouseSequenceRe = /^\u001B\[<(\d+);(\d+);(\d+)([mM])$/
// 终端对 kitty / mode 查询的回复，不是用户输入
const ignoredTerminalResponseRes = [
  /^\u001B\[\?\d+u$/,
  /^\u001B\[>\d+;(?:\d+;)?\d+c$/,
]

const isIgnoredTerminalResponse = (sequence: string): boolean => {
  return ignoredTerminalResponseRes.some((pattern) => pattern.test(sequence))
}

// parseKeypress 结果 → useInput 同款 text 字段
const keypressToText = (keypress: ReturnType<typeof parseKeypress>): string => {
  if (keypress.isKittyProtocol) {
    if (keypress.isPrintable) {
      return keypress.text ?? keypress.name
    }

    if (keypress.ctrl && keypress.name.length === 1) {
      return keypress.name
    }

    return ""
  }

  if (keypress.ctrl) {
    return keypress.name ?? ""
  }

  let input = keypress.sequence

  if (nonAlphanumericKeys.includes(keypress.name)) {
    input = ""
  }

  if (input.startsWith("\u001B")) {
    input = input.slice(1)
  }

  return input
}

// SGR 鼠标第一参数 → 按键 + 动作
const parseMouseCode = (
  code: number,
  terminalAction: "press" | "release",
): Pick<MouseInputEvent, "button" | "action"> => {
  if (code === 35) {
    return { button: "move", action: "move" }
  }

  if (code === 64) {
    return { button: "wheel-up", action: "press" }
  }

  if (code === 65) {
    return { button: "wheel-down", action: "press" }
  }

  if (code === 66) {
    return { button: "wheel-left", action: "press" }
  }

  if (code === 67) {
    return { button: "wheel-right", action: "press" }
  }

  const buttonIndex = code & 3
  const buttonNames: MouseButton[] = ["left", "middle", "right"]

  if (code >= 32 && code <= 34) {
    return {
      button: buttonNames[buttonIndex] ?? "left",
      action: "move",
    }
  }

  return {
    button: buttonNames[buttonIndex] ?? "left",
    action: terminalAction,
  }
}

// ESC [ <btn;col;row M/m
const parseMouseSequence = (sequence: string): MouseInputEvent | undefined => {
  const match = mouseSequenceRe.exec(sequence)

  if (!match) {
    return undefined
  }

  const code = Number(match[1])
  const column = Number(match[2])
  const row = Number(match[3])
  const terminalAction = match[4] === "M" ? "press" : "release"
  const { button, action } = parseMouseCode(code, terminalAction)

  return {
    type: "mouse",
    button,
    column,
    row,
    action,
    modifiers: {
      shift: !!(code & 4),
      meta: !!(code & 8),
      ctrl: !!(code & 16),
    },
    raw: sequence,
  }
}

const parseFocusSequence = (sequence: string): FocusInputEvent | undefined => {
  if (sequence === focusInSequence) {
    return { type: "focus", focused: true, raw: sequence }
  }

  if (sequence === focusOutSequence) {
    return { type: "focus", focused: false, raw: sequence }
  }

  return undefined
}

const keypressToEvent = (sequence: string): KeyInputEvent | TextInputEvent | UnknownInputEvent => {
  if (sequence.length > 1 && !sequence.startsWith("\u001B")) {
    return { type: "text", text: sequence }
  }

  const keypress = parseKeypress(sequence)
  const action: KeyAction = keypress.eventType ?? "press"

  if (!keypress.name && keypress.isKittyProtocol) {
    return { type: "unknown", raw: sequence }
  }

  if (!keypress.name && sequence.startsWith("\u001B")) {
    return { type: "unknown", raw: sequence }
  }

  return {
    type: "key",
    name: keypress.name || "unknown",
    text: keypressToText(keypress),
    modifiers: {
      ctrl: keypress.ctrl,
      shift: keypress.shift,
      meta: keypress.meta,
      super: keypress.super ?? false,
      hyper: keypress.hyper ?? false,
      capsLock: keypress.capsLock ?? false,
      numLock: keypress.numLock ?? false,
    },
    action,
    raw: sequence,
  }
}

// input-parser 单项 → 0..1 个 InputEvent
export const parserItemToInputEvent = (
  item: string | { paste: string },
): InputEvent | undefined => {
  if (typeof item !== "string") {
    const pasteEvent: PasteInputEvent = { type: "paste", text: item.paste }
    return pasteEvent
  }

  if (isIgnoredTerminalResponse(item)) {
    return undefined
  }

  const mouseEvent = parseMouseSequence(item)

  if (mouseEvent) {
    return mouseEvent
  }

  const focusEvent = parseFocusSequence(item)

  if (focusEvent) {
    return focusEvent
  }

  return keypressToEvent(item)
}

// 给 UI 用的单行描述
export const formatInputEvent = (event: InputEvent): string => {
  if (event.type === "text") {
    return `text "${event.text}"`
  }

  if (event.type === "paste") {
    return `paste ${event.text.length} chars`
  }

  if (event.type === "key") {
    const mods = [
      event.modifiers.ctrl ? "ctrl" : "",
      event.modifiers.shift ? "shift" : "",
      event.modifiers.meta ? "meta" : "",
      event.modifiers.super ? "super" : "",
    ]
      .filter(Boolean)
      .join("+")

    const modPrefix = mods ? `${mods}+` : ""
    const textPart = event.text ? ` text=${JSON.stringify(event.text)}` : ""

    return `key ${modPrefix}${event.name} (${event.action})${textPart}`
  }

  if (event.type === "mouse") {
    const mods = [
      event.modifiers.ctrl ? "ctrl" : "",
      event.modifiers.shift ? "shift" : "",
      event.modifiers.meta ? "meta" : "",
    ]
      .filter(Boolean)
      .join("+")

    const modPrefix = mods ? `${mods}+` : ""

    return `mouse ${modPrefix}${event.button} ${event.action} @ ${event.column},${event.row}`
  }

  if (event.type === "focus") {
    return event.focused ? "focus in" : "focus out"
  }

  return `unknown ${JSON.stringify(event.raw)}`
}
