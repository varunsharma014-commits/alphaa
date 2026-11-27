"use client"

import { AgentWorkPreview } from "@/components/agent/AgentWorkPreview"
import { Sparkles } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AgentFeed, Composer } from "./AgentFeed"
import { agent, user, type Block, type Chip, type Message } from "@/lib/agent/types"
import { track } from "@/lib/gtag"
import { fbTrack } from "@/lib/pixel"
import type { ScanResult, EngineEvidence, ScanQuestion } from "@/types/scan"
import type { SiteChecks } from "@/lib/site-check"
import { CHECK_SHORT, CHECK_GROUP, CHECK_IMPACT, GROUP_TITLE, type CheckGroup, type CheckKey } from "@/lib/site-check-labels"
import type { SiteCheck, SiteCheckItem } from "@/lib/site-check"
import type { IdentifyResult } from "@/app/api/scan/identify/route"
import { BRAND } from "@/lib/brand"
import { localPrice } from "@/lib/local-price"
import { PLAN_PRICES } from "@/lib/constants"
import { GUARANTEE_LINE } from "@/lib/offer-copy"
import { NURTURE_EU_FINE, NURTURE_NOTICE, NURTURE_OPTIN_LABEL, visitorConsentRegion } from "@/lib/nurture-consent"

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
// Live status lines under the running step, so the 60-second wait never looks frozen.
const STEP_TICKER = (domain: string): string[][] => [
  [`Opening ${domain}`, "Reading what you do and where", "Finding your services"],
  ["Thinking like a customer would", "Picking the question people actually ask", "Checking how often it gets asked"],
  ["Asking ChatGPT…", "Asking Gemini…", "Asking Claude…", "Asking Perplexity…", "Reading their answers"],
  ["Checking who got named instead", "Reading your site the way AI does", "Running 23 checks", "Drafting your first fix"],
]
const PROGRESS_DONE: Record<string, number> = { site: 0, profile: 1, engines: 2, insights: 3 }

// Not shown as pills (they invited doubt at checkout) — answered when typed.
const CANNED: Record<string, string> = {
  "What exactly will you do?":
    "Every week I check what ChatGPT, Gemini, Claude and Perplexity say about you, fix your website so they and Google can recommend you, and write blog posts that answer what your customers ask. On Pro I also post to your Google listing in your voice, reply to your reviews, write 3 social posts a week in your brand colours, ready to publish in one tap, and email your past customers. On Growth (early access) I’ll run your Google and Meta ads too, when ads open. You approve what goes out, or let me run on my own. You never touch code.",
  "Is this real?":
    "Yes. The answer above is what that AI returned a few seconds ago — I asked it live, the same way a customer would. The sources list is what Google shows for the same search. The people-per-month figure is an estimate, and I label it as one.",
  "How much?":
    // {starter} / {pro} / {growth} become local prices when answered (localPrice).
    `{starter} a month for Starter, month to month: I get you named by ChatGPT, Gemini, Claude and Perplexity, with website fixes and blog posts. Pro ({pro}) is everything except ads: your social media, Google listing, reviews and emails to past customers. Growth ({growth}, early access) adds Google and Meta ads for 1 ad account. Cancel online in a minute, no contract. ${GUARANTEE_LINE}`,
}

// Where the conversation runs:
//  public — /start, a visitor; ends with "Get started" → sign up.
//  setup  — /onboarding, just signed up; ends with checkout, no forms.
//  resume — /onboarding, business already known; straight to checkout.
export type StartMode = "public" | "setup" | "resume"

const CHECKOUT = "#checkout"

// Same promise as the homepage hero (lib/... cron/guarantee enforces it). Shown wherever the price is.
const GUARANTEE = GUARANTEE_LINE

/** Opening lines for a local market page (/de, /fr…): the rest of the
 *  conversation is still English. */
export type StartGreet = { lines: string[]; ask: string; hint: string; idleHint: string; startHere?: string; work?: { title: string; steps: string[] }; agentLabel?: string }

