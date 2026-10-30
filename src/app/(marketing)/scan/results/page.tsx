"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ScanLoader } from "@/components/scan/ScanLoader"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { track } from "@/lib/gtag"
import { fbTrack } from "@/lib/pixel"
import type { ScanResult, EngineEvidence, ScanInsights, ScanQuestion } from "@/types/scan"
import type { SiteChecks } from "@/lib/site-check"
import { computeScore, buildFindings, scoreLabel, type Finding, type ReportEngine, type ReportQuestion } from "@/lib/scan-report"
import "./report.css"
import { localPrice } from "@/lib/local-price"
import {
  AlertTriangle, Globe, Sparkles, MessageSquare, Search,
  Check, Mail, ChevronDown, ChevronUp, X, ExternalLink,
  Copy,
} from "lucide-react"

// ── Runtime guards (Json columns — old rows store strings) ─────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function isEvidence(v: unknown): v is EngineEvidence {
  return (
    isRecord(v) &&
    typeof v.response === "string" &&
    typeof v.appeared === "boolean"
  )
}

function readInsights(og: ScanResult["ogData"]): ScanInsights | null {
  if (!og || !isRecord(og)) return null
  const raw = (og as Record<string, unknown>).insights
  if (!isRecord(raw)) return null
  return raw as unknown as ScanInsights
}

type LossInfo = { low: number; high: number; basis: string }

function readLoss(insights: ScanInsights | null): LossInfo | null {
  const raw = insights?.estimatedMonthlyLoss
  if (!isRecord(raw)) return null
  if (typeof raw.low !== "number" || typeof raw.high !== "number") return null
  return {
    low: raw.low,
    high: raw.high,
    basis: typeof raw.basis === "string" ? raw.basis : "",
  }
}

function readCompetitors(insights: ScanInsights | null): string[] {
  if (!insights || !Array.isArray(insights.competitors)) return []
  return insights.competitors
    .filter((c): c is string => typeof c === "string" && c.trim().length > 1)
    .slice(0, 5)
}

// New contract fields (pipeline may not ship them yet — guard everything).

function readKeyword(insights: ScanInsights | null): string | null {
  if (!insights) return null
  const raw = (insights as unknown as Record<string, unknown>).keyword
  return typeof raw === "string" && raw.trim().length > 1 ? raw.trim() : null
}

interface SerpEntry {
  position: number
  domain: string
}

function readSerpCountry(insights: ScanInsights | null): string | null {
  if (!insights) return null
  const raw = (insights as unknown as Record<string, unknown>).serp
  if (!isRecord(raw)) return null
  return typeof raw.countryCode === "string" && raw.countryCode.length === 2 ? raw.countryCode : null
}

function readSerp(insights: ScanInsights | null): SerpEntry[] | null {
  if (!insights) return null
  const raw = (insights as unknown as Record<string, unknown>).serp
  if (!isRecord(raw) || !Array.isArray(raw.results)) return null
  const entries = raw.results
    .filter(isRecord)
    .map((r) => ({
      position:
        typeof r.position === "number" && Number.isFinite(r.position)
          ? Math.round(r.position)
          : 0,
      domain:
        typeof r.domain === "string"
          ? r.domain.trim().toLowerCase().replace(/^www\./, "")
          : "",
    }))
    .filter((r) => r.position >= 1 && r.domain.length > 0)
  return entries.length > 0 ? entries : null
}

interface CompetitorDetail {
  name: string
  domain: string | null
  url: string | null
  aiMentions: number
  googleRank: number | null
}

function readCompetitorDetails(insights: ScanInsights | null): CompetitorDetail[] {
  if (!insights) return []
  const raw = (insights as unknown as Record<string, unknown>).competitorDetails
  if (!Array.isArray(raw)) return []
  const out: CompetitorDetail[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    if (typeof item.name !== "string" || item.name.trim().length < 2) continue
    out.push({
      name: item.name.trim(),
      domain:
        typeof item.domain === "string" && item.domain.trim().length > 0
          ? item.domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
          : null,
      url:
        typeof item.url === "string" && /^https?:\/\//i.test(item.url.trim())
          ? item.url.trim()
          : null,
      aiMentions:
        typeof item.aiMentions === "number" && Number.isFinite(item.aiMentions)
          ? Math.max(0, Math.round(item.aiMentions))
          : 0,
      googleRank:
        typeof item.googleRank === "number" &&
        Number.isFinite(item.googleRank) &&
        item.googleRank >= 1
          ? Math.round(item.googleRank)
          : null,
    })
  }
  return out
    .sort(
      (a, b) =>
        b.aiMentions - a.aiMentions ||
        (a.googleRank ?? 999) - (b.googleRank ?? 999)
    )
    .slice(0, 6)
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/[\s._\-]+/)
    .map((w) => w[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](?=\s|$)/)
  return m ? m[0] : text
}

// AI answers come back as markdown. Rendering them raw put literal "###",
// "**" and "- " on the page, which is the single biggest reason the evidence
// cards read as a wall of text. Strip the syntax, keep the words.
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")           // fenced code
    .replace(/^\s*#{1,6}\s*/gm, "")           // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")         // bold
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1") // italics
    .replace(/^\s*[-*+]\s+/gm, "\u2022 ")     // bullets -> real bullet
    .replace(/^\s*\d+\.\s+/gm, "")           // numbered list markers
    .replace(/\[(\d+)\]/g, "")                // citation refs [1][3]
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")    // links
    .replace(/^\s*>\s?/gm, "")                // blockquotes
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…"
}

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

