"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AgentFeed, Composer } from "./AgentFeed"
import { agent, user as userMsg, type Block, type Chip, type Message } from "@/lib/agent/types"
import type { EngineKey } from "@/lib/agent/types"
import { siteCheckBlocks, describeSchemas } from "@/lib/agent/site-narration"
import { citationBlocks } from "@/lib/agent/thread-blocks"

type LiveResult = { engine: EngineKey; answer: string; appeared: boolean; mentioned: string[]; status: string }

type Task = "site-check" | "citations" | "schema"
const TOPIC_LINKS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard/t/reviews", label: "Reviews" },
  { href: "/dashboard/t/site", label: "Site Schema & Code" },
  { href: "/dashboard/t/sources", label: "Source Tracking" },
  { href: "/dashboard/t/competitors", label: "Competitors" },
  { href: "/dashboard/t/briefings", label: "Weekly Briefings" },
]

export function DashboardAgent({
  initial,
  businessName,
  autorun = [],
  current = "/dashboard",
  context,
}: {
  initial: Message[]
  businessName: string
  autorun?: Task[]
  current?: string
  context?: { businessType: string | null; city: string | null }
}) {
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
  const replace = (id: string, m: Message) => setMessages((prev) => prev.map((x) => (x.id === id ? { ...m, id } : x)))
  const setSteps = (id: string, done: number) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, blocks: m.blocks.map((b) => (b.kind === "steps" ? { ...b, done } : b)) } : m)))

  // Jobs the agent starts on its own (or on "run" chips): never a blank
  // page with a button — the thread shows progress, then the findings.
  async function runTask(task: Task) {
    if (task === "site-check") {
      const id = "st-run"
      let n = 0
      const t = setInterval(() => setSteps(id, Math.min(++n, 3)), 3500)
      const { ok, data } = await post<{ check?: Parameters<typeof siteCheckBlocks>[0]; userId?: string }>("/api/agent/site-check")
      clearInterval(t)
      if (!ok || !data.check) return replace(id, agent([{ kind: "text", text: data.error ?? "I couldn’t read your site just now. I’ll try again shortly." }, { kind: "chips", items: [{ label: "Try again", action: { type: "run", task: "site-check" }, primary: true }] }]))
      replace(id, agent(siteCheckBlocks(data.check)))
      await runTask("schema")
      if (data.userId) {
        const llms = `${window.location.origin}/llms/${data.userId}`
        push(agent([
          { kind: "text", text: "I also keep the file AI assistants read first — your llms.txt — up to date for you, hosted here:" },
          { kind: "doc", title: "llms.txt · kept current by Alphaa", meta: "live", text: llms },
          { kind: "chips", items: [{ label: "Copy the link for my web person", action: { type: "copy", text: llms, done: "Copied. Your web person points yoursite.com/llms.txt at it — one redirect." }, primary: false }] },
        ]))
      }
      return
    }
    if (task === "schema") {
      let res = await fetch("/api/schema/latest").then((r) => r.json()).catch(() => ({}))
      let schemas = res?.schemaMarkup?.schemas as { type: string; jsonLd: Record<string, unknown> }[] | undefined
      if (!schemas?.length) {
        push(agent([{ kind: "text", text: "Writing the structured facts AI reads about you…" }], "schema-run"))
        const gen = await post<{ schemas?: typeof schemas }>("/api/schema/generate")
        schemas = gen.data.schemas
        setMessages((prev) => prev.filter((m) => m.id !== "schema-run"))
        if (!gen.ok || !schemas?.length) return fail(gen.data.error ?? "I couldn’t write your structured facts just now.")
        res = null
      }
      const code = schemas.map((s) => `<script type="application/ld+json">\n${JSON.stringify(s.jsonLd, null, 2)}\n</script>`).join("\n\n")
      push(agent([
        { kind: "text", text: "I wrote the structured facts AI reads about you.", big: true },
        { kind: "receipt", title: "What it tells AI", sub: `${schemas.length} ${schemas.length === 1 ? "block" : "blocks"} · ready to install`, items: describeSchemas(schemas) },
        { kind: "text", text: "It goes in your site’s header once. You don’t touch it — pick who installs it:" },
        { kind: "chips", items: [
          { label: "Have a person install it", action: { type: "link", href: "/dashboard/concierge" }, primary: true },
          { label: "Copy it for my web person", action: { type: "copy", text: code, done: "Copied. Your web person pastes it into the site header — that’s the whole job." } },
        ] },
      ]))
      return
    }
    if (task === "citations") {
      const id = "src-run"
      let n = 0
      const t = setInterval(() => setSteps(id, Math.min(++n, 2)), 20000)
      const { ok, data } = await post<{ report?: Parameters<typeof citationBlocks>[0] }>("/api/citations")
      clearInterval(t)
      if (!ok || !data.report || !data.report.targets?.length) return replace(id, agent([{ kind: "text", text: data.error ?? "The search didn’t come back this time. I’ll run it again on my next pass." }, { kind: "chips", items: [{ label: "Try again now", action: { type: "run", task: "citations" }, primary: true }] }]))
      replace(id, agent(citationBlocks(data.report, context?.businessType ?? null, context?.city ?? null, new Date())))
    }
  }

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      for (const t of autorun) await runTask(t)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        if (a.href.startsWith("/api/")) window.location.href = a.href
        else router.push(a.href)
        return
      case "copy":
        try {
          await navigator.clipboard.writeText(a.text)
          push(agent([{ kind: "text", text: a.done ?? "Copied." }]))
        } catch {
          push(agent([{ kind: "doc", title: "Copy this", meta: "select all", text: a.text }]))
        }
        return
      case "run":
        push(agent([{ kind: "text", text: "On it." }, { kind: "steps", items: ["Working"], done: 0 }], a.task === "citations" ? "src-run" : a.task === "site-check" ? "st-run" : undefined))
        return runTask(a.task)
      case "draft": {
        push(userMsg(chip.label))
        setBusy(true)
        const { ok, data } = await post<{ title?: string; text?: string }>("/api/agent/draft", { topic: a.topic, competitor: a.competitor })
        setBusy(false)
        if (!ok || !data.text) return fail(data.error ?? "I couldn’t write that just now.")
        const docId = `draft-${Date.now()}`
        push(agent([
          { kind: "text", text: `Here’s the section I’d add to your site — written from your facts. Anything in [brackets] is a detail only you know.` },
          { kind: "doc", title: data.title ?? a.topic, meta: "draft · not published", text: data.text, docId, editable: true },
          { kind: "chips", items: [
            { label: "Approve — have a person publish it", action: { type: "link", href: "/dashboard/concierge" }, primary: true },
            { label: "Copy it", action: { type: "copy", text: data.text, done: "Copied." } },
          ] },
        ]))
        return
      }
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
    const { ok, data } = await post<{ text?: string; liveQuestion?: string | null }>("/api/agent/chat", { message: q, history, topic: current })
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
      <nav className="ag-topics" aria-label="Topics">
        {TOPIC_LINKS.map((t) => (
          <Link key={t.href} href={t.href} className={t.href === current ? "on" : ""}>{t.label}</Link>
        ))}
      </nav>
      <Composer id="agent-input" inputRef={inputRef} placeholder="Ask anything… “why doesn’t ChatGPT name us?”" value={input} onChange={setInput} onSubmit={() => send()} disabled={busy} />
    </>
  )
}
