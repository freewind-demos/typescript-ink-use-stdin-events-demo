import { Box, Text, render, useApp } from "ink"
import { type FC, useState } from "react"
import type { InputEvent } from "./input-event.js"
import { formatInputEvent } from "./parse-input-event.js"
import { useInputEvent } from "./use-input-event.js"

const maxLogCount = 12

const App: FC = () => {
  const { exit } = useApp()
  const [logs, setLogs] = useState<string[]>([])
  const { lastEvent } = useInputEvent((event) => {
    if (event.type === "key" && event.name === "q" && !event.modifiers.ctrl && !event.modifiers.meta) {
      exit()
      return
    }

    if (event.type === "key" && event.name === "c" && !event.modifiers.ctrl && !event.modifiers.meta) {
      setLogs([])
      return
    }

    setLogs((current) => [formatInputEvent(event), ...current].slice(0, maxLogCount))
  })

  return (
    <Box flexDirection="column">
      <Text bold>Ink useInputEvent</Text>
      <Text dimColor>useStdin 原始字节 → 确定的 InputEvent | q 退出 | c 清日志</Text>
      <Text dimColor>试：字母、方向键、Tab、F 键、Ctrl 组合、鼠标、滚轮、粘贴、切窗口焦点</Text>
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" marginTop={1}>
        <Text bold>最后一次事件</Text>
        <LastEventView event={lastEvent} />
      </Box>
      <Box flexDirection="column" borderStyle="round" borderColor="gray" marginTop={1}>
        <Text bold>最近 {maxLogCount} 条</Text>
        {logs.length === 0 ? (
          <Text dimColor>(empty)</Text>
        ) : (
          logs.map((line, index) => <Text key={`${index}-${line}`}>{line}</Text>)
        )}
      </Box>
    </Box>
  )
}

const LastEventView: FC<{ event: InputEvent | undefined }> = ({ event }) => {
  if (!event) {
    return <Text dimColor>(还没有输入)</Text>
  }

  if (event.type === "key") {
    return (
      <>
        <Text>type: key</Text>
        <Text>name: {event.name}</Text>
        <Text>text: {JSON.stringify(event.text)}</Text>
        <Text>action: {event.action}</Text>
        <Text>
          modifiers: ctrl={String(event.modifiers.ctrl)} shift={String(event.modifiers.shift)} meta=
          {String(event.modifiers.meta)} super={String(event.modifiers.super)}
        </Text>
      </>
    )
  }

  if (event.type === "mouse") {
    return (
      <>
        <Text>type: mouse</Text>
        <Text>button: {event.button}</Text>
        <Text>action: {event.action}</Text>
        <Text>
          at: {event.column}, {event.row}
        </Text>
      </>
    )
  }

  if (event.type === "paste") {
    return (
      <>
        <Text>type: paste</Text>
        <Text>text: {JSON.stringify(event.text.slice(0, 80))}</Text>
      </>
    )
  }

  if (event.type === "text") {
    return (
      <>
        <Text>type: text</Text>
        <Text>text: {JSON.stringify(event.text)}</Text>
      </>
    )
  }

  if (event.type === "focus") {
    return (
      <>
        <Text>type: focus</Text>
        <Text>focused: {String(event.focused)}</Text>
      </>
    )
  }

  return (
    <>
      <Text>type: unknown</Text>
      <Text>raw: {JSON.stringify(event.raw)}</Text>
    </>
  )
}

render(<App />, {
  exitOnCtrlC: true,
  kittyKeyboard: {
    mode: "auto",
    flags: ["disambiguateEscapeCodes", "reportEventTypes", "reportAllKeysAsEscapeCodes"],
  },
})