// Highlights competitor names (orange) and the business's own name (green)
// inside verbatim AI response text.
function highlightNames(
  text: string,
  orangeNames: string[],
  greenName: string
): React.ReactNode {
  const names = [...orangeNames, greenName].filter((n) => n && n.trim().length > 1)
  if (names.length === 0) return text
  let pattern: RegExp
  try {
    pattern = new RegExp(`(${names.map(escapeRegExp).join("|")})`, "gi")
  } catch {
    return text
  }
  const lowerOrange = orangeNames.map((n) => n.toLowerCase())
  const lowerGreen = greenName.toLowerCase()
  return text.split(pattern).map((part, i) => {
    const p = part.toLowerCase()
    if (lowerOrange.includes(p))
      return <span key={i} className="text-brand-orange font-semibold">{part}</span>
    if (p === lowerGreen && lowerGreen.length > 1)
      return <span key={i} className="text-green-400 font-semibold">{part}</span>
    return part
  })
}

// NOTE: the `google_ai` storage key holds CLAUDE's response — a legacy naming
// choice kept so existing ScanLead/Audit rows still resolve. It must be LABELLED
// Claude: showing Anthropic's output under Google's name misattributes one
// vendor's model to another, and contradicts the four engines named everywhere
// else on the site. Change the label here, not the stored key.
const ENGINES = [
  { key: "chatgpt",    responseKey: "chatgpt",    name: "ChatGPT",    Icon: MessageSquare, iconColor: "#22C55E" },
  { key: "google_ai",  responseKey: "claude",     name: "Claude",     Icon: Globe,         iconColor: "#d97757" },
  { key: "perplexity", responseKey: "perplexity", name: "Perplexity", Icon: Search,        iconColor: "#38BDF8" },
  { key: "gemini",     responseKey: "gemini",     name: "Gemini",     Icon: Sparkles,      iconColor: "#f59e0b" },
] as const

// Business owners may not know what Perplexity or Gemini are — a one-line
// credibility tag under each engine name explains why missing from it matters.
const ENGINE_SUBS: Record<string, string> = {
  "ChatGPT":    "the world's most-used AI assistant",
  "Claude":     "Anthropic's AI assistant",
  "Perplexity": "the leading AI search engine",
  "Gemini":     "Google's AI assistant",
}

interface EngineRow {
  key: string
  name: string
  Icon: typeof MessageSquare
  iconColor: string
  appeared: boolean
  evidence: EngineEvidence | null // new-shape rows only
  legacyText: string | null       // old-shape rows only
}

// ── Competitor bar chart (v1 fallback — inline SVG, no libraries) ───────────

