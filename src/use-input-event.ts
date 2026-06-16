import { useStdin, useStdout } from "ink"
import { useEffect, useRef, useState } from "react"
import type { InputEvent, UseInputEventOptions } from "./input-event.js"
import { parserItemToInputEvent } from "./parse-input-event.js"
import { createInputParser } from "./vendor/ink-input/index.js"

const pendingFlushMs = 20
const enableMouseSequence = "\u001B[?1000h\u001B[?1002h\u001B[?1006h"
const disableMouseSequence = "\u001B[?1000l\u001B[?1002l\u001B[?1006l"
const enableFocusSequence = "\u001B[?1004h"
const disableFocusSequence = "\u001B[?1004l"
const enablePasteSequence = "\u001B[?2004h"
const disablePasteSequence = "\u001B[?2004l"

type UseInputEventHandler = (event: InputEvent) => void

type UseInputEventResult = {
  lastEvent: InputEvent | undefined
}

// useStdin 拿原始 data → 解析 → InputEvent
export const useInputEvent = (
  handler: UseInputEventHandler,
  options: UseInputEventOptions = {},
): UseInputEventResult => {
  const { isActive = true, enableMouse = true, enableFocus = true } = options
  const { stdin, setRawMode, isRawModeSupported } = useStdin()
  const { stdout } = useStdout()
  const [lastEvent, setLastEvent] = useState<InputEvent | undefined>(undefined)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!isActive) {
      return
    }

    if (enableMouse) {
      stdout.write(enableMouseSequence)
    }

    if (enableFocus) {
      stdout.write(enableFocusSequence)
    }

    stdout.write(enablePasteSequence)

    return () => {
      if (enableMouse) {
        stdout.write(disableMouseSequence)
      }

      if (enableFocus) {
        stdout.write(disableFocusSequence)
      }

      stdout.write(disablePasteSequence)
    }
  }, [stdout, isActive, enableMouse, enableFocus])

  useEffect(() => {
    if (!isActive || !isRawModeSupported) {
      return
    }

    setRawMode(true)
    stdin.setEncoding("utf8")

    return () => {
      setRawMode(false)
    }
  }, [isActive, isRawModeSupported, setRawMode, stdin])

  useEffect(() => {
    if (!isActive || !isRawModeSupported) {
      return
    }

    const parser = createInputParser()
    let flushTimer: ReturnType<typeof setTimeout> | undefined

    const emit = (item: string | { paste: string }): void => {
      const event = parserItemToInputEvent(item)

      if (!event) {
        return
      }

      setLastEvent(event)
      handlerRef.current(event)
    }

    const clearFlushTimer = (): void => {
      if (flushTimer !== undefined) {
        clearTimeout(flushTimer)
        flushTimer = undefined
      }
    }

    const scheduleFlush = (): void => {
      clearFlushTimer()
      flushTimer = setTimeout(() => {
        flushTimer = undefined
        const pendingEscape = parser.flushPendingEscape()

        if (pendingEscape) {
          emit(pendingEscape)
        }
      }, pendingFlushMs)
    }

    const onData = (data: Buffer | string): void => {
      clearFlushTimer()
      const chunk = Buffer.isBuffer(data) ? data.toString("utf8") : data

      for (const item of parser.push(chunk)) {
        emit(item)
      }

      if (parser.hasPendingEscape()) {
        scheduleFlush()
      }
    }

    stdin.on("data", onData)

    return () => {
      clearFlushTimer()
      stdin.off("data", onData)
      parser.reset()
    }
  }, [stdin, isActive, isRawModeSupported])

  return { lastEvent }
}
