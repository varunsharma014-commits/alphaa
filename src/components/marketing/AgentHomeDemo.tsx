"use client"

import { useEffect, useRef, useState } from "react"
import { AgentFeed } from "@/components/agent/AgentFeed"
import { agent, type Message } from "@/lib/agent/types"

// The hero window: a looping, clearly-labelled example of a morning with the
// agent. Example business and answers — never presented as a real customer.
const SCRIPT: Message[] = [
  agent([
    { kind: "text", text: "Good morning. I asked the four AIs “best dentist near Zilker, Austin” a few minutes ago." },
    { kind: "verdicts", items: [{ engine: "perplexity", state: "found" }, { engine: "gemini", state: "found" }, { engine: "chatgpt", state: "missing" }, { engine: "claude", state: "missing" }] },
  ], "demo-1"),
  agent([
    { kind: "text", text: "ChatGPT recommended Austin Family Dental instead. It leaned on two pages you don’t appear on yet. I’m fixing that now." },
    { kind: "steps", items: ["Reading what ChatGPT cited", "Checking your listing on <b>Zocdoc</b> — missing", "Writing your Zocdoc profile from your website", "Answering “Do you take Delta Dental?” on your site"], done: 4 },
    { kind: "text", text: "Two things need a yes from you. Everything else is done." },
    { kind: "chips", items: [{ label: "Approve both", action: { type: "dismiss" }, primary: true }, { label: "Show me", action: { type: "dismiss" }, primary: false }, { label: "Later", action: { type: "dismiss" }, primary: false }] },
  ], "demo-2"),
]

export function AgentHomeDemo() {
  const [messages, setMessages] = useState<Message[]>([SCRIPT[0]])
  const [round, setRound] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    // Second message lands a beat after the first finishes typing; the whole
    // loop restarts after a pause so the window is never static.
    timer.current = window.setTimeout(() => setMessages([SCRIPT[0], SCRIPT[1]]), 7000)
    const restart = window.setTimeout(() => {
      setMessages([SCRIPT[0]])
      setRound((r) => r + 1)
    }, 24000)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
      window.clearTimeout(restart)
    }
  }, [round])

  return (
    <div className="ag-window" aria-label="Example of the agent at work">
      <div className="ag-window__bar">
        <i /><i /><i />
        <span>example · working for a dental practice</span>
      </div>
      <AgentFeed key={round} messages={messages} animate="type" autoScroll={false} onChip={() => {}} />
    </div>
  )
}
