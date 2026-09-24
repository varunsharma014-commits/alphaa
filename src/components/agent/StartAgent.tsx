"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AgentFeed, Composer } from "./AgentFeed"
import { agent, user, type Block, type Chip, type Message } from "@/lib/agent/types"
import { track } from "@/lib/gtag"
import { fbTrack } from "@/lib/pixel"
import type { ScanResult, EngineEvidence } from "@/types/scan"
import type { IdentifyResult } from "@/app/api/scan/identify/route"
import { BRAND } from "@/lib/brand"

type Phase = "website" | "manual" | "scanning" | "result" | "claimed"

const ENGINES = ["chatgpt", "gemini", "claude", "perplexity"] as const

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}
function isEvidence(v: unknown): v is EngineEvidence {
  return isRecord(v) && typeof v.response === "string" && typeof v.appeared === "boolean"
}
function domainOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  }
}
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

const STEP_LABELS = (domain: string) => [
  `Reading ${domain}`,
  "Working out what customers near you ask",
  "Asking ChatGPT, Gemini, Claude and Perplexity",
  "Checking who they recommended instead",
]
const PROGRESS_DONE: Record<string, number> = { site: 0, profile: 1, engines: 2, insights: 3 }

const CANNED: Record<string, string> = {
  "What exactly will you do?":
    "Every week I ask the four AIs the questions your customers ask and tell you what changed. In between, I write the pages and answers AI needs to read about you, keep your Google listing active, draft replies to reviews, and watch what your competitors publish. Anything public gets a one-tap approve from you first.",
  "Is this real?":
    "Yes. The answer above is what that AI returned a few seconds ago — I asked it live, the same way a customer would. The sources list is what Google shows for the same search. The money figure is an estimate and I label it as one.",
  "How much?":
    "$99 a month after 14 free days. No card today — I’ll ask for one when you start the trial, and you can cancel before day 14 and pay nothing.",
}

