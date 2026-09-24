"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AgentFeed, Composer } from "./AgentFeed"
import { agent, user as userMsg, type Block, type Chip, type Message } from "@/lib/agent/types"
import type { EngineKey } from "@/lib/agent/types"

type LiveResult = { engine: EngineKey; answer: string; appeared: boolean; mentioned: string[]; status: string }

export function DashboardAgent({ initial, businessName }: { initial: Message[]; businessName: string }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initial)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const docEdits = useRef<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const push = useCallback((...m: Message[]) => setMessages((prev) => [...prev, ...m]), [])

  async function post<T>(url: string, body?: unknown): Promise<{ ok: boolean; data: T & { error?: string } }> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
    const data = (await res.json().catch(() => ({}))) as T & { error?: string }
    return { ok: res.ok, data }
  }

  const fail = (text: string) => push(agent([{ kind: "text", text }]))

  async function liveCheck(question: string) {
    push(userMsg(question))
    setBusy(true)
    push(agent([{ kind: "text", text: "Asking all four now. Takes about 20 seconds." }, { kind: "steps", items: ["Asking ChatGPT", "Asking Gemini", "Asking Claude", "Asking Perplexity"], done: 4 }]))
    const { ok, data } = await post<{ results?: LiveResult[]; remaining?: number }>("/api/sandbox/ask", { question })
    setBusy(false)
    if (!ok || !data.results) return fail(data.error ?? "The AIs didn’t answer this time. Try again in a minute.")
    const results = data.results
    const answered = results.filter((r) => r.status === "appeared" || r.status === "not_appearing")
    const named = answered.filter((r) => r.appeared)
    const blocks: Block[] = [
      { kind: "verdicts", items: results.map((r) => ({ engine: r.engine, state: r.status === "appeared" ? "found" : r.status === "not_appearing" ? "missing" : "unknown" })) },
      { kind: "text", text: named.length === 0 ? `None of the ${answered.length} named you.` : `${named.length} of ${answered.length} named you${named.length ? `: ${named.map((r) => r.engine === "chatgpt" ? "ChatGPT" : r.engine[0].toUpperCase() + r.engine.slice(1)).join(", ")}` : ""}.` },
    ]
    const lead = answered.find((r) => r.engine === "chatgpt" && r.answer.trim()) ?? answered.find((r) => r.answer.trim())
    if (lead) blocks.push({ kind: "answer", engine: lead.engine, query: question, answer: lead.answer, appeared: lead.appeared, mentioned: lead.mentioned, businessName })
    const rivals = Array.from(new Set(answered.flatMap((r) => r.mentioned))).filter((n) => n.toLowerCase() !== businessName.toLowerCase()).slice(0, 4)
    if (rivals.length) blocks.push({ kind: "text", text: `Named instead: ${rivals.join(", ")}.` })
    if (typeof data.remaining === "number") blocks.push({ kind: "text", text: `${data.remaining} live checks left today. I also check on my own every week.` })
    push(agent(blocks))
  }

  async function onChip(chip: Chip, messageId: string) {
    const a = chip.action
    switch (a.type) {
      case "link":
        router.push(a.href)
        return
      case "say":
        push(userMsg(chip.label), agent([{ kind: "text", text: a.text }]))
        return
      case "ask":
        return send(a.text)
      case "live":
        return liveCheck(a.question)
      case "dismiss":
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        return
      case "review-draft": {
        push(userMsg("Draft a reply"))
        setBusy(true)
        const { ok, data } = await post<{ reply?: string }>(`/api/gbp/reviews/${a.reviewId}/reply`, { action: "generate" })
        setBusy(false)
        if (!ok || !data.reply) return fail(data.error ?? "I couldn’t write a draft just now. Try again in a minute.")
        const docId = `reply-${a.reviewId}`
        push(agent([
          { kind: "text", text: "Here’s what I’d say:" },
          { kind: "doc", title: "Your reply · Google", meta: "draft", text: data.reply, docId, editable: true },
          { kind: "chips", items: [{ label: "Post it", action: { type: "review-post", reviewId: a.reviewId, text: data.reply, docId }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
        ]))
        return
      }
      case "review-post": {
        const text = (a.docId && docEdits.current[a.docId]) || a.text
        push(userMsg("Post it"))
        setBusy(true)
        const { ok, data } = await post(`/api/gbp/reviews/${a.reviewId}/reply`, { action: "post", text })
        setBusy(false)
        if (!ok) return fail(data.error ?? "Google didn’t accept the reply. Nothing was posted.")
        push(agent([{ kind: "text", text: "Posted. It’s live on your Google listing." }]))
        setMessages((prev) => prev.filter((m) => m.id !== `review-${a.reviewId}`))
        return
      }
      case "post-publish": {
        push(userMsg("Post it"))
        setBusy(true)
        const { ok, data } = await post(`/api/gbp/posts/${a.postId}/publish`)
        setBusy(false)
        if (!ok) return fail(data.error ?? "Google didn’t accept the post. Nothing was published.")
        push(agent([{ kind: "text", text: "Published to your Google listing." }]))
        return
      }
      case "post-delete": {
        push(userMsg("Delete it"))
        await fetch(`/api/gbp/posts/${a.postId}`, { method: "DELETE" })
        push(agent([{ kind: "text", text: "Deleted. I’ll write a different one next time." }]))
        return
      }
    }
  }

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q) return
    setInput("")
    push(userMsg(q))
    setBusy(true)
    const history = messages.slice(-12).map((m) => ({ role: m.role, text: m.blocks.filter((b) => b.kind === "text").map((b) => (b as { text: string }).text).join(" ") })).filter((h) => h.text)
    const { ok, data } = await post<{ text?: string; liveQuestion?: string | null }>("/api/agent/chat", { message: q, history })
    setBusy(false)
    if (!ok || !data.text) return fail(data.error ?? "I lost the thread for a second. Ask me again?")
    const blocks: Block[] = [{ kind: "text", text: data.text }]
    if (data.liveQuestion) blocks.push({ kind: "chips", items: [{ label: `Ask the AIs: “${data.liveQuestion}”`, action: { type: "live", question: data.liveQuestion }, primary: true }] })
    push(agent(blocks))
  }

  return (
    <>
      <div className="ag-scroll">
        <AgentFeed
          messages={messages}
          animate="stagger"
          busy={busy}
          onChip={onChip}
          onDocEdit={(id, t) => { docEdits.current[id] = t }}
        />
      </div>
      <Composer id="agent-input" inputRef={inputRef} placeholder="Ask anything… “why doesn’t ChatGPT name us?”" value={input} onChange={setInput} onSubmit={() => send()} disabled={busy} />
    </>
  )
}