/** Plans the agent conversation can sell (/onboarding?plan=…). */
export type AgentPlan = "starter" | "pro" | "growth"
const PLAN_LINE: Record<AgentPlan, string> = {
  starter: "Starter plan: I get you named by ChatGPT, Gemini, Claude and Perplexity. I check what they say every week, fix your website and write 2 blog posts a month, so more customers find you and you get your time back.",
  pro: "Pro plan: everything except ads. I write your social media too, 3 branded posts a week ready to publish in one tap, post to your Google listing, reply to your reviews, email your past customers and show which calls and forms your marketing brought in, for up to 3 locations, with posts that can publish on their own.",
  growth: "Growth plan (early access): everything in Pro, plus I build and tune your Google and Meta ads for 1 ad account when ads open. Nothing spends until you approve it.",
}

/** "$499 a month. Month to month." or, billed yearly (USD only), "$424 a month, billed yearly ($5,090 a year)." */
function priceText(plan: AgentPlan, annual: boolean): string {
  if (!annual) return `${localPrice(plan)} a month. Month to month.`
  const p = PLAN_PRICES[plan]
  return `$${p.annual} a month, billed yearly ($${p.annualTotal.toLocaleString("en-US")} a year).`
}

function greeting(mode: StartMode, name?: string, greet?: StartGreet, embedded = false, plan: AgentPlan = "starter", annual = false): Message[] {
  if (greet && mode === "public") {
    // Embedded with a work list: the question sits under the list instead (AgentWorkPreview).
    const ask = embedded && greet.work ? [] : [{ kind: "text" as const, text: greet.ask, big: true }]
    return [agent([...greet.lines.map((t) => ({ kind: "text" as const, text: t })), ...ask], "greet")]
  }
  if (mode === "resume") {
    return [
      agent(
        [
          { kind: "text", text: name ? `Welcome back. I’ve got ${name} ready to go.` : "Welcome back. You’re all set up." },
          ...(PLAN_LINE[plan] ? [{ kind: "text" as const, text: PLAN_LINE[plan] }] : []),
          { kind: "text", text: priceText(plan, annual), big: true },
          { kind: "text", text: `${GUARANTEE} Cancel online in a minute, no contract. I start the day you say go.` },
          { kind: "cta", chip: { label: "Get started →", action: { type: "link", href: CHECKOUT }, primary: true } },
        ],
        "greet"
      ),
    ]
  }
  return [
    agent(
      mode === "setup"
        ? [
            { kind: "text", text: "You’re in. I’m Alphaa, your AI marketing agent." },
            { kind: "text", text: "No forms. Give me your website and I’ll work out the rest." },
            { kind: "text", text: "What’s your website?", big: true },
          ]
        : [
            { kind: "text", text: "Hi. I’m Alphaa, your AI marketing agent." },
            { kind: "text", text: "Give me your website. I’ll see where your customers find you today, then write your first week of marketing." },
            // In the homepage hero the question sits under the work list instead (AgentWorkPreview).
            ...(embedded ? [] : [{ kind: "text" as const, text: "What’s your website?", big: true }]),
          ],
      "greet"
    ),
  ]
}