function CompetitorChart({
  rows,
  totalEngines,
}: {
  rows: { name: string; count: number; isYou: boolean }[]
  totalEngines: number
}) {
  const rowH = 46
  const chartW = 560
  const labelW = 150
  const valueW = 64
  const barMax = chartW - labelW - valueW
  const maxCount = Math.max(1, ...rows.map((r) => r.count))
  const height = rows.length * rowH

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW} ${height}`}
        width="100%"
        style={{ minWidth: 440 }}
        role="img"
        aria-label="AI mentions per business across the engines we checked"
      >
        {rows.map((r, i) => {
          const y = i * rowH
          const w = Math.max(r.count === 0 ? 4 : 10, (r.count / maxCount) * barMax)
          const barColor = r.isYou ? "rgb(var(--fg-rgb) / 0.22)" : "rgb(var(--orange-rgb))"
          const label = r.name.length > 20 ? r.name.slice(0, 19) + "…" : r.name
          return (
            <g key={`${r.name}-${i}`}>
              <text
                x={labelW - 10} y={y + rowH / 2 + 1}
                textAnchor="end" dominantBaseline="middle"
                fill={r.isYou ? "rgb(var(--fg-rgb) / 0.55)" : "rgb(var(--fg-rgb))"}
                fontSize="12" fontWeight={r.isYou ? 400 : 600}
              >
                {label}{r.isYou ? " (you)" : ""}
              </text>
              <rect
                x={labelW} y={y + rowH / 2 - 8}
                width={w} height={16} rx={5}
                fill={barColor}
                opacity={r.isYou ? 1 : 0.9}
              />
              <text
                x={labelW + w + 8} y={y + rowH / 2 + 1}
                dominantBaseline="middle"
                fill={r.isYou ? "rgb(var(--fg-rgb) / 0.45)" : "rgb(var(--orange-light-rgb))"}
                fontSize="12" fontWeight="600"
              >
                {r.count} of {totalEngines}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Report building blocks (design: rp-* classes in report.css) ─────────────

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

function ScoreDial({ score }: { score: number }) {
  const size = 132
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const label = scoreLabel(score)
  return (
    <div className="rp-dial" style={{ width: size }}>
      <div className="rp-dial__ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#e8e8ed" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={label.color} strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c - (Math.min(100, Math.max(0, score)) / 100) * c}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="rp-dial__num">
          <b>{score}</b>
          <span>/100</span>
        </div>
      </div>
      <p className="rp-dial__label" style={{ color: label.color }}>{label.text}</p>
      <p className="rp-dial__cap">AI score</p>
    </div>
  )
}

function HireButton({ placement, small, label }: { placement: string; small?: boolean; label: string }) {
  return (
    <Link
      href="/signup"
      onClick={() => track("results_cta_click", { placement })}
      className={small ? "rp-hire rp-hire--small" : "rp-hire"}
    >
      {label}
    </Link>
  )
}

function EngineCard({ engine, businessName }: { engine: EngineRow; businessName: string }) {
  const [expanded, setExpanded] = useState(false)
  const fullText = engine.evidence?.response ?? engine.legacyText ?? ""
  const mentioned = engine.evidence
    ? engine.evidence.mentioned.filter((m): m is string => typeof m === "string")
    : []
  const query = engine.evidence?.query?.trim() || null
  const clean = stripMarkdown(fullText)
  const isLong = clean.length > 220
  const shown = expanded ? clean : truncateAtWord(clean, 220)
  return (
    <div className="rp-card rp-engine">
      <div className="rp-engine__head">
        <div className="rp-engine__name">
          <span className="rp-engine__icon"><engine.Icon className="w-4 h-4" style={{ color: engine.iconColor }} /></span>
          <div>
            <b>{engine.name}</b>
            {ENGINE_SUBS[engine.name] && <small>{ENGINE_SUBS[engine.name]}</small>}
          </div>
        </div>
        {engine.appeared ? (
          <span className="rp-status rp-status--ok"><Check className="w-3.5 h-3.5" /> Named you</span>
        ) : (
          <span className="rp-status rp-status--no">Didn&rsquo;t name you</span>
        )}
      </div>
      {query && (
        <div className="rp-query"><span>A customer asks</span>&ldquo;{query}&rdquo;</div>
      )}
      {fullText ? (
        <>
          <div className="rp-answer">{highlightNames(shown, mentioned, businessName)}</div>
          {isLong && (
            <button type="button" className="rp-link" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <>Show less <ChevronUp className="w-3.5 h-3.5" /></> : <>Show full answer <ChevronDown className="w-3.5 h-3.5" /></>}
            </button>
          )}
        </>
      ) : (
        <p className="rp-muted">{engine.name} didn&rsquo;t return a usable answer during this check.</p>
      )}
    </div>
  )
}

function RivalTable({
  competitors,
  you,
  totalEngines,
  keyword,
  serpCount,
  serpCountry,
}: {
  competitors: CompetitorDetail[]
  you: { name: string; aiMentions: number; googleRank: number | null }
  totalEngines: number
  keyword: string | null
  serpCount: number | null
  serpCountry: string | null
}) {
  const google = serpCountry && serpCountry !== "us" ? `google.${serpCountry}` : "Google"
  const rows = [
    { name: you.name, isYou: true, aiMentions: you.aiMentions, googleRank: you.googleRank, href: null as string | null, label: null as string | null },
    ...[...competitors]
      .sort((a, b) => b.aiMentions - a.aiMentions || (a.googleRank ?? 99) - (b.googleRank ?? 99))
      .map((c) => ({
        name: c.name,
        isYou: false,
        aiMentions: c.aiMentions,
        googleRank: c.googleRank,
        href: c.url ?? (c.domain ? `https://${c.domain}` : null),
        label: c.domain ?? (c.url ? hostFromUrl(c.url) : null),
      })),
  ]
  return (
    <div className="rp-card rp-table">
      <div className="rp-table__row rp-table__head">
        <span>Business</span><span>Named by AI</span><span>Google</span>
      </div>
      {rows.map((r, i) => (
        <div key={`${r.name}-${i}`} className={`rp-table__row ${r.isYou ? "rp-table__you" : ""}`}>
          <div className="rp-table__biz">
            <b>{r.name}</b>
            {r.isYou && <em>You</em>}
            {r.href && r.label && (
              <a href={r.href} target="_blank" rel="noopener noreferrer nofollow">{r.label} <ExternalLink className="w-3 h-3" /></a>
            )}
          </div>
          <div>
            <span className="rp-table__count">{r.aiMentions} of {totalEngines}</span>
            <div className="rp-bar"><i style={{ width: `${(r.aiMentions / totalEngines) * 100}%`, background: r.isYou ? "#34c759" : "#0071e3" }} /></div>
          </div>
          <div className="rp-table__rank">
            {r.googleRank !== null ? (
              <>#{r.googleRank} on {google}</>
            ) : r.isYou && serpCount !== null ? (
              <span className="rp-red">Not in the top {serpCount}</span>
            ) : (
              <span className="rp-faint">—</span>
            )}
          </div>
        </div>
      ))}
      <p className="rp-table__note">
        AI results from this live check.
        {serpCount !== null && keyword ? <> Google positions from a live search for &ldquo;{keyword}&rdquo;; your own results may differ.</> : null}
      </p>
    </div>
  )
}

