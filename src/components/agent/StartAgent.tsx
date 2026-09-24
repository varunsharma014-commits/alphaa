"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AgentFeed, Composer } from "./AgentFeed"
import { agent, user, type Block, type Chip, type Message } from "@/lib/agent/types"
import { track } from "@/lib/gtag"
import { fbTrack } from "@/lib/pixel"
import type { ScanResult, EngineEvidence } from "@/types/scan"
import type { SiteChecks } from "@/lib/site-check"
import { CHECK_SHORT, CHECK_GROUP, CHECK_IMPACT, GROUP_TITLE, type CheckGroup, type CheckKey } from "@/lib/site-check-labels"
import type { SiteCheck, SiteCheckItem } from "@/lib/site-check"
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

const STEP_LABELS = (domain: string, local: boolean) => [
  `Reading ${domain}`,
  local ? "Working out what customers near you ask" : "Working out what customers ask",
  "Asking ChatGPT, Gemini, Claude and Perplexity",
  "Checking who they recommended instead",
]
const PROGRESS_DONE: Record<string, number> = { site: 0, profile: 1, engines: 2, insights: 3 }

const CANNED: Record<string, string> = {
  "What exactly will you do?":
    "This week: fix everything in the checklist above — llms.txt, the FAQ page, the facts AI couldn’t find. Every week after: ask the four AIs your customers’ questions and tell you what changed, keep your Google listing active, draft replies to reviews, and watch what your competitors publish. Anything public gets a one-tap approve from you first. You never touch code.",
  "Is this real?":
    "Yes. The answer above is what that AI returned a few seconds ago — I asked it live, the same way a customer would. The sources list is what Google shows for the same search. The money figure is an estimate and I label it as one.",
  "How much?":
    "$99 a month, month to month. Cancel in two clicks, no contract. An SEO agency charges around $2,000 a month for Google alone — and nothing for AI.",
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
        { kind: "steps", items: STEP_LABELS(domain, !!ident.city), done: 0 },
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
      const og = isRecord(result.ogData) ? (result.ogData as Record<string, unknown>) : {}
      const siteBlocked = !!(isRecord(og.siteChecks) && isRecord(og.siteChecks.you) && og.siteChecks.you.blocked)
      push(
        agent([
          { kind: "text", text: "I’ve already started. Here’s the first page AI needs and your site doesn’t have — the questions customers ask before they call:" },
          { kind: "doc", title: `${domain} — FAQ`, meta: "draft · not published", html: faq },
          { kind: "text", text: `${siteBlocked ? "Written from what the AIs already know about you — your site wouldn’t let me in." : "Written from your own site."} Anything in [brackets] is a fact only you know. I won’t publish anything until you say so.` },
        ])
      )
    }

    const plan = buildPlan(result, ident.businessName)
    push(
      agent([
        { kind: "text", text: "Here’s what I’d do for you this week.", big: true },
        { kind: "receipt", title: "Your first week", sub: `${plan.length} things`, items: plan },
        { kind: "text", text: "Your SEO agency is working on Google’s list of ten links. Your customers are getting one answer now — from AI. Nobody on your side has to learn anything: I do the work, you tap approve." },
      ])
    )
    push(
      agent([
        { kind: "text", text: "$99 a month. Month to month.", big: true },
        { kind: "text", text: "An agency charges around $2,000 for Google alone. Cancel in two clicks — no contract, no exit fees. I start the day you say go." },
        {
          kind: "chips",
          items: [
            { label: "Start today →", action: { type: "link", href: `/signup?scan=${scanId}` }, primary: true },
            { label: "Send me the report instead", action: { type: "ask", text: "report" }, primary: false },
            ...Object.keys(CANNED).map((label) => ({ label, action: { type: "say", text: CANNED[label] } as const, primary: false })),
          ],
        },
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
      push(agent([{ kind: "text", text: "Once you start I answer anything you ask here. For now — tap Start today, or send yourself the report and I’ll take it from there." }]))
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
    if (chip.action.type === "ask") {
      push(user(chip.label), agent([{ kind: "text", text: "Sure. Where do I send it?" }, emailBlock()]))
    } else if (chip.action.type === "say") {
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
          { kind: "text", text: "If you want me to actually fix this — not just report it — start today and I begin this week. $99 a month, cancel any time." },
          {
            kind: "chips",
            items: [
              { label: "Start today →", action: { type: "link", href: `/signup?scan=${scan.id}` }, primary: true },
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
      named >= checked - 1 ? `${named} of ${checked} named you. Strong. The one that didn’t is where I start.` :
      `${named} of ${checked} named you.`
    blocks.push({ kind: "text", text: summary })
    out.push(agent(blocks))
  }

  // 3. Who else they named. The framing depends on whether you were named too.
  const insights = isRecord(result.ogData) && isRecord((result.ogData as Record<string, unknown>).insights)
    ? ((result.ogData as Record<string, unknown>).insights as Record<string, unknown>)
    : null
  const details = Array.isArray(insights?.competitorDetails) ? (insights!.competitorDetails as { name: string; aiMentions: number; googleRank: number | null }[]) : []
  const rivals = details.filter((d) => d.name && d.name.toLowerCase() !== businessName.toLowerCase() && d.aiMentions > 0).sort((a, b) => b.aiMentions - a.aiMentions).slice(0, 3)
  if (rivals.length > 0 && checked > 0) {
    const top = rivals[0]
    const rank = top.googleRank ? ` and sits at #${top.googleRank} on Google` : ""
    if (named === 0) {
      out.push(
        agent([
          { kind: "text", text: `They recommended ${rivals.map((r) => r.name).join(", ")} instead. ${top.name} was named by ${top.aiMentions} of ${checked}${rank}.` },
          { kind: "text", text: "That’s not because they’re better. It’s because AI can find the facts about them — hours, prices, what makes them different — and can’t find yours." },
        ])
      )
    } else if (named < checked) {
      out.push(
        agent([
          { kind: "text", text: `Where you were missing, they named ${rivals.map((r) => r.name).join(", ")}. ${top.name} came up ${top.aiMentions} of ${checked} times${rank}.` },
          { kind: "text", text: "Every answer you’re not in is a customer hearing a different name. The gap is usually facts AI can find about them and not about you." },
        ])
      )
    } else {
      out.push(agent([{ kind: "text", text: `You were named every time. Also in the mix: ${rivals.map((r) => r.name).join(", ")}. The job now is staying ahead of them.` }]))
    }
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

  // 5. Demand, honestly labelled — the estimate is PEOPLE per month, not money.
  const loss = isRecord(insights?.estimatedMonthlyLoss) ? (insights!.estimatedMonthlyLoss as { low: number; high: number; basis: string }) : null
  if (loss && typeof loss.low === "number" && typeof loss.high === "number" && loss.high > 0 && keyword) {
    const tail = named === 0 ? "None of them heard your name." : named < checked ? `${checked - named} in ${checked} of those answers didn’t include you.` : "Right now, they hear yours."
    out.push(
      agent([
        { kind: "stat", value: `${loss.low.toLocaleString("en-US")}–${loss.high.toLocaleString("en-US")}`, label: `people a month ask an AI for “${keyword}”. ${tail} An estimate — ${loss.basis.replace(/^Based on/i, "based on")}` },
      ])
    )
  }

  // 6. What AI finds when it reads the site — you vs the competitors it named.
  const sc = isRecord(result.ogData) && isRecord((result.ogData as Record<string, unknown>).siteChecks)
    ? ((result.ogData as Record<string, unknown>).siteChecks as unknown as SiteChecks)
    : null
  if (sc?.you?.blocked) {
    const you = sc.you
    const b = you.blocked!
    const known = you.checks.filter((c) => c.ok !== null)
    out.push(
      agent([
        { kind: "text", text: `I tried to read ${you.domain} the way an AI does. It turned me away${b.status && b.status >= 300 ? ` (error ${b.status})` : b.status ? " with a bot check" : ""}${b.redirectedTo ? ` — after sending me to ${b.redirectedTo}` : ""}.`, big: false },
        { kind: "text", text: "That’s the biggest finding today. Some AI crawlers get the same door, so they fall back on what other sites say about you — and that’s where the competitors above win. Fixing it is a one-line change your host or web person can make; I’ll write the exact instruction." },
        { kind: "sources", items: known.map(srcItem) },
        { kind: "text", text: `The other ${you.total - known.length} checks — structured facts, reviews, service pages, how Google treats your pages — need your site to let me in. I’ll run them the moment it does.` },
      ])
    )
  } else if (sc?.you) {
    const you = sc.you
    const worst = hurtingMost(you)
    const groups = (["access", "understand", "trust"] as CheckGroup[])
      .map((g) => ({ g, items: you.checks.filter((c) => CHECK_GROUP[c.key] === g) }))
      .filter((x) => x.items.length > 0)
    out.push(
      agent([
        { kind: "text", text: `Then I read ${you.domain} the way ChatGPT, Claude and Perplexity do — ${you.total} checks. You pass ${you.passed}.` },
        ...groups.map(({ g, items }) => {
          // Problems first inside each group, so the eye lands on them.
          const sorted = [...items].sort((a, b) => rank(a) - rank(b))
          const passed = items.filter((c) => c.ok === true).length
          return { kind: "sources", title: `${GROUP_TITLE[g]}  ·  ${passed} of ${items.length}`, items: sorted.map(srcItem) } as Block
        }),
        ...(worst.length
          ? [{ kind: "text", text: `What’s hurting you most: ${worst.slice(0, 3).map((c) => CHECK_SHORT[c.key]).join("; ")}. ${worst.some((c) => c.key === "llms" || c.key === "faq") ? "I’ve drafted the first fix below." : "All fixable — none of it needs you to learn anything."}` } as Block]
          : [{ kind: "text", text: "Your site is in good shape for AI. The gap is what the rest of the web says about you — that’s where I’d work." } as Block]),
      ])
    )
  }
  if (sc && sc.competitors.length > 0) {
    const you = sc.you
    for (const rival of sc.competitors.slice(0, 2)) {
      const theyHave = rival.checks
        .filter((c) => c.ok === true && (!you || you.blocked || you.checks.find((y) => y.key === c.key)?.ok === false))
        .sort((a, b) => CHECK_IMPACT[b.key] - CHECK_IMPACT[a.key])
      if (theyHave.length === 0) continue
      const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "")
      const rd = rivals.find((r) => slug(r.name).length >= 4 && slug(rival.domain).includes(slug(r.name).slice(0, 5)))
      out.push(
        agent([
          { kind: "text", text: `${rd?.name ?? rival.domain}: ${rival.passed} of ${rival.total}. They have ${theyHave.slice(0, 4).map((c) => softLower(c.label)).join(", ")}.${you?.blocked ? " AI can read all of it." : " You don’t."}${rd && rd.aiMentions > named ? ` That’s part of why they were named ${rd.aiMentions} of ${checked} times and you ${named}.` : ""}` },
        ])
      )
      break
    }
  }

  if (out.length === 0) {
    out.push(agent([{ kind: "text", text: "I couldn’t get a clean answer from the AIs this time. Leave me your email and I’ll re-run it and send you the result." }]))
  }
  return out
}

// The week plan is built from what the checks actually found — never a
// generic list — so the close reads as "here is your situation, handled".
function srcItem(c: SiteCheckItem) {
  return { name: c.label, detail: c.detail, status: c.ok === true ? "Yes" : c.ok === false ? "No" : "Couldn’t check", ok: c.ok === true }
}

// Failures first (worst impact first), then unknowns, then passes.
function rank(c: SiteCheckItem): number {
  return c.ok === false ? 10 - CHECK_IMPACT[c.key] : c.ok === null ? 20 : 30
}

// Failed checks by impact, minus ones that only restate a bigger failure.
function hurtingMost(you: SiteCheck): SiteCheckItem[] {
  const failed = new Set(you.checks.filter((c) => c.ok === false).map((c) => c.key))
  const implied: Partial<Record<CheckKey, CheckKey>> = { schemaFacts: "schema", depth: "render", sitemap: "pages" }
  return you.checks
    .filter((c) => c.ok === false && !(implied[c.key] && failed.has(implied[c.key]!)))
    .sort((a, b) => CHECK_IMPACT[b.key] - CHECK_IMPACT[a.key])
}

// Lower-case a checklist label for mid-sentence use, keeping acronyms ("AI crawlers allowed").
function softLower(label: string): string {
  return /^[A-Z]{2,}\b/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1)
}

const PLAN_STEP: Partial<Record<CheckKey, string>> = {
  aibots: "Get your host to let ChatGPT, Claude and Perplexity’s crawlers through — I’ll write the exact setting",
  robots: "Fix your robots.txt so AI search can read you",
  indexable: "Remove the tag telling search engines to skip your homepage",
  render: "Make your key facts readable without JavaScript — I’ll hand your web person the exact list",
  canonical: "Fix the tags telling Google your pages are copies, so they get indexed",
  https: "Point every version of your address at one secure site",
  bing: "Set you up with Bing — ChatGPT search leans on it",
  llms: "Write and host your llms.txt — the file AI assistants read first",
  sitemap: "Add a sitemap so nothing on your site is missed",
  schema: "Add the structured facts block so AI reads your business, not just your words",
  schemaFacts: "Fill in your address, phone, hours and map location in your structured facts",
  facts: "Put the facts AI needs on your homepage — the ones it couldn’t find",
  local: "Put your city in your page title and main heading so AI knows where you work",
  depth: "Add the words AI needs to quote you — services, prices, areas you cover",
  pages: "Write a page for each service you offer",
  faq: "Publish the FAQ page above with your real answers filled in",
  reviews: "Put your best reviews on your site as text AI can read",
  profiles: "Link your Google, Yelp and social profiles so AI ties them to you",
  about: "Write your About page — who you are, since when, credentials",
  blog: "First fresh page AI can quote, written from your site",
  meta: "Rewrite your page title and description in plain words",
  headings: "Give your homepage one clear main heading",
}

function buildPlan(result: ScanResult, businessName: string): string[] {
  const og = isRecord(result.ogData) ? (result.ogData as Record<string, unknown>) : {}
  const sc = isRecord(og.siteChecks) ? (og.siteChecks as unknown as SiteChecks) : null
  const plan: string[] = []
  if (sc?.you?.blocked) plan.push("Get your site to let AI readers in — I’ll send your host the exact one-line fix")
  if (!sc?.you) plan.push("Read your site the way AI does and fix whatever it can’t see")
  if (sc?.you) {
    const steps = sc.you.blocked
      ? sc.you.checks.filter((c) => c.ok === false && c.key !== "aibots")
      : hurtingMost(sc.you)
    for (const c of steps) {
      const step = PLAN_STEP[c.key]
      if (step && !plan.includes(step)) plan.push(step)
      if (plan.length >= 5) break
    }
  }
  plan.push(`Ask ChatGPT, Gemini, Claude and Perplexity about ${businessName} again — and tell you what changed`)
  plan.push("Send you one short note: what I did, what moved, what I need a yes on")
  return plan
}
