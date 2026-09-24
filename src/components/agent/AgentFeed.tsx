"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Block, Chip, Message } from "@/lib/agent/types"
import {
  AnswerBlock, ChipsBlock, DiffBlock, DocBlock, EmailBlock, ReceiptBlock,
  SourcesBlock, StatBlock, StepsBlock, TextBlock, Typing, VerdictsBlock,
} from "./blocks"

export type Animate = "type" | "stagger" | "none"

type Cursor = { m: number; b: number; pause: boolean }

/**
 * Plays a list of agent/user messages the way a chat client does: one block
 * at a time, text typed out, a typing indicator between agent turns. New
 * messages appended later keep playing from where the cursor is.
 */
export function AgentFeed({
  messages,
  animate = "stagger",
  busy = false,
  onChip,
  onEmail,
  onDocEdit,
  onSettled,
}: {
  messages: Message[]
  animate?: Animate
  busy?: boolean
  onChip: (chip: Chip, messageId: string) => void | Promise<void>
  onEmail?: (email: string) => Promise<string | null>
  onDocEdit?: (docId: string, text: string) => void
  onSettled?: () => void
}) {
  const [cursor, setCursor] = useState<Cursor>(() =>
    animate === "none" ? { m: Number.MAX_SAFE_INTEGER, b: 0, pause: false } : { m: 0, b: 0, pause: true }
  )
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const endRef = useRef<HTMLDivElement>(null)
  const settledFor = useRef(-1)
  // The dashboard opens at the top like a briefing; only chat-style surfaces
  // and messages added after load pull the view down to the newest turn.
  const initialCount = useRef(messages.length)

  const advance = useCallback(() => {
    setCursor((c) => {
      const msg = messages[c.m]
      if (!msg) return c
      if (c.b + 1 < msg.blocks.length) return { m: c.m, b: c.b + 1, pause: false }
      return { m: c.m + 1, b: 0, pause: true }
    })
  }, [messages])

  // Between messages: brief pause (typing dots before an agent turn).
  useEffect(() => {
    if (!cursor.pause) return
    const msg = messages[cursor.m]
    if (!msg) return
    if (msg.role === "user") {
      setCursor({ m: cursor.m + 1, b: 0, pause: true })
      return
    }
    const ms = animate === "type" ? 650 : animate === "stagger" ? 120 : 0
    const id = window.setTimeout(() => setCursor({ m: cursor.m, b: 0, pause: false }), ms)
    return () => window.clearTimeout(id)
  }, [cursor, messages, animate])

  // Everything except a typed-out text block reveals, then auto-advances.
  useEffect(() => {
    if (cursor.pause) return
    const msg = messages[cursor.m]
    const block = msg?.blocks[cursor.b]
    if (!block || (block.kind === "text" && animate === "type")) return
    const ms = animate === "type" ? 420 : animate === "stagger" ? 90 : 0
    const id = window.setTimeout(advance, ms)
    return () => window.clearTimeout(id)
  }, [cursor, messages, animate, advance])

  // Tell the parent when everything currently queued has played.
  useEffect(() => {
    if (cursor.m >= messages.length && settledFor.current !== messages.length) {
      settledFor.current = messages.length
      onSettled?.()
    }
  }, [cursor, messages.length, onSettled])

  useEffect(() => {
    if (animate !== "type" && messages.length <= initialCount.current && !busy) return
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [cursor, busy, messages.length, animate])

  function pick(chip: Chip, msgId: string) {
    setPicked((p) => ({ ...p, [msgId]: true }))
    void onChip(chip, msgId)
  }

  function renderBlock(msg: Message, block: Block, j: number, typing: boolean) {
    const key = `${msg.id}-${j}`
    switch (block.kind) {
      case "text":
        return <TextBlock key={key} text={block.text} big={block.big} typing={typing} onDone={typing ? advance : undefined} />
      case "steps":
        return <StepsBlock key={key} items={block.items} done={block.done} />
      case "verdicts":
        return <VerdictsBlock key={key} items={block.items} />
      case "answer":
        return <AnswerBlock key={key} {...block} />
      case "sources":
        return <SourcesBlock key={key} items={block.items} />
      case "stat":
        return <StatBlock key={key} value={block.value} label={block.label} />
      case "doc":
        return <DocBlock key={key} b={block} onEdit={onDocEdit} />
      case "diff":
        return <DiffBlock key={key} {...block} />
      case "receipt":
        return <ReceiptBlock key={key} {...block} />
      case "chips":
        return <ChipsBlock key={key} items={block.items} disabled={!!picked[msg.id]} onPick={(c) => pick(c, msg.id)} />
      case "email":
        return onEmail ? <EmailBlock key={key} b={block} onSubmit={onEmail} /> : null
      case "divider":
        return null
    }
  }

  const showTyping = busy && cursor.m >= messages.length

  return (
    <div className="ag-feed" aria-live="polite">
      {messages.map((msg, i) => {
        if (i > cursor.m) return null
        if (i === cursor.m && cursor.pause) return null
        const isCurrent = i === cursor.m
        const dividers = msg.blocks.filter((b) => b.kind === "divider") as Extract<Block, { kind: "divider" }>[]
        const body = msg.blocks.map((b, j) => {
          if (isCurrent && j > cursor.b) return null
          return renderBlock(msg, b, j, animate === "type" && isCurrent && j === cursor.b)
        })
        return (
          <div key={msg.id} style={{ display: "contents" }}>
            {dividers.map((d, k) => (
              <div key={`${msg.id}-d${k}`} className="ag-divider">
                {d.text}
              </div>
            ))}
            {msg.blocks.length > dividers.length && (
              <div className={`ag-msg ${msg.role === "user" ? "ag-msg--user" : ""}`}>
                <div className="ag-msg__av">{msg.role === "user" ? "you" : "a"}</div>
                <div className="ag-msg__body">{body}</div>
              </div>
            )}
          </div>
        )
      })}
      {(showTyping || (cursor.pause && cursor.m < messages.length && messages[cursor.m]?.role === "agent" && animate === "type")) && <Typing />}
      <div ref={endRef} />
    </div>
  )
}

export function Composer({
  placeholder,
  value,
  onChange,
  onSubmit,
  disabled,
  inputRef,
  id = "ag-composer-input",
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
  inputRef?: React.RefObject<HTMLInputElement>
  id?: string
}) {
  return (
    <form
      className="ag-composer"
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled && value.trim()) onSubmit()
      }}
    >
      <input
        id={id}
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        aria-label={placeholder}
      />
      <button type="submit" aria-label="Send" disabled={disabled || !value.trim()}>
        ↑
      </button>
    </form>
  )
}