function FindingsBlock({ findings }: { findings: Finding[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? findings : findings.slice(0, 3)
  return (
    <div>
      {shown.map((f, i) => (
        <div key={i} className="rp-card rp-finding">
          <div className="rp-finding__head">
            <span className={`rp-warn rp-warn--${f.severity}`}>!</span>
            <div>
              <b>{f.title}</b>
              <p>{f.why}</p>
            </div>
          </div>
          <div className="rp-plan">
            <span className="rp-plan__a">a</span>
            <div><strong>My plan</strong>{f.plan}</div>
          </div>
        </div>
      ))}
      {findings.length > 3 && (
        <button type="button" className="rp-more" onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer" : `Show all ${findings.length}`}
        </button>
      )}
    </div>
  )
}

const STEPS = [
  { when: "Week 1", title: "I fix what this check found", body: "I start with the problems above and draft each fix. Nothing goes live until you tap approve." },
  { when: "Weeks 2–3", title: "I build what AI reads", body: "Fresh posts on your Google listing and pages that answer the questions your customers ask." },
  { when: "Every week", title: "I ask all four AIs again", body: "Then I send you a short briefing: what changed, what I did, and what needs your yes." },
]

function Timeline() {
  return (
    <div className="rp-card rp-timeline">
      {STEPS.map((s) => (
        <div key={s.when} className="rp-step">
          <span className="rp-step__dot" />
          <small>{s.when}</small>
          <b>{s.title}</b>
          <p>{s.body}</p>
        </div>
      ))}
      <p className="rp-timeline__note">
        If no AI names you within 90 days, your next month is free. No one can promise exactly what an AI will say, so I show you every week.
      </p>
    </div>
  )
}

const KIND_LABEL: Record<string, string> = { specific: "Your niche", broad: "Broader", problem: "The buyer’s problem" }

function QuestionGrid({ questions }: { questions: ScanQuestion[] }) {
  return (
    <div className="rp-card rp-grid">
      <div className="rp-grid__row rp-grid__head">
        <span>Question</span>
        {ENGINES.map((e) => <span key={e.key}>{e.name}</span>)}
      </div>
      {questions.map((q, i) => {
        const instead: string[] = []
        for (const e of ENGINES) {
          const a = q.answers[e.responseKey]
          if (isEvidence(a) && !a.appeared) for (const m of a.mentioned ?? []) {
            if (typeof m === "string" && !instead.some((x) => x.toLowerCase() === m.toLowerCase())) instead.push(m)
          }
        }
        return (
          <div key={i} className="rp-grid__row">
            <div className="rp-grid__q">
              <small>{KIND_LABEL[q.kind] ?? "Question"}</small>
              &ldquo;{q.query}&rdquo;
              {instead.length > 0 && <em>Named instead: {listNames(instead.slice(0, 3))}</em>}
            </div>
            {ENGINES.map((e) => {
              const a = q.answers[e.responseKey]
              const state = !isEvidence(a) || a.response.trim().length <= 20 ? "na" : a.appeared ? "yes" : "no"
              return (
                <span key={e.key} className={`rp-grid__cell rp-grid__cell--${state}`} data-engine={e.name}>
                  {state === "yes" ? <Check className="w-4 h-4" /> : state === "no" ? <X className="w-4 h-4" /> : "–"}
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Email-report button ─────────────────────────────────────────────────────

function EmailReportButton({ scanId }: { scanId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const send = useCallback(async () => {
    if (state === "sending" || state === "sent") return
    setState("sending")
    track("results_email_report_click")
    try {
      const res = await fetch("/api/scan/email-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      })
      if (!res.ok) throw new Error("send failed")
      setState("sent")
    } catch {
      setState("error")
    }
  }, [scanId, state])

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={send}
        disabled={state === "sending" || state === "sent"}
        className="inline-flex items-center gap-2 text-sm font-medium text-fg/60 hover:text-fg bg-fg/[0.03] hover:bg-fg/[0.06] border border-line/[0.08] rounded-full px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-default"
      >
        {state === "sent" ? (
          <><Check className="w-4 h-4 text-green-400" /> Report sent to your inbox</>
        ) : state === "sending" ? (
          <><Mail className="w-4 h-4 animate-pulse" /> Sending…</>
        ) : (
          <><Mail className="w-4 h-4" /> Email me this report</>
        )}
      </button>
      {state === "error" && (
        <p className="text-red-400/80 text-xs mt-2 m-0">
          Couldn&apos;t send right now — try again in a minute.
        </p>
      )}
    </div>
  )
}


interface QuickFix {
  faqHtml: string
  jsonLd: string
  targetQuestion: string
}

function CopyBlock({
  label,
  code,
  kind,
}: {
  label: string
  code: string
  kind: string
}) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      return // clipboard blocked — the code is selectable in the block below
    }
    setCopied(true)
    track("quickfix_copied", { kind })
    setTimeout(() => setCopied(false), 2000)
  }, [code, kind])

  return (
    <div className="bg-bg-secondary border border-line/[0.08] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-line/[0.06] bg-fg/[0.02]">
        <span className="text-[11px] font-semibold tracking-[-0.01em] text-fg/40 truncate">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 flex-shrink-0 text-[11px] font-semibold text-fg/60 hover:text-fg bg-fg/[0.04] hover:bg-fg/[0.08] border border-line/[0.1] rounded-lg px-2.5 py-1.5 transition-colors"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-green-400" /> Copied</>
          ) : (
            <><Copy className="w-3 h-3" /> Copy</>
          )}
        </button>
      </div>
      {/* Collapsed by default. Expanded, the two blocks were ~1,060 words —
          59% of the whole page — of raw markup shown to a reader who is
          usually a dentist, not a developer. Copy works without opening it.
          No max-height when open: a vertical clamp makes the <pre> a nested
          scroll container (overflow-x:auto forces overflow-y:auto too), which
          swallows wheel events and traps visitors mid-page. */}
      {open ? (
        <pre className="m-0 px-4 py-3.5 overflow-x-auto text-[11.5px] leading-relaxed text-fg/70 mono">
          <code>{code}</code>
        </pre>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left px-4 py-3.5 text-[12px] text-fg/45 hover:text-fg/70 transition-colors"
        >
          {code.split("\n").length} lines &middot; Show the code
        </button>
      )}
    </div>
  )
}

function htmlToText(html: string): string {
  return html
    .replace(/<\/(h[1-6]|p|li|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function QuickFixSection({ scanId, businessName }: { scanId: string; businessName: string }) {
  const [fix, setFix] = useState<QuickFix | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/scan/quick-fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId }),
        })
        if (!res.ok) throw new Error("generate failed")
        const data = await res.json()
        if (typeof data?.faqHtml !== "string" || typeof data?.jsonLd !== "string" || !data.faqHtml.trim() || !data.jsonLd.trim()) {
          throw new Error("bad shape")
        }
        if (cancelled) return
        setFix({ faqHtml: data.faqHtml, jsonLd: data.jsonLd, targetQuestion: typeof data.targetQuestion === "string" ? data.targetQuestion : "" })
        track("quickfix_generated")
        fbTrack("ViewContent", { content_name: "quick_fix" })
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => { cancelled = true }
  }, [scanId])

  if (failed) return null

  if (!fix) {
    return (
      <div>
        <h2 className="rp-h2">A fix you can use today</h2>
        <div className="rp-card rp-center">
          <Sparkles className="w-5 h-5 mx-auto mb-3 animate-pulse" style={{ color: "#0071e3" }} />
          <p className="rp-muted">I&rsquo;m writing an answer for your website that AI can quote…</p>
        </div>
      </div>
    )
  }

  const text = htmlToText(fix.faqHtml)
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      track("quickfix_copied", { kind: "text" })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked; the text is selectable
    }
  }
  const mailBody = [
    `Hi,`,
    ``,
    `Can you add this to our website (${businessName})? It answers a question customers ask AI assistants like ChatGPT, so they can quote us.`,
    ``,
    `1) Add this block to the page, ideally the homepage or FAQ page:`,
    ``,
    fix.faqHtml,
    ``,
    `2) Add this inside the page's <head>:`,
    ``,
    fix.jsonLd,
    ``,
    `Anything in [square brackets] needs our real details.`,
    ``,
    `Thanks!`,
  ].join("\n")
  const mailto = `mailto:?subject=${encodeURIComponent("Please add this to our website")}&body=${encodeURIComponent(mailBody)}`

  return (
    <div>
      <h2 className="rp-h2">A fix you can use today, free</h2>
      <p className="rp-lead">No signup, no card. It&rsquo;s yours to keep whether or not you hire me.</p>
      <div className="rp-card rp-fix">
        {fix.targetQuestion && (
          <div className="rp-query"><span>The customer question this answers</span>&ldquo;{fix.targetQuestion}&rdquo;</div>
        )}
        <div className="rp-fix__text">{text}</div>
        <p className="rp-fix__note">Fill in anything in [square brackets] with your real details. I left those blank so I don&rsquo;t make anything up about you.</p>
        <div className="rp-fix__actions">
          <a className="rp-btn rp-btn--blue" href={mailto} onClick={() => track("quickfix_copied", { kind: "email_web_person" })}>
            <Mail className="w-4 h-4" /> Email it to my web person
          </a>
          <button type="button" className="rp-btn" onClick={copyText}>
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy the answer</>}
          </button>
          <button type="button" className="rp-link" onClick={() => setShowCode((v) => !v)}>
            {showCode ? "Hide the code" : "I’ll add it myself: show the code"}
          </button>
        </div>
        {showCode && (
          <div className="rp-fix__code">
            <CopyBlock label="1. Add this to the page" code={fix.faqHtml} kind="faq_html" />
            <CopyBlock label="2. Add this inside <head> (the background code AI reads)" code={fix.jsonLd} kind="json_ld" />
          </div>
        )}
      </div>
    </div>
  )
}


// ── Main component ───────────────────────────────────────────────────────────

function ScanResultsContent() {
  const params  = useSearchParams()
  const scanId  = params.get("id")
  const token   = params.get("t")
  const [result, setResult]   = useState<ScanResult | null>(null)
  const [gated, setGated]     = useState(false)
  const [gateInfo, setGateInfo] = useState<{ businessName: string; maskedEmail: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const completedFired = useRef(false)

  useEffect(() => {
    if (!scanId) { setError(true); setLoading(false); return }
    let cancelled = false
    let attempts = 0
    const poll = async () => {
      if (cancelled) return
      try {
        const res  = await fetch(`/api/scan/result?id=${scanId}${token ? `&t=${encodeURIComponent(token)}` : ""}`)
        if (res.ok) {
          const data = await res.json()
          if (data.ready) {
            if (!cancelled) {
              if (data.gated) { setGated(true); setGateInfo(data.result) }
              else setResult(data.result)
              setLoading(false)
            }
            return
          }
        }
        attempts++
        if (attempts < 80) setTimeout(poll, 2000)
        else if (!cancelled) { setError(true); setLoading(false) }
      } catch {
        attempts++
        if (attempts < 80) setTimeout(poll, 2000)
        else if (!cancelled) { setError(true); setLoading(false) }
      }
    }
    poll()
    return () => { cancelled = true }
  }, [scanId, retryKey])

  // Primary ad-conversion event — fire exactly once per scan.
  useEffect(() => {
    if (!result || completedFired.current) return
    completedFired.current = true
    const key = `ga4-scan-completed-${scanId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      // storage unavailable — fire anyway
    }
    track("scan_completed", { score: result.visibilityScore })
    // Report viewed — the qualified-intent signal for Meta retargeting.
    fbTrack("ViewContent", { content_name: "scan_results", value: result.visibilityScore })
  }, [result, scanId])

  const retry = useCallback(() => {
    setError(false)
    setLoading(true)
    setRetryKey((k) => k + 1)
  }, [])

  if (loading) return <ScanLoader />

  // Gate: the report only opens from the emailed link, so a bot or a throwaway
  // address never reaches the score or the AI answers.
  if (gated) {
    return (
      <div className="pt-28 pb-24 px-4">
        <div className="max-w-[520px] mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center mx-auto mb-7">
            <Mail className="w-6 h-6 text-brand-orange" />
          </div>
          <h1 className="text-fg text-[35.2px] sm:text-[44px] font-bold leading-[1.15] tracking-[-0.02em] mb-4">
            Check your email.
          </h1>
          <p className="text-muted text-[17px] leading-relaxed mb-8">
            {gateInfo?.businessName ? <>Your report for <span className="text-fg font-medium">{gateInfo.businessName}</span> is ready. </> : "Your report is ready. "}
            We sent the link to {gateInfo?.maskedEmail ? <span className="text-fg font-medium">{gateInfo.maskedEmail}</span> : "your inbox"}.
          </p>
          <p className="text-muted-soft text-[14px] leading-relaxed">
            Opening it from the email confirms the address is yours — that&rsquo;s
            the only reason we ask.
          </p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="pt-24 pb-20 px-4 text-center max-w-md mx-auto">
        <AlertTriangle className="w-8 h-8 text-brand-orange mx-auto mb-4" />
        <p className="text-fg text-lg font-medium mb-2">
          Your scan is taking longer than usual.
        </p>
        <p className="text-muted text-sm mb-6">
          {scanId
            ? "AI engines can be slow at peak times — your results may still be on the way. Check again, or start a fresh scan."
            : "We couldn't find that scan. Start a fresh one — it only takes 2 minutes."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {scanId && (
            <OrangePillButton onClick={retry}>Check again →</OrangePillButton>
          )}
          <OrangePillButton href="/scan" variant={scanId ? "ghost" : "primary"}>
            Run a new scan
          </OrangePillButton>
        </div>
      </div>
    )
  }

  // ── Derived data (guarded — everything below comes from Json columns) ───
  const aiStatus: Record<string, string> = isRecord(result.aiSearchStatus)
    ? (result.aiSearchStatus as Record<string, string>)
    : {}
  const engineResponses = isRecord(result.engineResponses) ? result.engineResponses : {}
  const businessName = result.businessName || result.businessUrl
  const initials     = getInitials(businessName)
  const issues       = Array.isArray(result.issues) ? result.issues : []
  const insights     = readInsights(result.ogData)
  const loss         = readLoss(insights)
  const competitors  = readCompetitors(insights)
  const keyword      = readKeyword(insights)
  const serpResults  = readSerp(insights)
  const competitorDetails = readCompetitorDetails(insights)
  const industry     =
    insights && typeof insights.industry === "string" && insights.industry.trim()
      ? insights.industry.trim()
      : null
  const isLocal      = insights?.isLocal !== false

  const engineData: EngineRow[] = ENGINES.map((e) => {
    const raw = engineResponses[e.responseKey]
    const evidence   = isEvidence(raw) ? raw : null
    const legacyText = typeof raw === "string" ? raw : null
    const statusSaysFound =
      aiStatus[e.key] === "occasionally" || aiStatus[e.key] === "frequently"
    return {
      key: e.key,
      name: e.name,
      Icon: e.Icon,
      iconColor: e.iconColor,
      appeared: evidence ? evidence.appeared : statusSaysFound,
      evidence,
      legacyText,
    }
  })

  const totalEngines = engineData.length
  const aiMentions   = engineData.filter((e) => e.appeared).length
  // Name the engines. "No AI assistant named you" means nothing to a business
  // owner — "ChatGPT, Claude and Gemini didn't find you" is the same fact in
  // words they already know.
  const missedNames  = engineData.filter((e) => !e.appeared).map((e) => e.name)
  const foundNames   = engineData.filter((e) => e.appeared).map((e) => e.name)

  // The scanned business's own Google position, from live SERP data if present.
  const ownDomain =
    result.ogData && typeof result.ogData.domain === "string" && result.ogData.domain.trim()
      ? result.ogData.domain.trim().toLowerCase().replace(/^www\./, "")
      : null
  const youGoogleRank =
    ownDomain && serpResults
      ? serpResults.find((r) => r.domain === ownDomain)?.position ?? null
      : null

  // v1 fallback: competitor mention counts — computable only on new-shape rows.
  const hasIntelTable = competitorDetails.length > 0
  const hasEvidence = engineData.some((e) => e.evidence !== null)
  const competitorRows = !hasIntelTable && hasEvidence
    ? competitors
        .map((name) => ({
          name,
          isYou: false,
          count: engineData.filter((e) => {
            if (!e.evidence || !Array.isArray(e.evidence.mentioned)) return false
            const n = name.toLowerCase()
            return e.evidence.mentioned.some(
              (m) => typeof m === "string" && (m.toLowerCase().includes(n) || n.includes(m.toLowerCase()))
            )
          }).length,
        }))
        .sort((a, b) => b.count - a.count)
    : []
  const showChartFallback = competitorRows.some((r) => r.count > 0)
  const chartRows = showChartFallback
    ? [...competitorRows, { name: businessName, isYou: true, count: aiMentions }]
    : []

  const searchesLabel = industry ?? "businesses like yours"

  // Score and findings from this scan's measurements (same code /api/scan
  // stores), so older reports also stop contradicting their own evidence.
  const siteChecks =
    isRecord(result.ogData) && isRecord((result.ogData as Record<string, unknown>).siteChecks)
      ? ((result.ogData as Record<string, unknown>).siteChecks as unknown as SiteChecks)
      : null
  const reportEngines: ReportEngine[] = engineData.map((e) => ({
    name: e.name,
    appeared: e.appeared,
    mentioned: e.evidence ? e.evidence.mentioned.filter((m): m is string => typeof m === "string") : [],
    answered: !!(e.evidence && e.evidence.response.trim().length > 20),
  }))
  // Broader buyer questions (asked only when 3+ AIs named you for the first).
  const askedQuestions: ScanQuestion[] =
    isRecord(result.ogData) && Array.isArray((result.ogData as Record<string, unknown>).questions)
      ? ((result.ogData as Record<string, unknown>).questions as ScanQuestion[]).filter((q) => q && typeof q.query === "string" && isRecord(q.answers))
      : []
  const extraQuestions: ReportQuestion[] = askedQuestions.slice(1).map((q) => ({
    kind: q.kind,
    query: q.query,
    engines: ENGINES.flatMap((e) => {
      const a = q.answers[e.responseKey]
      return isEvidence(a)
        ? [{ name: e.name, appeared: a.appeared, mentioned: (a.mentioned ?? []).filter((m): m is string => typeof m === "string"), answered: a.response.trim().length > 20 }]
        : []
    }),
  }))
  const allAnswers = [...reportEngines, ...extraQuestions.flatMap((q) => q.engines)].filter((e) => e.answered)
  const namedAll = allAnswers.filter((e) => e.appeared).length
  const broadSkips = extraQuestions.flatMap((q) => q.engines.filter((e) => e.answered && !e.appeared))
  const broadRivals: string[] = []
  for (const e of broadSkips) for (const m of e.mentioned) {
    if (!broadRivals.some((r) => r.toLowerCase() === m.toLowerCase()) && !m.toLowerCase().includes(businessName.toLowerCase())) broadRivals.push(m)
  }

  const measured = reportEngines.some((e) => e.answered)
  const score = (measured ? computeScore(reportEngines, siteChecks, extraQuestions) : null) ?? result.visibilityScore
  const findings: Finding[] = measured
    ? buildFindings(businessName, reportEngines, siteChecks, extraQuestions)
    : issues.map((i) => ({
        severity: i.severity === "critical" ? "critical" : i.severity === "warning" ? "warning" : "improvement",
        title: i.headline,
        why: firstSentence(i.explanation),
        plan: i.fix_summary,
      }))

  // Who got named instead, for the headline.
  const rivalNames = competitorDetails.filter((c) => c.aiMentions > 0).sort((a, b) => b.aiMentions - a.aiMentions).map((c) => c.name)
  const topRival = rivalNames[0] ?? competitorRows.find((r) => r.count > 0)?.name ?? null
  const headline =
    broadSkips.length > 0 ? (
      <>AI names you in {namedAll} of {allAnswers.length} answers. <span className="rp-red">It skips you when buyers ask more broadly.</span></>
    ) : extraQuestions.length > 0 && aiMentions === totalEngines ? (
      <>All four AIs name you, <span className="rp-green">even for broader questions.</span></>
    ) : aiMentions === totalEngines ? (
      <>{totalEngines === 4 ? "All four AIs" : listNames(foundNames)} <span className="rp-green">name you today.</span></>
    ) : aiMentions === 0 ? (
      topRival ? <>AI recommended <span className="rp-red">{topRival}</span> instead of you.</> : <>None of the four AIs <span className="rp-red">named you.</span></>
    ) : (
      <>{listNames(missedNames)} <span className="rp-red">{topRival ? `recommended ${topRival} instead.` : "didn’t name you."}</span></>
    )
  const subline =
    broadSkips.length > 0
      ? `${aiMentions === totalEngines ? "All four" : aiMentions} named you for your niche question. For the questions most buyers start with${broadRivals.length ? `, they recommended ${listNames(broadRivals.slice(0, 2))} instead` : ", you weren’t in the answer"}.`
      : aiMentions === totalEngines
      ? rivalNames.length
        ? `They also named ${listNames(rivalNames.slice(0, 2))}. Here’s how I keep you first.`
        : "Here’s how I keep it that way as competitors catch on."
      : aiMentions === 0
        ? "When customers asked, you weren’t in the answer. Here’s why, and what I’ll do about it."
        : `${listNames(foundNames)} named you. Here’s why the others didn’t, and what I’ll do about it.`
  // The button names the outcome for this business, not the product.
  const ctaLabel =
    broadSkips.length > 0
      ? "Get recommended for every buyer question →"
      : aiMentions === totalEngines
      ? "Keep all four AIs recommending me →"
      : aiMentions === 0
        ? "Get AI to recommend me →"
        : `Get ${listNames(missedNames)} to recommend me →`
  const ctaShort = aiMentions === totalEngines && broadSkips.length === 0 ? "Keep my spot →" : "Get recommended →"
  const stickyLine =
    broadSkips.length > 0
      ? `AI skips you in ${allAnswers.length - namedAll} of ${allAnswers.length} answers. I can fix that.`
      : aiMentions === totalEngines ? "AI names you today. I’ll keep it that way." : `${missedNames.length} of ${totalEngines} AIs skip you. I can fix that.`

  return (
    <div className="rp">
      <div className="rp-top">
        <span className="rp-top__biz">
          {result.ogData?.favicon ? (
            <img src={result.ogData.favicon} alt="" onError={(e) => { e.currentTarget.style.display = "none" }} />
          ) : (
            <i>{initials}</i>
          )}
          {businessName}
        </span>
        <span className="rp-top__url">{result.ogData?.domain ?? result.businessUrl}</span>
      </div>

      <div className="rp-wrap">
        {/* 1. The answer, in one line */}
        <div className="rp-card rp-hero">
          <div className="rp-hero__text">
            <p className="rp-eyebrow">What AI says about {businessName}</p>
            <h1>{headline}</h1>
            <p className="rp-hero__sub">{subline}</p>
            {loss && (
              <div className="rp-badge">
                ✦ An estimated {loss.low.toLocaleString("en-US")}–{loss.high.toLocaleString("en-US")} buyers asked AI for{" "}
                {keyword ? <>&ldquo;{keyword}&rdquo;</> : <>{searchesLabel} {isLocal ? "near" : "in"} {result.city}</>} in the last 30 days.
              </div>
            )}
            {loss?.basis && <p className="rp-fine">Estimate: {loss.basis}</p>}
          </div>
          <ScoreDial score={score} />
        </div>
        <div className="rp-hero__cta">
          <HireButton placement="top" label={ctaLabel} />
          <p className="rp-fine">{localPrice()}/mo · month to month · cancel in two clicks · payments secured by Stripe</p>
        </div>

        {/* 2. The evidence */}
        {askedQuestions.length > 1 && (
          <>
            <h2 className="rp-h2">The questions I asked</h2>
            <p className="rp-lead">All four AIs named you for the first one, so I also asked the broader questions most buyers start with.</p>
            <QuestionGrid questions={askedQuestions} />
          </>
        )}

        <h2 className="rp-h2">{askedQuestions.length > 1 ? "What AI said to the first question" : "What AI actually said today"}</h2>
        <p className="rp-lead">The real answers from {totalEngines} AI assistants, word for word.</p>
        {engineData.map((engine) => (
          <EngineCard key={engine.key} engine={engine} businessName={businessName} />
        ))}

        {/* 3. Who else gets named */}
        {hasIntelTable ? (
          <>
            <h2 className="rp-h2">Who AI recommends{aiMentions === totalEngines ? " alongside you" : " instead"}</h2>
            <RivalTable
              competitors={competitorDetails}
              you={{ name: businessName, aiMentions, googleRank: youGoogleRank }}
              totalEngines={totalEngines}
              keyword={keyword}
              serpCount={serpResults ? serpResults.length : null}
              serpCountry={readSerpCountry(insights)}
            />
          </>
        ) : showChartFallback ? (
          <>
            <h2 className="rp-h2">Who AI recommends instead</h2>
            <div className="rp-card">
              <CompetitorChart rows={chartRows} totalEngines={totalEngines} />
            </div>
          </>
        ) : null}

        {/* 4. Why, and my plan for each */}
        {findings.length > 0 && (
          <>
            <h2 className="rp-h2">Why this is happening</h2>
            <p className="rp-lead">
              {findings.filter((f) => f.severity === "critical").length > 0
                ? `${findings.filter((f) => f.severity === "critical").length} need fixing first. Each one comes with what I’ll do about it.`
                : "Nothing urgent. Each item comes with what I’ll do about it."}
            </p>
            <FindingsBlock findings={findings} />
          </>
        )}

        <h2 className="rp-h2">How I fix it for you</h2>
        <Timeline />

        {/* 5. The ask */}
        <div className="rp-card rp-ask">
          <h2>I can start on this today.</h2>
          <p>{localPrice()} a month instead of an agency retainer. I do the work, you tap approve.</p>
          <HireButton placement="bottom" label={ctaLabel} />
          <p className="rp-fine">{localPrice()}/mo · month to month · cancel in two clicks · payments secured by Stripe</p>
          <div className="rp-ask__email"><EmailReportButton scanId={result.scanId} /></div>
        </div>

        {/* 6. A free fix, after the ask */}
        <QuickFixSection scanId={result.scanId} businessName={businessName} />
      </div>

      <HireBar line={stickyLine} ctaShort={ctaShort} />
    </div>
  )
}

function HireBar({ line, ctaShort }: { line: string; ctaShort: string }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  if (dismissed) return null
  return (
    <div className={`rp-bar-fixed ${visible ? "is-on" : ""}`}>
      <div className="rp-bar-fixed__in">
        <p><b>{line}</b><span>{localPrice()}/mo · month to month</span></p>
        <HireButton placement="sticky_bar" small label={ctaShort} />
        <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="rp-bar-fixed__x"><X className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

export default function ScanResultsPage() {
  return (
    <Suspense fallback={<ScanLoader />}>
      <ScanResultsContent />
    </Suspense>
  )
}