// embedded: the same conversation inside the homepage hero window. It scrolls
// inside its own box and never moves the page.
export function StartAgent({
  mode = "public",
  resumeName,
  embedded = false,
  greet,
  autoCheckout = false,
  handoff,
  plan: buyPlan = "starter",
  annual = false,
}: {
  mode?: StartMode
  resumeName?: string
  embedded?: boolean
  greet?: StartGreet
  /** resume only: the visitor already tapped "Get started" before signing up — open checkout now, no second tap. */
  autoCheckout?: boolean
  /** embedded only: send the typed website to this page (e.g. /start?site=…) instead of scanning in place. */
  handoff?: string
  /** onboarding only: the plan picked on /pricing (default Starter). */
  plan?: AgentPlan
  /** onboarding only: billed yearly (picked on /pricing). */
  annual?: boolean
}) {
  const [messages, setMessages] = useState<Message[]>(() => greeting(mode, resumeName, greet, embedded, buyPlan, annual))
  const [phase, setPhase] = useState<Phase>(mode === "resume" ? "result" : "website")
  // Read inside async handlers (onEmail runs mid-scan), where the state value would be stale.
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [settled, setSettled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scanRef = useRef<{ id: string; businessName: string; domain: string } | null>(null)
  const identRef = useRef<Partial<IdentifyResult>>({})
  const draftedRef = useRef(false)
  // The address given while the scan was still running (so the close doesn't ask twice).
  const emailRef = useRef<string | null>(null)

  const push = useCallback((...m: Message[]) => setMessages((prev) => [...prev, ...m]), [])
  const patch = useCallback((id: string, fn: (m: Message) => Message) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)))
  }, [])

  // Signed up from the scan's "Get started": they already said yes, so go
  // straight to checkout instead of asking a second time on /onboarding.
  const autoRan = useRef(false)
  useEffect(() => {
    if (!autoCheckout || mode !== "resume" || autoRan.current) return
    autoRan.current = true
    void checkout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheckout, mode])

  // /start?site=… (handed over from the homepage box): start on that website straight away.
  const siteRan = useRef(false)
  useEffect(() => {
    if (mode !== "public" || embedded || siteRan.current) return
    const site = new URLSearchParams(window.location.search).get("site")?.trim()
    if (!site) return
    siteRan.current = true
    setStarted(true)
    void submit(site.slice(0, 200))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const boxRef = useRef<HTMLDivElement>(null)
  // Embedded, before the first answer: the box stays short and the website
  // field sits right under the question, with a "start here" cue.
  const [started, setStarted] = useState(false)
  const idle = embedded && !started && phase === "website"
  const typed = useTypedExamples(idle && !input)

  useEffect(() => {
    // Embedded: focus without scrolling, and only once the visitor has typed.
    if (settled && !busy && (!embedded || phase !== "website")) inputRef.current?.focus({ preventScroll: embedded })
  }, [settled, busy, embedded, phase])

  // Embedded: keep the box pinned to the newest line unless the visitor has
  // scrolled up to read.
  useEffect(() => {
    const box = boxRef.current
    if (!embedded || !box) return
    let lastHeight = box.scrollHeight
    const obs = new MutationObserver(() => {
      const nearBottom = lastHeight - box.scrollTop - box.clientHeight < 140
      if (nearBottom) box.scrollTop = box.scrollHeight
      lastHeight = box.scrollHeight
    })
    obs.observe(box, { childList: true, subtree: true, characterData: true })
    return () => obs.disconnect()
  }, [embedded])

  // ── step 2: run the real scan and narrate it ──────────────────────────────
  async function runScan(ident: { businessName: string; city: string; businessType: string; websiteUrl: string }) {
    const domain = domainOf(ident.websiteUrl || ident.businessName)
    setPhase("scanning")
    setBusy(true)
    const where = ident.city ? `, ${ident.city}` : ""
    push(
      agent([
        { kind: "text", text: `${ident.businessName}${where}. First, let me see where your customers find you today. I’ll ask the AIs about you the way a customer would. About 60 seconds.` },
        { kind: "steps", items: STEP_LABELS(domain, !!ident.city), done: 0, ticker: STEP_TICKER(domain) },
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
    // The 60-second wait is the best moment to ask for the address: most visitors who
    // leave never come back, and 2 of 21 left one when we only asked at the end (Nov 2026).
    if (mode === "public") {
      push(
        agent([
          { kind: "text", text: "While I work: where should I send your full report? Once I’m done, I’ll also write your first week of marketing." },
          emailBlock("Send it to me"),
        ], "scan-email")
      )
    }

    // Poll. Real stage markers drive the step list.
    const started = Date.now()
    let result: ScanResult | null = null
    while (Date.now() - started < 160_000) {
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

    {
      const resp = isRecord(result.engineResponses) ? result.engineResponses : {}
      const ev = ENGINES.map((e) => (isEvidence(resp[e]) ? (resp[e] as EngineEvidence) : null))
      track("scan_result_shown", { named: ev.filter((x) => x?.appeared).length, checked: ev.filter(Boolean).length })
    }
    push(...narrate(result, ident.businessName, domain, hireHref(scanId)))

    const qf = (await quickFix) as { faqHtml?: string; quickFix?: { faqHtml?: string } } | null
    const faq = qf?.faqHtml ?? qf?.quickFix?.faqHtml
    if (faq && faq.length > 40) {
      draftedRef.current = true
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

    // Public: the first week of marketing, written now, behind the visitor's email.
    if (mode === "public") {
      setBusy(false)
      setPhase("result")
      if (emailRef.current) await runWeekDemo(scanId, ident.businessName)
      else push(weekGate(ident.businessName))
      return
    }

    const plan = buildPlan(result, ident.businessName)
    push(
      agent([
        { kind: "text", text: "Here’s what I’d do for you this week.", big: true },
        { kind: "receipt", title: "Your first week", sub: `${plan.length} things`, items: plan },
        { kind: "text", text: "I run your marketing every week: AI search, your website and your blog, plus your Google listing, reviews, social media and email on Pro. Nobody on your side has to learn anything. I do the work, you tap approve, and you get your time back." },
      ])
    )
    push(
      agent([
        ...(PLAN_LINE[buyPlan] ? [{ kind: "text", text: PLAN_LINE[buyPlan] } as Block] : []),
        { kind: "text", text: priceText(buyPlan, annual), big: true },
        { kind: "text", text: `${GUARANTEE} Cancel online in a minute, no contract. ${draftedRef.current ? "The page I drafted for you today is ready the moment you say go." : "I start the day you say go."}` },
        { kind: "cta", chip: { label: "Get started →", action: { type: "link", href: hireHref(scanId) }, primary: true } },
      ], "ask")
    )
    setBusy(false)
    setPhase("result")
  }

  function priceMessage(scanId: string, afterWeek = false): Message {
    // The first week shows a Google update and social posts: on a public visit with no plan
    // picked, those are Pro work (2026-11-26), so the week sells Pro with Starter as the option.
    if (afterWeek && buyPlan === "starter" && mode === "public") {
      return agent([
        { kind: "text", text: "Want me to post these and do this every week?", big: true },
        { kind: "text", text: `${PLAN_LINE.pro} ${localPrice("pro")} a month, month to month. ${GUARANTEE} Cancel online in a minute, no contract.` },
        { kind: "text", text: `Just want ChatGPT, Gemini, Claude and Perplexity to name you? Starter is ${localPrice("starter")} a month for AI search.` },
        { kind: "chips", items: [{ label: "Start with Starter", action: { type: "link", href: `/signup?scan=${scanId}` } }] },
        { kind: "cta", chip: { label: "Get Pro →", action: { type: "link", href: `/signup?scan=${scanId}&plan=pro` }, primary: true } },
      ], "ask")
    }
    return agent([
      ...(PLAN_LINE[buyPlan] ? [{ kind: "text", text: PLAN_LINE[buyPlan] } as Block] : []),
      { kind: "text", text: afterWeek ? "Want me to post these and do this every week?" : priceText(buyPlan, annual), big: true },
      { kind: "text", text: `${afterWeek ? `${priceText(buyPlan, annual)} ` : ""}${GUARANTEE} Cancel online in a minute, no contract.` },
      { kind: "cta", chip: { label: "Get started →", action: { type: "link", href: hireHref(scanId) }, primary: true } },
    ], "ask")
  }

  // The email gate: one first week per address.
  function weekGate(name: string): Message {
    return agent([
      { kind: "text", text: "Now let me show you what I’d actually do.", big: true },
      { kind: "text", text: `I’ll write ${name}’s first week of marketing right now: a Google update and 2 social posts, in your voice, with your logo and colours, planned around what’s happening this week. Where should I send it?` },
      emailBlock("Write my first week"),
    ], "week-gate")
  }

  async function runWeekDemo(scanId: string, name: string) {
    setBusy(true)
    track("week_preview_started")
    let id = scanId
    let again = false
    try {
      const r = await fetch("/api/scan/week", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scanId }) })
      const d = await r.json()
      if (!r.ok || !d.id) {
        push(agent([{ kind: "text", text: d.error || "I couldn’t start writing just now." }]), priceMessage(scanId))
        setBusy(false)
        return
      }
      id = d.id
      again = !!d.again
    } catch {
      push(agent([{ kind: "text", text: "I couldn’t reach the server. Try again in a minute." }]), priceMessage(scanId))
      setBusy(false)
      return
    }
    push(agent([
      { kind: "text", text: again ? "You already have a first week from me. Here it is." : `Writing ${name}’s first week now. About a minute.` },
      { kind: "steps", items: ["Reading your logo, colours and how you write", "Looking up what’s happening this week", "Planning your first week", "Writing your Google update", "Writing 2 social posts with your images"], done: 0 },
    ], "week-steps"))
    type W = import("@/lib/demo-week").PublicWeek
    let week: W | null = null
    const t0 = Date.now()
    while (Date.now() - t0 < 200_000) {
      try {
        const r = await fetch(`/api/scan/week?id=${id}`, { cache: "no-store" })
        const d = (await r.json()) as { week?: W }
        if (d.week) {
          const w = d.week
          patch("week-steps", (m) => ({ ...m, blocks: m.blocks.map((b) => (b.kind === "steps" ? { ...b, items: w.steps.map((s) => s.text), done: w.steps.filter((s) => s.done).length } : b)) }))
          if (w.status !== "running") { week = w; break }
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 2500))
    }
    setBusy(false)
    if (!week || week.status === "failed" || !week.items.some((i) => i.text)) {
      push(agent([{ kind: "text", text: "Writing took longer than it should. I’ll email your first week as soon as it’s done." }]), priceMessage(scanId))
      return
    }
    track("week_preview_shown")
    const label = { google: "Google update", social: "Social post" } as const
    const out: Message[] = [agent([
      { kind: "text", text: "Here’s your first week, ready to go.", big: true },
      { kind: "text", text: `Written in your voice${week.voiceName ? ` (“${week.voiceName}”)` : ""}, with your own logo and colours.` },
      { kind: "receipt", title: "Your first week", items: week.items.filter((i) => i.text).map((i) => `${i.day} · ${label[i.kind]} · ${i.title}`) },
    ])]
    if (week.trends.length) out.push(agent([
      { kind: "text", text: "What your customers are paying attention to this week:" },
      { kind: "sources", items: week.trends.map((t) => ({ name: t.title, detail: t.why, status: t.when ?? "", ok: true, href: t.url })) },
    ]))
    for (const it of week.items) {
      if (!it.text) continue
      out.push(agent([
        { kind: "text", text: `${it.day}: ${it.why}` },
        { kind: "doc", title: it.title, meta: label[it.kind], text: it.text, image: it.image ?? undefined, square: it.kind === "social" },
      ]))
    }
    out.push(priceMessage(scanId, true))
    push(...out)
  }

  function hireHref(scanId: string) {
    return mode === "public" ? `/signup?scan=${scanId}` : CHECKOUT
  }

  function emailBlock(cta = "Send it →"): Block {
    const region = visitorConsentRegion()
    return {
      kind: "email",
      label: "Your email",
      placeholder: "you@yourbusiness.com",
      cta,
      fine: region.de ? "We’ll email your report. Unsubscribe anytime." : region.eu ? NURTURE_EU_FINE : NURTURE_NOTICE,
      ...(region.eu && !region.de ? { optIn: NURTURE_OPTIN_LABEL } : {}),
    }
  }

  // ── step 1: website → identify ────────────────────────────────────────────
  async function submit(override?: string) {
    const text = (override ?? input).trim()
    if (!text) return
    if (handoff && phase === "website") {
      track("scan_input_submit", { from: "home_box" })
      window.location.href = `${handoff}?site=${encodeURIComponent(text.slice(0, 200))}`
      return
    }
    setInput("")
    push(user(text))

    if (phase === "result" || phase === "claimed") {
      const t = text.toLowerCase()
      const canned =
        /real|legit|trust|fake|true/.test(t) ? CANNED["Is this real?"]
        : /how much|price|cost|\$|pay|expensive/.test(t) ? CANNED["How much?"].replace("{starter}", localPrice()).replace("{pro}", localPrice("pro")).replace("{growth}", localPrice("growth"))
        : /what (exactly )?(will|do|would) you|what.*do for me|how does it work/.test(t) ? CANNED["What exactly will you do?"]
        : null
      push(agent([{ kind: "text", text: canned ?? (mode === "public" ? "Once you start I answer anything you ask here. For now, tap “Get started”, or email yourself the report and I’ll take it from there." : "Once you start I answer anything you ask here. Tap “Get started” and I begin this week.") }]))
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
    } else if (chip.action.type === "link" && chip.action.href === CHECKOUT) {
      track("hire_click", { mode })
      await checkout()
    } else if (chip.action.type === "link") {
      if (chip.action.href.startsWith("/signup")) track("hire_click", { mode })
      window.location.href = chip.action.href
    }
  }

  // This page runs without Clerk's browser SDK, so nothing refreshes the 60-second session
  // token while the scan narrates (over a minute). A signed-out API call answers 401, or 404
  // from auth.protect(). A full page load refreshes the session (Clerk handshake), and
  // /onboarding?scan= finishes setup server-side and opens checkout by itself (autoCheckout).
  const stale = (r: Response) => r.status === 401 || (r.status === 404 && !(r.headers.get("content-type") ?? "").includes("json"))
  function reloadForCheckout(scanId?: string) {
    const q = new URLSearchParams({ retry: "1", plan: buyPlan, ...(annual ? { billing: "annual" } : {}), ...(scanId ? { scan: scanId } : {}) })
    window.location.href = `/onboarding?${q}`
  }

  // setup/resume: the scan is the onboarding — save it, then straight to Stripe.
  async function checkout() {
    if (busy) return
    setBusy(true)
    try {
      const scan = scanRef.current
      if (mode === "setup" && scan) {
        const r = await fetch("/api/user/onboarding-from-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId: scan.id, businessType: identRef.current.businessType ?? "" }),
        })
        if (stale(r)) return reloadForCheckout(scan.id)
        if (!r.ok) throw new Error("onboard")
      }
      const value = annual ? PLAN_PRICES[buyPlan].annualTotal : PLAN_PRICES[buyPlan].monthly
      fbTrack("InitiateCheckout", { value, currency: "USD" })
      track("begin_checkout", { value, currency: "USD", plan: buyPlan })
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase: buyPlan, annual }),
      })
      if (stale(res)) return reloadForCheckout(scan?.id)
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error("checkout")
      push(agent([{ kind: "text", text: "I’m opening secure checkout…" }]))
      window.location.href = data.url
    } catch {
      setBusy(false)
      push(agent([{ kind: "text", text: "I couldn’t open checkout just now. Tap “Get started” again, or email hi@alphaa.app and we’ll set you up." }]))
    }
  }

  async function onEmail(email: string, optIn?: boolean): Promise<string | null> {
    const scan = scanRef.current
    if (!scan) return "I don’t have a finished scan to send yet."
    try {
      const res = await fetch("/api/scan/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scan.id, email, nurture: { ...visitorConsentRegion(), optIn: optIn === true } }),
      })
      const data = await res.json()
      if (!res.ok) return data.error || "I couldn’t save that address. Try again?"
      track("scan_completed", { scan_id: scan.id })
      track("generate_lead", { source: phaseRef.current === "scanning" ? "during_scan" : "after_scan" })
      fbTrack("Lead")
      emailRef.current = email
      if (phaseRef.current === "scanning") {
        // Still working: just confirm, the results keep coming in below.
        push(user(email), agent([{ kind: "text", text: `Got it. The full report goes to ${email}, and when I’m done I’ll write your first week of marketing.` }]))
        return null
      }
      if (mode === "public") {
        setPhase("claimed")
        push(user(email), agent([{ kind: "text", text: `Got it. Your full report is on its way to ${email}.` }]))
        void runWeekDemo(scan.id, scan.businessName)
        return null
      }
      setPhase("claimed")
      push(
        user(email),
        agent([
          { kind: "text", text: `Done. The full report is on its way to ${email}.` },
          { kind: "text", text: `If you want me to fix this and get you named by AI from here (your website, your blog and weekly AI checks), start today and I begin this week. ${localPrice()} a month, cancel any time. ${GUARANTEE}` },
          { kind: "cta", chip: { label: "Get started →", action: { type: "link", href: `/signup?scan=${scan.id}` }, primary: true } },
          {
            kind: "chips",
            items: [
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

  const composer = (
    <div className="ag-land__stick">
      <Composer
        id="start-input"
        inputRef={inputRef}
        placeholder={idle && !input ? typed : placeholder}
        value={input}
        onChange={setInput}
        onSubmit={() => {
          setStarted(true)
          submit()
        }}
        disabled={busy || phase === "scanning"}
      />
      <div className="ag-land__hint">
        {idle
          ? greet?.idleHint ?? "I’ll ask ChatGPT, Gemini, Claude and Perplexity about you live. About 60 seconds, no card."
          : greet?.hint ?? (mode === "public" ? "Nothing to install. No card. Just your website." : "Nothing to install. Just your website.")}
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className={`ag-window ag-window--live ${idle ? "ag-window--idle" : ""}`}>
        <div className="ag-window__bar">
          <i /><i /><i />
          <span>{BRAND.name} · {greet?.agentLabel ?? "AI agent · online"}</span>
        </div>
        <div className="ag-window__box" ref={boxRef}>
          <AgentFeed messages={messages} animate="type" busy={busy} autoScroll={false} onChip={onChip} onEmail={onEmail} onSettled={() => setSettled(true)} />
          {idle && (!greet || greet.work) && <AgentWorkPreview {...(greet?.work ?? {})} />}
          {idle && (!greet || greet.work) && <p className="ag-work__ask">{greet?.ask ?? "What’s your website?"}</p>}
        </div>
        <div className="ag-window__compose">{composer}</div>
      </div>
    )
  }

  return (
    <div className="ag-land">
      <div className="ag-land__top">
        <Link className="ag-brand" href="/">
          <Sparkles className="ag-brand__mark" aria-hidden="true" />
          {BRAND.name}
        </Link>
        <span>{greet?.agentLabel ?? "AI agent · online"}</span>
      </div>
      <AgentFeed messages={messages} animate="type" busy={busy} onChip={onChip} onEmail={onEmail} onSettled={() => setSettled(true)} />
      {composer}
    </div>
  )
}

// Types example websites into the empty field, one letter at a time, so the
// box reads as "type yours here".
const EXAMPLES = ["joesplumbing.com", "brightsmiledental.com", "yourbusiness.com", "austinhvacpros.com"]
function useTypedExamples(on: boolean): string {
  const [text, setText] = useState(EXAMPLES[0])
  useEffect(() => {
    if (!on) return
    let word = 0
    let len = 0
    let deleting = false
    const id = window.setInterval(() => {
      const w = EXAMPLES[word]
      if (!deleting) {
        len = Math.min(len + 1, w.length)
        if (len === w.length) deleting = true
      } else {
        len -= 1
        if (len === 0) {
          deleting = false
          word = (word + 1) % EXAMPLES.length
        }
      }
      setText(EXAMPLES[word].slice(0, Math.max(len, 0)) || " ")
    }, 110)
    return () => window.clearInterval(id)
  }, [on])
  return text
}

// ── turn a ScanResult into agent messages ────────────────────────────────────
function narrate(result: ScanResult, businessName: string, domain: string, hire: string): Message[] {
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

  // 2b. When 3+ named you, the scan also asked two broader buyer questions.
  const asked = isRecord(result.ogData) && Array.isArray((result.ogData as Record<string, unknown>).questions)
    ? ((result.ogData as Record<string, unknown>).questions as ScanQuestion[]).slice(1)
    : []
  if (asked.length > 0) {
    const blocks: Block[] = [{ kind: "text", text: "That question was close to how you describe yourself, so I also asked what most buyers ask first." }]
    let skipped = 0
    let total = 0
    for (const q of asked) {
      const items = ENGINES.map((e) => {
        const ev = isRecord(q.answers) && isEvidence(q.answers[e]) ? q.answers[e] : null
        if (ev) { total += 1; if (!ev.appeared) skipped += 1 }
        return { engine: e, state: (ev ? (ev.appeared ? "found" : "missing") : "unknown") as "found" | "missing" | "unknown" }
      })
      blocks.push({ kind: "text", text: `“${q.query}”` }, { kind: "verdicts", items })
    }
    blocks.push({
      kind: "text",
      text: skipped === 0
        ? "They named you for those too. Strong. The job now is staying there."
        : `They skipped you in ${skipped} of those ${total} answers. That’s where buyers who don’t know your niche go elsewhere, and it’s where I’d start.`,
    })
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

  // 3b. The offer, right where it hurts: one tap, before the detail below. Most visitors
  // never scroll the whole report, so the close can't only live at the very end.
  if (checked > 0 && named < checked) {
    out.push(
      agent([
        { kind: "text", text: rivals.length > 0 ? `I can fix this and get you into those answers. I start this week, and nothing goes live until you approve it.` : "I can fix this. I start this week, and nothing goes live until you approve it." },
        { kind: "cta", chip: { label: "Fix this for me →", action: { type: "link", href: hire }, primary: true } },
        { kind: "text", text: `${localPrice()} a month. ${GUARANTEE} The details are below.` },
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

  // 5. Demand, honestly labelled — the estimate is PEOPLE per month, not money.
  const loss = isRecord(insights?.estimatedMonthlyLoss) ? (insights!.estimatedMonthlyLoss as { low: number; high: number; basis: string }) : null
  if (loss && typeof loss.low === "number" && typeof loss.high === "number" && loss.high > 0 && keyword) {
    // Plain sentence, not a giant number: a small figure shown huge reads as
    // "not worth paying for". Lead with "An estimated", keep the source short.
    const range = `${loss.low.toLocaleString("en-US")}–${loss.high.toLocaleString("en-US")}`
    const tail =
      named === 0
        ? "Right now, every one of them hears a competitor’s name instead of yours."
        : named < checked
          ? `In ${checked - named} of the ${checked} answers I checked, they hear someone else’s name.`
          : "Right now, they hear yours — my job is to keep it that way as competitors catch up."
    out.push(
      agent([
        { kind: "text", text: `An estimated ${range} people a month ask an AI for “${keyword}”. ${tail}` },
        { kind: "text", text: "Estimate: typical monthly searches for that phrase, times the share now asked to AI assistants instead of Google." },
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
        { kind: "text", text: "That’s the biggest finding today. Some AI assistants get the same closed door, so they fall back on what other sites say about you — and that’s where the competitors above win. Fixing it is a one-line change your host or web person can make; I’ll write the exact instruction." },
        { kind: "sources", items: known.map(srcItem) },
        { kind: "text", text: `The other ${you.total - known.length} checks — your business facts, reviews, service pages, how Google treats your pages — need your site to let me in. I’ll run them the moment it does.` },
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
          return { kind: "sources", title: `${GROUP_TITLE[g]}  ·  ${passed} of ${items.length}`, collapseOk: true, items: sorted.map(srcItem) } as Block
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
  aibots: "Get your website host to let ChatGPT, Claude and Perplexity in — I’ll write the exact setting",
  robots: "Change the setting on your site that keeps AI out",
  indexable: "Remove the hidden note telling Google to skip your homepage",
  render: "Make your key facts show up for AI, not just for people — I’ll hand your web person the exact list",
  canonical: "Fix the hidden notes telling Google your pages are copies, so Google shows them",
  https: "Point every version of your address at one secure site",
  bing: "Set you up with Bing — ChatGPT search leans on it",
  llms: "Add a short summary file about your business — the one AI assistants read first",
  sitemap: "Add a list of your pages so Google and AI miss nothing",
  schema: "Add your business facts in the format AI reads, not just as words on the page",
  schemaFacts: "Add your address, phone, hours and map location to your site’s business facts",
  facts: "Put the facts AI needs on your homepage — the ones it couldn’t find",
  local: "Put your city in your page title and main heading so AI knows where you work",
  depth: "Add the words AI needs to quote you — services, prices, areas you cover",
  pages: "Write a page for each service you offer",
  faq: "Publish the FAQ page above with your real answers filled in",
  reviews: "Put your best reviews on your site as text AI can read",
  profiles: "Link your Google, Yelp and social profiles so AI ties them to you",
  about: "Write your About page — who you are, since when, credentials",
  blog: "First fresh page AI can quote, written from your site",
  meta: "Rewrite your page title and Google summary in plain words",
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