export function StartAgent() {
  const [messages, setMessages] = useState<Message[]>(() => [
    agent(
      [
        { kind: "text", text: "Hi. I’m Alphaa, an AI agent." },
        { kind: "text", text: "I get local businesses recommended by ChatGPT, Gemini, Claude and Perplexity." },
        { kind: "text", text: "What’s your website?", big: true },
      ],
      "greet"
    ),
  ])
  const [phase, setPhase] = useState<Phase>("website")
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [settled, setSettled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scanRef = useRef<{ id: string; businessName: string; domain: string } | null>(null)
  const identRef = useRef<Partial<IdentifyResult>>({})

  const push = useCallback((...m: Message[]) => setMessages((prev) => [...prev, ...m]), [])
  const patch = useCallback((id: string, fn: (m: Message) => Message) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)))
  }, [])

  useEffect(() => {
    if (settled && !busy) inputRef.current?.focus()
  }, [settled, busy])

  // ── step 2: run the real scan and narrate it ──────────────────────────────
  async function runScan(ident: { businessName: string; city: string; businessType: string; websiteUrl: string }) {
    const domain = domainOf(ident.websiteUrl || ident.businessName)
    setPhase("scanning")
    setBusy(true)
    const where = ident.city ? `, ${ident.city}` : ""
    push(
      agent([
        { kind: "text", text: `${ident.businessName}${where}. Give me 60 seconds — I’m going to ask the AIs about you the way a customer would.` },
        { kind: "steps", items: STEP_LABELS(domain), done: 0 },
      ], "scan-steps")
    )
    track("scan_started")

    let scanId: string
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: ident.businessName,
          city: ident.city || "your area",
          businessType: ident.businessType || "business",
          websiteUrl: ident.websiteUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.scanId) throw new Error(data.error || "scan failed")
      scanId = data.scanId
    } catch {
      setBusy(false)
      push(agent([{ kind: "text", text: "Something on my side didn’t start. Give me the website again and I’ll retry." }]))
      setPhase("website")
      return
    }
    scanRef.current = { id: scanId, businessName: ident.businessName, domain }

    // Poll. Real stage markers drive the step list.
    const started = Date.now()
    let result: ScanResult | null = null
    while (Date.now() - started < 100_000) {
      await new Promise((r) => setTimeout(r, 2500))
      try {
        const r = await fetch(`/api/scan/result?id=${scanId}`, { cache: "no-store" })
        const d = await r.json()
        if (d.ready && d.result) {
          result = d.result as ScanResult
          break
        }
        const done = PROGRESS_DONE[d.progress as string] ?? 0
        patch("scan-steps", (m) => ({
          ...m,
          blocks: m.blocks.map((b) => (b.kind === "steps" ? { ...b, done } : b)),
        }))
      } catch {}
    }
    patch("scan-steps", (m) => ({ ...m, blocks: m.blocks.map((b) => (b.kind === "steps" ? { ...b, done: 4 } : b)) }))

    if (!result) {
      setBusy(false)
      push(agent([{ kind: "text", text: "The AIs are slow to answer right now. I’ll keep trying — leave me your email and I’ll send the report the moment it’s ready." }, emailBlock()]))
      setPhase("result")
      return
    }

    // Quick-fix draft in parallel with the narration (Sonnet, ~15s).
    const quickFix = fetch("/api/scan/quick-fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)

    push(...narrate(result, ident.businessName, domain))

    const qf = (await quickFix) as { faqHtml?: string; quickFix?: { faqHtml?: string } } | null
    const faq = qf?.faqHtml ?? qf?.quickFix?.faqHtml
    if (faq && faq.length > 40) {
      push(
        agent([
          { kind: "text", text: "I’ve already started. Here’s the first page AI needs and your site doesn’t have — the questions customers ask before they call:" },
          { kind: "doc", title: `${domain} — FAQ`, meta: "draft · not published", html: faq },
          { kind: "text", text: "Written from your own site. Anything in [brackets] is a fact only you know. I won’t publish anything until you say so." },
        ])
      )
    }

    push(
      agent([
        { kind: "text", text: "Want me to keep going?", big: true },
        { kind: "text", text: "I’ll fix what’s above, ask the AIs again every week, and tell you every time something changes. Where do I send the full report?" },
        emailBlock(),
        { kind: "chips", items: Object.keys(CANNED).map((label) => ({ label, action: { type: "say", text: CANNED[label] }, primary: false })) },
      ], "ask")
    )
    setBusy(false)
    setPhase("result")
  }

  function emailBlock(): Block {
    return {
      kind: "email",
      label: "Your email",
      placeholder: "you@yourbusiness.com",
      cta: "Send it →",
      fine: "You’ll get the report and, if you start a trial, one short note from me each week — nothing else.",
    }
  }

  // ── step 1: website → identify ────────────────────────────────────────────
  async function submit() {
    const text = input.trim()
    if (!text) return
    setInput("")
    push(user(text))

    if (phase === "result" || phase === "claimed") {
      push(agent([{ kind: "text", text: "Once you start a trial I answer anything you ask here. For now — send yourself the report above and I’ll take it from there." }]))
      return
    }

    if (phase === "manual") {
      const [name, city] = text.split(/,| in /i).map((s) => s.trim())
      if (!name) return
      await runScan({ businessName: name, city: city ?? "", businessType: identRef.current.businessType ?? "", websiteUrl: identRef.current.websiteUrl ?? "" })
      return
    }

    setBusy(true)
    try {
      const res = await fetch("/api/scan/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        identRef.current = { websiteUrl: text }
        setBusy(false)
        setPhase("manual")
        push(
          agent([
            { kind: "text", text: res.status === 400 ? "That doesn’t look like a website address. Try something like yourbusiness.com — or just tell me the business name and city." : `I couldn’t read ${data.domain || "that site"} well enough to be sure who you are.` },
            { kind: "text", text: "What’s the business called, and which city?", big: true },
          ])
        )
        return
      }
      const ident = data as IdentifyResult
      identRef.current = ident
      setBusy(false)
      await runScan(ident)
    } catch {
      setBusy(false)
      push(agent([{ kind: "text", text: "I lost the connection for a second. Send the website again?" }]))
    }
  }

  // ── chips & email ─────────────────────────────────────────────────────────
  async function onChip(chip: Chip) {
    if (chip.action.type === "say") {
      push(user(chip.label), agent([{ kind: "text", text: chip.action.text }]))
    } else if (chip.action.type === "link") {
      window.location.href = chip.action.href
    }
  }

  async function onEmail(email: string): Promise<string | null> {
    const scan = scanRef.current
    if (!scan) return "I don’t have a finished scan to send yet."
    try {
      const res = await fetch("/api/scan/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scan.id, email }),
      })
      const data = await res.json()
      if (!res.ok) return data.error || "I couldn’t save that address. Try again?"
      track("scan_completed", { scan_id: scan.id })
      fbTrack("Lead")
      setPhase("claimed")
      push(
        user(email),
        agent([
          { kind: "text", text: `Done. The full report is on its way to ${email}.` },
          { kind: "text", text: "If you want me to actually fix this — not just report it — start the trial and I begin this week." },
          {
            kind: "chips",
            items: [
              { label: "Start my agent — 14 days free →", action: { type: "link", href: `/signup?scan=${scan.id}` }, primary: true },
              { label: "Read the full report", action: { type: "link", href: data.resultsUrl || `/scan/results?id=${scan.id}` }, primary: false },
            ],
          },
        ])
      )
      return null
    } catch {
      return "I couldn’t reach the server. Try again?"
    }
  }

  const placeholder =
    phase === "website" ? "yourbusiness.com" : phase === "manual" ? "Business name, City" : phase === "scanning" ? "Working…" : "Reply…"

  return (
    <div className="ag-land">
      <div className="ag-land__top">
        <Link className="ag-brand" href="/">
          <span className="ag-dot ag-dot--live" />
          {BRAND.name}
        </Link>
        <span>AI agent · online</span>
      </div>
      <AgentFeed messages={messages} animate="type" busy={busy} onChip={onChip} onEmail={onEmail} onSettled={() => setSettled(true)} />
      <div className="ag-land__stick">
        <Composer
          id="start-input"
          inputRef={inputRef}
          placeholder={placeholder}
          value={input}
          onChange={setInput}
          onSubmit={submit}
          disabled={busy || phase === "scanning"}
        />
        <div className="ag-land__hint">Nothing to install. No card. Just your website.</div>
      </div>
    </div>
  )
}

