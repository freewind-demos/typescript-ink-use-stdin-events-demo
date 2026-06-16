// 键盘 modifier
export type InputEventModifiers = {
  ctrl: boolean
  shift: boolean
  meta: boolean
  super: boolean
  hyper: boolean
  capsLock: boolean
  numLock: boolean
}

export type KeyAction = "press" | "repeat" | "release"

export type MouseButton =
  | "left"
  | "middle"
  | "right"
  | "wheel-up"
  | "wheel-down"
  | "wheel-left"
  | "wheel-right"
  | "move"

export type TextInputEvent = {
  type: "text"
  text: string
}

export type KeyInputEvent = {
  type: "key"
  name: string
  text: string
  modifiers: InputEventModifiers
  action: KeyAction
  raw: string
}

export type PasteInputEvent = {
  type: "paste"
  text: string
}

export type MouseInputEvent = {
  type: "mouse"
  button: MouseButton
  column: number
  row: number
  action: "press" | "release" | "move"
  modifiers: Pick<InputEventModifiers, "ctrl" | "shift" | "meta">
  raw: string
}

export type FocusInputEvent = {
  type: "focus"
  focused: boolean
  raw: string
}

export type UnknownInputEvent = {
  type: "unknown"
  raw: string
}

export type InputEvent =
  | TextInputEvent
  | KeyInputEvent
  | PasteInputEvent
  | MouseInputEvent
  | FocusInputEvent
  | UnknownInputEvent

export type UseInputEventOptions = {
  isActive?: boolean
  enableMouse?: boolean
  enableFocus?: boolean
}
