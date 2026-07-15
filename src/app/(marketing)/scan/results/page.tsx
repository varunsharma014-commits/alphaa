"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ScanLoader } from "@/components/scan/ScanLoader"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { track } from "@/lib/gtag"
import type { ScanResult, EngineEvidence, ScanInsights } from "@/types/scan"
import {
  MapPin, AlertTriangle, Globe, Sparkles, MessageSquare, Search,
  Check, Mail, Wand2, ChevronDown, ChevronUp, Bot,
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

function readLoss(insights: ScanInsights | null) {
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

function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…"
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

function scoreColor(score: number): string {
  if (score >= 75) return "#22C55E"
  if (score >= 50) return "#FF6B1A"
  return "#EF4444"
}

// Plain-English verdict — the number alone doesn't sell the gap.
function buildVerdict(aiMentions: number, total: number, businessName: string): string {
  if (aiMentions === 0)
    return `When customers ask AI who to call, ${businessName} never comes up. They're being sent to your competitors instead.`
  if (aiMentions < total)
    return `${aiMentions} of ${total} AI assistants mention ${businessName}. The other ${total - aiMentions} are still sending customers elsewhere.`
  return `AI assistants know ${businessName} today — the work now is staying in the answer as competitors catch on.`
}

const ENGINES = [
  { key: "chatgpt",    responseKey: "chatgpt",    name: "ChatGPT",    Icon: MessageSquare, iconColor: "#22C55E" },
  { key: "google_ai",  responseKey: "claude",     name: "Google AI",  Icon: Globe,         iconColor: "#EF4444" },
  { key: "perplexity", responseKey: "perplexity", name: "Perplexity", Icon: Search,        iconColor: "#38BDF8" },
  { key: "gemini",     responseKey: "gemini",     name: "Gemini",     Icon: Sparkles,      iconColor: "#f59e0b" },
] as const

interface EngineRow {
  key: string
  name: string
  Icon: typeof MessageSquare
  iconColor: string
  appeared: boolean
  evidence: EngineEvidence | null // new-shape rows only
  legacyText: string | null       // old-shape rows only
}

// ── Score gauge (adapted from ScoreRing — bigger, with glow) ────────────────

function ScoreGaugeBig({ score }: { score: number }) {
  const size = 168
  const strokeWidth = 11
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
  const color = scoreColor(score)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${color}66)`, transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="mono text-white font-bold leading-none" style={{ fontSize: 46 }}>
          {score}
        </span>
        <span className="text-white/40 text-sm mt-1">/100</span>
      </div>
    </div>
  )
}

// ── Primary CTA (used top + bottom — one dominant action) ───────────────────

function SignupCta({ placement }: { placement: string }) {
  return (
    <div className="max-w-md mx-auto">
      <Link
        href="/signup"
        onClick={() => track("results_cta_click", { placement })}
        className="btn-orange block w-full text-center text-base font-semibold px-6 py-3.5 !rounded-xl"
      >
        Fix this automatically — start free →
      </Link>
      <p className="text-white/40 text-xs text-center mt-2.5 leading-relaxed">
        $99/mo after a 14-day free trial · $0 today · cancel anytime
      </p>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.08]" />
    </div>
  )
}

// ── Evidence card (chat-style, per engine) ──────────────────────────────────

function EvidenceCard({
  engine,
  businessName,
  city,
}: {
  engine: EngineRow
  businessName: string
  city: string
}) {
  const [expanded, setExpanded] = useState(false)
  const fullText = engine.evidence?.response ?? engine.legacyText ?? ""
  const mentioned = engine.evidence
    ? engine.evidence.mentioned.filter((m): m is string => typeof m === "string")
    : []
  const query =
    engine.evidence && typeof engine.evidence.query === "string" && engine.evidence.query.trim()
      ? engine.evidence.query.trim()
      : null
  const isLong = fullText.length > 300
  const shownText = expanded ? fullText : truncateAtWord(fullText, 300)

  return (
    <div className="bg-bg-secondary border border-white/[0.08] rounded-2xl p-5">
      {/* Header: engine + verdict chip */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
            <engine.Icon className="w-4 h-4" style={{ color: engine.iconColor }} />
          </div>
          <span className="text-white text-sm font-semibold truncate">{engine.name}</span>
        </div>
        {engine.appeared ? (
          <span className="flex-shrink-0 text-[11px] font-semibold text-green-400 bg-green-500/10 border border-green-500/25 rounded-full px-2.5 py-1">
            You were mentioned ✓
          </span>
        ) : (
          <span className="flex-shrink-0 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/25 rounded-full px-2.5 py-1">
            You weren&apos;t mentioned
          </span>
        )}
      </div>

      {/* The question — verbatim when we have it */}
      {query ? (
        <div className="flex justify-end mb-3">
          <div className="max-w-[85%] bg-bg-tertiary border border-white/[0.06] rounded-2xl rounded-br-md px-4 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">A customer asks</p>
            <p className="text-white/85 text-[13px] leading-relaxed m-0">&ldquo;{query}&rdquo;</p>
          </div>
        </div>
      ) : (
        <p className="text-white/35 text-xs mb-3">
          We asked {engine.name} about businesses like yours in {city}.
        </p>
      )}

      {/* The answer — verbatim excerpt */}
      {fullText ? (
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">
            {engine.name} answered
          </p>
          <p className="text-white/75 text-[13px] leading-relaxed m-0 whitespace-pre-line">
            {highlightNames(shownText, mentioned, businessName)}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-brand-orange text-xs font-medium hover:text-brand-orange-light transition-colors"
            >
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Show full response <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      ) : (
        <p className="text-white/35 text-[13px] bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 m-0">
          {engine.name} didn&apos;t return a usable answer during this scan
          {engine.appeared ? "" : ` — and your business wasn't in the results we could check`}.
        </p>
      )}
    </div>
  )
}