// ── turn a ScanResult into agent messages ────────────────────────────────────
function narrate(result: ScanResult, businessName: string, domain: string): Message[] {
  const out: Message[] = []
  const responses = isRecord(result.engineResponses) ? result.engineResponses : {}
  const evidence = ENGINES.map((e) => ({ engine: e, ev: isEvidence(responses[e]) ? (responses[e] as EngineEvidence) : null }))
  const withAnswer = evidence.filter((x) => x.ev && x.ev.response.trim().length > 20)
  const named = evidence.filter((x) => x.ev?.appeared).length
  const checked = evidence.filter((x) => x.ev).length

  // 1. The headline answer — ChatGPT if we have it, else whichever answered.
  const lead = withAnswer.find((x) => x.engine === "chatgpt") ?? withAnswer[0]
  if (lead?.ev) {
    const label = lead.engine === "chatgpt" ? "ChatGPT" : lead.engine === "gemini" ? "Gemini" : lead.engine === "claude" ? "Claude" : "Perplexity"
    out.push(
      agent([
        { kind: "text", text: `Here’s exactly what ${label} said.` },
        { kind: "answer", engine: lead.engine, query: lead.ev.query, answer: lead.ev.response, appeared: lead.ev.appeared, mentioned: lead.ev.mentioned ?? [], businessName },
      ])
    )
  }

  // 2. All four.
  if (checked > 0) {
    const blocks: Block[] = [
      { kind: "text", text: withAnswer.length > 1 ? "Same question, all four." : "All four, side by side." },
      { kind: "verdicts", items: evidence.map((x) => ({ engine: x.engine, state: x.ev ? (x.ev.appeared ? "found" : "missing") : "unknown" })) },
    ]
    const summary =
      named === 0 ? `${checked === 4 ? "None" : `None of the ${checked}`} of them named you.` :
      named === checked ? "All of them named you. That’s rare — now the job is staying there." :
      `${named} of ${checked} named you.`
    blocks.push({ kind: "text", text: summary })
    out.push(agent(blocks))
  }

  // 3. Who they named instead.
  const insights = isRecord(result.ogData) && isRecord((result.ogData as Record<string, unknown>).insights)
    ? ((result.ogData as Record<string, unknown>).insights as Record<string, unknown>)
    : null
  const details = Array.isArray(insights?.competitorDetails) ? (insights!.competitorDetails as { name: string; aiMentions: number; googleRank: number | null }[]) : []
  const rivals = details.filter((d) => d.name && d.name.toLowerCase() !== businessName.toLowerCase() && d.aiMentions > 0).sort((a, b) => b.aiMentions - a.aiMentions).slice(0, 3)
  if (rivals.length > 0 && named < checked) {
    const top = rivals[0]
    out.push(
      agent([
        { kind: "text", text: `They recommended ${rivals.map((r) => r.name).join(", ")} instead. ${top.name} was named by ${top.aiMentions} of ${checked}${top.googleRank ? ` and sits at #${top.googleRank} on Google` : ""}.` },
        { kind: "text", text: "That’s not because they’re better. It’s because AI can find the facts about them — hours, insurance, prices, what makes them different — and can’t find yours." },
      ])
    )
  }

  // 4. Where AI looks.
  const keyword = typeof insights?.keyword === "string" ? insights.keyword : ""
  const serp = isRecord(insights?.serp) && Array.isArray((insights!.serp as Record<string, unknown>).results)
    ? ((insights!.serp as Record<string, unknown>).results as { position: number; title: string; url: string; domain: string }[])
    : []
  if (serp.length > 0 && keyword) {
    const you = serp.find((s) => s.domain.replace(/^www\./, "") === domain)
    const items = serp.slice(0, 6).map((s) => {
      const d = s.domain.replace(/^www\./, "")
      const mine = d === domain
      return { name: d, detail: s.title?.slice(0, 80), status: mine ? `You · #${s.position}` : `#${s.position}`, ok: mine, href: s.url }
    })
    out.push(
      agent([
        { kind: "text", text: `When someone searches “${keyword}”, these are the pages Google shows first — and the pages AI reads before it answers.${you ? ` You’re at #${you.position}.` : " You’re not on the first page."}` },
        { kind: "sources", items },
      ])
    )
  }

  // 5. Money, honestly labelled.
  const loss = isRecord(insights?.estimatedMonthlyLoss) ? (insights!.estimatedMonthlyLoss as { low: number; high: number; basis: string }) : null
  if (loss && typeof loss.low === "number" && typeof loss.high === "number" && loss.high > 0 && named < checked) {
    out.push(
      agent([
        { kind: "stat", value: `${money(loss.low)}–${money(loss.high)}`, label: `a month, roughly, going to the businesses AI names instead. An estimate — ${loss.basis || "based on how often people ask AI for this."}` },
      ])
    )
  }

  // 6. First fix — only when the audit is real, never the placeholder set.
  const fallback = isRecord(result.ogData) && (result.ogData as Record<string, unknown>).auditFallback === true
  const issues = Array.isArray(result.issues) ? result.issues : []
  const first = issues.find((i) => isRecord(i) && i.severity === "critical") ?? issues[0]
  if (!fallback && isRecord(first) && typeof first.headline === "string") {
    out.push(
      agent([
        { kind: "text", text: `First thing I’d fix: ${first.headline.replace(/\.$/, "")}.` },
        ...(typeof first.explanation === "string" ? [{ kind: "text", text: first.explanation } as Block] : []),
      ])
    )
  }

  if (out.length === 0) {
    out.push(agent([{ kind: "text", text: "I couldn’t get a clean answer from the AIs this time. Leave me your email and I’ll re-run it and send you the result." }]))
  }
  return out
}
