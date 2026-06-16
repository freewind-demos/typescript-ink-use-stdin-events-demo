import { Box, Text, render, useApp, useInput, useStdin, useStdout } from "ink"
import { type FC, useEffect, useState } from "react"

const maxLogCount = 12
const enableMouseSequence = "\u001B[?1000h\u001B[?1006h"
const disableMouseSequence = "\u001B[?1000l\u001B[?1006l"

// Buffer → hex + 可读文本
const formatChunk = (data: Buffer): string => {
  const hex = [...data.values()]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join(" ")
  const text = JSON.stringify(data.toString("utf8"))

  return `${hex} | ${text}`
}

const App: FC = () => {
  const { exit } = useApp()
  const { stdin, isRawModeSupported } = useStdin()
  const { stdout } = useStdout()
  const [count, setCount] = useState<number>(0)
  const [lastChunk, setLastChunk] = useState<string>("(还没有输入)")
  const [logs, setLogs] = useState<string[]>([])

  // 挂 stdin 监听，收到什么就显示什么
  useEffect(() => {
    const handleData = (data: Buffer | string): void => {
      const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data)
      const formatted = formatChunk(chunk)

      setCount((current) => current + 1)
      setLastChunk(formatted)
      setLogs((current) => [formatted, ...current].slice(0, maxLogCount))
    }

    stdin.on("data", handleData)

    return () => {
      stdin.off("data", handleData)
    }
  }, [stdin])

  // 开鼠标追踪，方便看到点击/滚轮的 escape 序列
  useEffect(() => {
    stdout.write(enableMouseSequence)

    return () => {
      stdout.write(disableMouseSequence)
    }
  }, [stdout])

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit()
      return
    }

    if (input === "c") {
      setLogs([])
    }
  })

  return (
    <Box flexDirection="column">
      <Text bold>Ink useStdin 原始输入</Text>
      <Text dimColor>键盘、鼠标、粘贴都会以 stdin data 出现 | q/esc 退出 | c 清日志</Text>
      <Text dimColor>
        rawMode={isRawModeSupported ? "yes" : "no"} tty={"isTTY" in stdin && stdin.isTTY ? "yes" : "no"}
      </Text>
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" marginTop={1}>
        <Text bold>最后一次 stdin data</Text>
        <Text>count: {count}</Text>
        <Text>{lastChunk}</Text>
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

render(<App />)