// ── Competitor bar chart (inline SVG, no libraries) ─────────────────────────

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
          const barColor = r.isYou ? "rgba(255,255,255,0.22)" : "#FF6B1A"
          const label = r.name.length > 20 ? r.name.slice(0, 19) + "…" : r.name
          return (
            <g key={`${r.name}-${i}`}>
              <text
                x={labelW - 10} y={y + rowH / 2 + 1}
                textAnchor="end" dominantBaseline="middle"
                fill={r.isYou ? "rgba(255,255,255,0.55)" : "#fff"}
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
                fill={r.isYou ? "rgba(255,255,255,0.45)" : "#FF8845"}
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

// ── Findings (triaged, top 3 expanded, rest behind toggle) ──────────────────

function FindingCard({
  issue,
  compact,
}: {
  issue: { severity: string; headline: string; explanation: string; fix_summary: string }
  compact?: boolean
}) {
  const isCritical = issue.severity === "critical"
  return (
    <div className="bg-bg-secondary border border-white/[0.08] rounded-2xl p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isCritical ? "bg-red-500" : "bg-amber-400"}`}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold m-0 leading-snug">{issue.headline}</p>
          {!compact && (
            <p className="text-white/50 text-[13px] leading-relaxed mt-1.5 mb-2.5">
              {firstSentence(issue.explanation)}
            </p>
          )}
          <div className="flex items-start gap-2 bg-green-500/[0.08] border border-green-500/20 rounded-lg px-3 py-2">
            <Wand2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-400/90 text-xs leading-relaxed m-0">
              <span className="font-semibold text-green-400">alphaa&apos;s fix:</span> {issue.fix_summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FindingsList({
  issues,
}: {
  issues: { severity: string; headline: string; explanation: string; fix_summary: string }[]
}) {
  const [showAll, setShowAll] = useState(false)
  const order = { critical: 0, warning: 1, improvement: 2 } as Record<string, number>
  const sorted = [...issues].sort(
    (a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
  )
  const top = sorted.slice(0, 3)
  const rest = sorted.slice(3)
  const criticalCount = sorted.filter((i) => i.severity === "critical").length
  const otherCount = sorted.length - criticalCount

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/25 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {criticalCount} critical
          </span>
        )}
        {otherCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/25 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {otherCount} worth fixing
          </span>
        )}
      </div>
      <div className="space-y-3">
        {top.map((issue, i) => <FindingCard key={i} issue={issue} />)}
        {showAll && rest.map((issue, i) => <FindingCard key={`r-${i}`} issue={issue} compact />)}
      </div>
      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full text-center text-sm font-medium text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl py-2.5 transition-colors"
        >
          {showAll ? "Show fewer findings" : `Show all ${issues.length} findings`}
        </button>
      )}
    </div>
  )
}

// ── Fix timeline (visual, honest phrasing) ──────────────────────────────────

const TIMELINE = [
  {
    label: "Week 1",
    title: "First fixes go live",
    body: "Your first Google Business posts publish and the profile gaps from this scan get fixed.",
  },
  {
    label: "Weeks 2–3",
    title: "Signals build",
    body: "Fresh content and consistent business info accumulate — the sources AI reads start pointing at you.",
  },
  {
    label: "Week 4+",
    title: "AI re-checks, weekly",
    body: "alphaa re-runs this same scan every week and reports movement across ChatGPT, Gemini, Perplexity and Google AI.",
  },
]

function FixTimeline() {
  return (
    <div className="bg-bg-secondary border border-white/[0.08] rounded-2xl p-5 sm:p-6">
      <ol className="relative m-0 p-0 list-none">
        {TIMELINE.map((step, i) => (
          <li key={step.label} className="relative pl-9 pb-6 last:pb-0">
            {/* Connector line */}
            {i < TIMELINE.length - 1 && (
              <span
                className="absolute left-[9px] top-5 bottom-0 w-px"
                style={{ background: "linear-gradient(to bottom, rgba(255,107,26,0.5), rgba(255,107,26,0.1))" }}
                aria-hidden
              />
            )}
            {/* Dot */}
            <span
              className="absolute left-0 top-0.5 w-[19px] h-[19px] rounded-full border-2 border-brand-orange bg-bg-secondary flex items-center justify-center"
              aria-hidden
            >
              <span className="w-[7px] h-[7px] rounded-full bg-brand-orange" />
            </span>
            <p className="text-brand-orange text-[11px] font-semibold uppercase tracking-[0.14em] m-0">
              {step.label}
            </p>
            <p className="text-white text-sm font-semibold mt-1 mb-0.5">{step.title}</p>
            <p className="text-white/50 text-[13px] leading-relaxed m-0">{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="text-white/30 text-[11px] leading-relaxed mt-5 mb-0">
        No ranking guarantees — AI results vary by business and market. What alphaa controls is the
        work: the posts, the fixes, and the weekly proof of where you stand.
      </p>
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
        className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-full px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-default"
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

// ── Main component ───────────────────────────────────────────────────────────

function ScanResultsContent() {
  const params  = useSearchParams()
  const scanId  = params.get("id")
  const [result, setResult]   = useState<ScanResult | null>(null)
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
        const res  = await fetch(`/api/scan/result?id=${scanId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.ready) {
            if (!cancelled) { setResult(data.result); setLoading(false) }
            return
          }
        }
        attempts++
        if (attempts < 45) setTimeout(poll, 2000)
        else if (!cancelled) { setError(true); setLoading(false) }
      } catch {
        attempts++
        if (attempts < 45) setTimeout(poll, 2000)
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
  }, [result, scanId])

  const retry = useCallback(() => {
    setError(false)
    setLoading(true)
    setRetryKey((k) => k + 1)
  }, [])

  if (loading) return <ScanLoader />

  if (error || !result) {
    return (
      <div className="pt-24 pb-20 px-4 text-center max-w-md mx-auto">
        <AlertTriangle className="w-8 h-8 text-brand-orange mx-auto mb-4" />
        <p className="text-white text-lg font-medium mb-2">
          Your scan is taking longer than usual.
        </p>
        <p className="text-muted text-sm mb-6">
          {scanId
            ? "AI engines can be slow at peak times — your results may still be on the way. Check again, or start a fresh scan."
            : "We couldn't find that scan. Start a fresh one — it only takes 60 seconds."}
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
  const score        = result.visibilityScore
  const insights     = readInsights(result.ogData)
  const loss         = readLoss(insights)
  const competitors  = readCompetitors(insights)
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
  const verdict      = buildVerdict(aiMentions, totalEngines, businessName)

  // Competitor mention counts — computable only on new-shape rows.
  const hasEvidence = engineData.some((e) => e.evidence !== null)
  const competitorRows = hasEvidence
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
  const showCompetitorPanel = competitorRows.some((r) => r.count > 0)
  const chartRows = showCompetitorPanel
    ? [...competitorRows, { name: businessName, isYou: true, count: aiMentions }]
    : []

  const searchesLabel = industry ?? "businesses like yours"

  return (
    <div className="pt-20 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* ── Business header bar ─────────────────────────────────── */}
        <div className="flex items-center gap-3 bg-bg-secondary border border-white/[0.08] rounded-xl px-4 py-3.5">
          <div className="w-10 h-10 rounded-lg bg-brand-orange flex items-center justify-center flex-shrink-0">
            {result.ogData?.favicon ? (
              <img
                src={result.ogData.favicon}
                alt=""
                className="w-5 h-5 rounded"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            ) : (
              <span className="text-white text-[13px] font-bold">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[15px] font-medium truncate m-0">{businessName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-white/30" />
              <span className="text-white/40 text-xs truncate">
                {result.city}
                {result.ogData?.domain ? ` · ${result.ogData.domain}` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 bg-green-500/10 border border-green-500/25 rounded-full px-2.5 py-1">
            <Check className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-xs font-medium">Scan complete</span>
          </div>
        </div>

        {/* ── 1. HERO — the verdict ───────────────────────────────── */}
        <div className="relative overflow-hidden bg-bg-secondary border border-white/[0.08] rounded-2xl px-6 py-9 sm:px-9 !mt-4">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,107,26,0.10), transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <p className="text-center text-xs uppercase tracking-[0.16em] text-white/40 mb-5">
              Your AI visibility score
            </p>
            <ScoreGaugeBig score={score} />

            <h1 className="text-white text-[21px] sm:text-2xl font-bold text-center leading-snug max-w-md mx-auto mt-6 mb-0">
              {verdict}
            </h1>

            {/* FOMO — the emotional center, only when real estimates exist */}
            {loss && (
              <div className="mt-6 bg-bg-tertiary border border-brand-orange/25 rounded-xl px-5 py-4 max-w-lg mx-auto">
                <p className="text-white/85 text-[15px] leading-relaxed text-center m-0">
                  An estimated{" "}
                  <span className="text-brand-orange font-bold mono">
                    {loss.low.toLocaleString("en-US")}–{loss.high.toLocaleString("en-US")}
                  </span>{" "}
                  people searched AI assistants for {searchesLabel}{" "}
                  {isLocal ? "in or near" : "in"} {result.city} last month. You appeared in{" "}
                  <span className={aiMentions === 0 ? "text-red-400 font-bold" : "text-white font-bold"}>
                    {aiMentions} of {totalEngines}
                  </span>{" "}
                  of the answers we checked.
                </p>
                {loss.basis && (
                  <p className="text-white/30 text-[11px] text-center mt-2 m-0">
                    (estimate — {loss.basis})
                  </p>
                )}
              </div>
            )}

            <div className="mt-7">
              <SignupCta placement="top" />
            </div>
          </div>
        </div>

        {/* ── 2. THE EVIDENCE ─────────────────────────────────────── */}
        <div>
          <SectionHeading>What AI actually said</SectionHeading>
          <p className="text-white/50 text-sm leading-relaxed mb-4 -mt-1">
            We asked {totalEngines} AI assistants the kind of question your customers ask.
            These are the real responses, word for word.
          </p>
          <div className="space-y-3">
            {engineData.map((engine) => (
              <EvidenceCard
                key={engine.key}
                engine={engine}
                businessName={businessName}
                city={result.city}
              />
            ))}
          </div>
        </div>

        {/* ── 3. COMPETITOR PANEL ─────────────────────────────────── */}
        {showCompetitorPanel && (
          <div>
            <SectionHeading>Who AI recommends instead</SectionHeading>
            <div className="bg-bg-secondary border border-white/[0.08] rounded-2xl p-5 sm:p-6">
              <p className="text-white text-[15px] font-semibold mb-4 mt-0">
                Who AI is sending your customers to instead
              </p>
              <CompetitorChart rows={chartRows} totalEngines={totalEngines} />
              <p className="text-white/40 text-xs leading-relaxed mt-4 mb-0">
                How many of the {totalEngines} AI answers named each business.
                {" "}
                {aiMentions === 0
                  ? `Every customer who asked got someone else's name — never ${businessName}.`
                  : `${businessName} was named in ${aiMentions} of ${totalEngines} — the rest of the time, customers heard these names instead.`}
              </p>
            </div>
          </div>
        )}

        {/* ── 4. FINDINGS ─────────────────────────────────────────── */}
        {issues.length > 0 && (
          <div>
            <SectionHeading>Why this is happening</SectionHeading>
            <FindingsList issues={issues} />
          </div>
        )}

        {/* ── 5. HOW IT GETS FIXED ────────────────────────────────── */}
        <div>
          <SectionHeading>How alphaa fixes it</SectionHeading>
          <FixTimeline />
        </div>

        {/* ── 6. DECISION BLOCK ───────────────────────────────────── */}
        <div className="relative overflow-hidden bg-bg-secondary border border-white/[0.08] rounded-2xl px-6 py-9 sm:px-9">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(255,107,26,0.10), transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-white text-2xl font-bold text-center leading-snug m-0">
              alphaa fixes <span className="text-brand-orange">all of this.</span>
              <br />
              <span className="text-white/60 font-normal text-lg">Automatically. Every week.</span>
            </h2>

            <p className="text-white/50 text-sm text-center leading-relaxed max-w-md mx-auto mt-4 mb-6">
              An agency charges $1,000–$2,000/mo for this work. alphaa is $99 — up to{" "}
              <span className="text-white font-semibold">$22,800/year</span> back in your pocket,
              with a weekly report proving where you stand on AI.
            </p>

            {/* Honest proof — no invented customers */}
            <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 max-w-md mx-auto mb-7">
              <Bot className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
              <p className="text-white/60 text-[13px] leading-relaxed m-0">
                alphaa runs on alphaa. Ask ChatGPT what tools improve AI search visibility for
                local businesses — the same system you just watched grade your business is how
                we show up there.
              </p>
            </div>

            <SignupCta placement="bottom" />

            <div className="mt-6">
              <EmailReportButton scanId={result.scanId} />
            </div>
          </div>
        </div>

        {/* Honest urgency close */}
        <p className="text-white/40 text-[13px] text-center leading-relaxed max-w-sm mx-auto !mt-6">
          Every week you wait is another week AI recommends someone else.
        </p>

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
