"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ScanLoader } from "@/components/scan/ScanLoader"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { track } from "@/lib/gtag"
import { fbTrack } from "@/lib/pixel"
import type { ScanResult, EngineEvidence, ScanInsights } from "@/types/scan"
import {
  MapPin, AlertTriangle, Globe, Sparkles, MessageSquare, Search,
  Check, Mail, Wand2, ChevronDown, ChevronUp, Bot, X, ExternalLink,
  Lock, BarChart3,
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

function scoreColor(score: number): string {
  if (score >= 75) return "#22C55E"
  if (score >= 50) return "#FF6B1A"
  return "#EF4444"
}

// Plain-English verdict — hero fallback when no search estimate exists.
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

// Business owners may not know what Perplexity or Gemini are — a one-line
// credibility tag under each engine name explains why missing from it matters.
const ENGINE_SUBS: Record<string, string> = {
  "ChatGPT":    "the world's most-used AI assistant",
  "Google AI":  "AI answers shown in Google Search",
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
        {/* Plain-language severity — "44" alone doesn't tell a business owner
            whether that's fine or a fire. */}
        <span className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color }}>
          {score < 50 ? "Critical" : score < 75 ? "Needs work" : "Strong"}
        </span>
      </div>
    </div>
  )
}

// ── Trust strip — honest items only, shown near every CTA ───────────────────

const TRUST_ITEMS = [
  { Icon: Check,     text: "$0 today · 14-day free trial" },
  { Icon: Check,     text: "Cancel anytime in two clicks" },
  { Icon: Lock,      text: "Payments secured by Stripe" },
  { Icon: BarChart3, text: "Weekly progress report — measured, not promised" },
] as const

function TrustStrip({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-white/35 text-[11px] text-center leading-relaxed mt-3 mb-0">
        $0 today · 14-day free trial · cancel anytime in two clicks · payments secured by Stripe
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-2 mt-4">
      {TRUST_ITEMS.map(({ Icon, text }) => (
        <div key={text} className="flex items-start gap-1.5">
          <Icon className="w-3 h-3 text-green-400/80 flex-shrink-0 mt-[3px]" />
          <span className="text-white/45 text-[11px] leading-snug">{text}</span>
        </div>
      ))}
    </div>
  )
}

// ── Primary CTA (hero + decision block) ─────────────────────────────────────

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
      <p className="text-white/35 text-[11px] text-center mt-2 mb-0">then $99/mo</p>
      <TrustStrip />
    </div>
  )
}

// ── Mid-page CTA (between evidence and findings) ────────────────────────────

function MidCta() {
  return (
    <div className="bg-bg-secondary border border-brand-orange/20 rounded-2xl px-5 py-5 sm:px-6">
      <div className="sm:flex sm:items-center sm:gap-5">
        <p className="text-white text-[15px] font-semibold leading-snug m-0 sm:flex-1">
          Everything above is fixable — alphaa does the work for you from $99/mo.
        </p>
        <Link
          href="/signup"
          onClick={() => track("results_cta_click", { placement: "mid" })}
          className="btn-orange block sm:inline-block text-center text-sm font-semibold px-6 py-2.5 !rounded-xl mt-3 sm:mt-0 flex-shrink-0"
        >
          Start free →
        </Link>
      </div>
      <TrustStrip compact />
    </div>
  )
}

// ── Sticky bottom CTA bar (appears after ~800px scroll, dismissible) ────────

function StickyCtaBar({
  businessName,
  losing,
}: {
  businessName: string
  losing: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (dismissed) return null

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="flex items-center gap-3 bg-bg-tertiary/95 backdrop-blur-md border border-white/[0.12] rounded-2xl pl-4 pr-2 py-2.5 shadow-2xl">
          <p className="flex-1 min-w-0 text-white/80 text-[13px] leading-snug m-0">
            <span className="text-white font-semibold">{businessName}</span>
            {losing
              ? ", AI is recommending your competitors — fix it from $99/mo"
              : ", AI knows you today — keep it that way from $99/mo"}
          </p>
          <Link
            href="/signup"
            onClick={() => track("results_cta_click", { placement: "sticky_bar" })}
            className="btn-orange flex-shrink-0 text-[13px] font-semibold px-4 py-2 !rounded-lg whitespace-nowrap"
          >
            Start free →
          </Link>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1.5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
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

// ── Hero headline — the FOMO line IS the hero ───────────────────────────────

function HeroHeadline({
  loss,
  keyword,
  searchesLabel,
  isLocal,
  city,
  aiMentions,
  totalEngines,
  verdict,
}: {
  loss: LossInfo | null
  keyword: string | null
  searchesLabel: string
  isLocal: boolean
  city: string
  aiMentions: number
  totalEngines: number
  verdict: string
}) {
  const mentionsClass =
    aiMentions === 0
      ? "text-red-400"
      : aiMentions === totalEngines
        ? "text-green-400"
        : "text-white"

  if (loss) {
    return (
      <h1 className="text-white text-[26px] sm:text-[32px] font-bold leading-[1.3] m-0">
        An estimated{" "}
        <span className="mono whitespace-nowrap">
          {loss.low.toLocaleString("en-US")}–{loss.high.toLocaleString("en-US")}
        </span>{" "}
        high-intent buyers asked AI assistants for{" "}
        {keyword ? (
          <span className="text-brand-orange">&ldquo;{keyword}&rdquo;</span>
        ) : (
          <>
            {searchesLabel} {isLocal ? "in or near" : "in"} {city}
          </>
        )}{" "}
        in the last 30 days. You appeared in{" "}
        <span className={`mono ${mentionsClass}`}>
          {aiMentions} of {totalEngines}
        </span>{" "}
        answers we checked
        {aiMentions === 0 ? (
          <>
            {" "}&mdash; <span className="text-red-400">you missed 100% of them.</span>
          </>
        ) : (
          "."
        )}
      </h1>
    )
  }

  // Fallback (old rows / null estimate): strong verdict from what exists.
  return (
    <>
      <h1 className="text-white text-2xl sm:text-[28px] font-bold leading-snug m-0">
        {verdict}
      </h1>
      <p className="text-white/50 text-sm mt-3 mb-0">
        Mentioned in{" "}
        <span className={`mono font-bold ${mentionsClass}`}>
          {aiMentions} of {totalEngines}
        </span>{" "}
        AI answers we checked.
      </p>
    </>
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
          <div className="min-w-0">
            <span className="text-white text-sm font-semibold truncate block">{engine.name}</span>
            {ENGINE_SUBS[engine.name] && (
              <span className="text-white/35 text-[11px] leading-tight truncate block">
                {ENGINE_SUBS[engine.name]}
              </span>
            )}
          </div>
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

// ── Competitor intel table (new contract) ───────────────────────────────────

function MentionsPill({
  count,
  total,
  tone,
}: {
  count: number
  total: number
  tone: "competitor" | "you"
}) {
  // Competitors: orange = threat (never green). You: red when absent, green when everywhere.
  const cls =
    tone === "you"
      ? count === 0
        ? "text-red-400 bg-red-500/10 border-red-500/25"
        : count === total
          ? "text-green-400 bg-green-500/10 border-green-500/25"
          : "text-brand-orange bg-brand-orange/10 border-brand-orange/25"
      : count === 0
        ? "text-white/40 bg-white/[0.04] border-white/[0.1]"
        : "text-brand-orange bg-brand-orange/10 border-brand-orange/25"
  return (
    <span className={`inline-flex items-center whitespace-nowrap text-[11px] font-medium border rounded-full px-2.5 py-1 ${cls}`}>
      Mentioned by&nbsp;<span className="mono font-bold">{count}</span>&nbsp;of {total} AI assistants
    </span>
  )
}

function GoogleRankCell({
  rank,
  keyword,
}: {
  rank: number | null
  keyword: string | null
}) {
  if (rank === null) return <span className="text-white/25 text-xs">—</span>
  return (
    <span className="text-white/55 text-xs leading-snug">
      Ranks <span className="mono text-white font-semibold">#{rank}</span> on Google
      {keyword ? <> for &ldquo;{keyword}&rdquo;</> : null}
    </span>
  )
}

const INTEL_GRID = "sm:grid sm:grid-cols-[minmax(0,1fr)_215px_170px] sm:gap-x-4 sm:items-center"

function CompetitorIntelTable({
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
  const googleLabel = serpCountry && serpCountry !== "us" ? `google.${serpCountry}` : "Google"

  return (
    <div className="bg-bg-secondary border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Column header */}
      <div className={`hidden ${INTEL_GRID} px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]`}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Business</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">AI mentions</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Google rank</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {competitors.map((c, i) => {
          const href = c.url ?? (c.domain ? `https://${c.domain}` : null)
          const linkLabel = c.domain ?? (c.url ? hostFromUrl(c.url) : null)
          return (
            <div key={`${c.name}-${i}`} className={`${INTEL_GRID} px-4 sm:px-5 py-3.5`}>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate m-0">{c.name}</p>
                {href && linkLabel && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-brand-orange transition-colors"
                  >
                    <span className="truncate max-w-[220px]">{linkLabel}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
              </div>
              <div className="mt-2 sm:mt-0">
                <MentionsPill count={c.aiMentions} total={totalEngines} tone="competitor" />
              </div>
              <div className="mt-1.5 sm:mt-0">
                <GoogleRankCell rank={c.googleRank} keyword={keyword} />
              </div>
            </div>
          )
        })}

        {/* The scanned business — contrasting bottom row */}
        <div
          className={`${INTEL_GRID} px-4 sm:px-5 py-3.5 ${
            you.aiMentions === 0 ? "bg-red-500/[0.05]" : "bg-white/[0.02]"
          }`}
        >
          <div className="min-w-0 flex items-center gap-2">
            <p className="text-white text-sm font-semibold truncate m-0">{you.name}</p>
            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/50 border border-white/[0.18] rounded px-1.5 py-0.5">
              You
            </span>
          </div>
          <div className="mt-2 sm:mt-0">
            <MentionsPill count={you.aiMentions} total={totalEngines} tone="you" />
          </div>
          <div className="mt-1.5 sm:mt-0">
            {you.googleRank !== null ? (
              <GoogleRankCell rank={you.googleRank} keyword={keyword} />
            ) : serpCount !== null ? (
              <span className="text-red-400/80 text-xs leading-snug">
                Not in {googleLabel}&apos;s top {serpCount}
                {keyword ? <> for &ldquo;{keyword}&rdquo;</> : null}
              </span>
            ) : (
              <span className="text-white/25 text-xs">—</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-white/30 text-[11px] leading-relaxed px-4 sm:px-5 py-3 border-t border-white/[0.06] m-0">
        AI mentions from this live scan
        {serpCount !== null && keyword ? (
          <>
            {" "}· Positions from a live, non-personalized search on {googleLabel} for &ldquo;{keyword}&rdquo; — your
            own Google results are personalized and may rank you differently
          </>
        ) : null}
        .
      </p>
    </div>
  )
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
        No ranking guarantees — alphaa controls the work and shows you the movement weekly.
      </p>
    </div>
  )
}

// ── First-week strip (before the final CTA) ─────────────────────────────────

const FIRST_WEEK = [
  { title: "First Google post",  body: "Your first Google Business post goes live." },
  { title: "Profile fixes",      body: "The gaps this scan found get corrected." },
  { title: "Content signals",    body: "Fresh content AI reads starts publishing." },
  { title: "First AI re-check",  body: "We re-run this scan Wednesday and email you the result." },
] as const

function FirstWeekStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {FIRST_WEEK.map((item, i) => (
        <div
          key={item.title}
          className="flex items-start gap-3 bg-bg-secondary border border-white/[0.08] rounded-xl px-4 py-3.5"
        >
          <span
            className="mono flex-shrink-0 w-6 h-6 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[11px] font-bold flex items-center justify-center mt-0.5"
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-white text-[13px] font-semibold m-0">{item.title}</p>
            <p className="text-white/45 text-xs leading-relaxed mt-0.5 mb-0">{item.body}</p>
          </div>
        </div>
      ))}
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
    // Report viewed — the qualified-intent signal for Meta retargeting.
    fbTrack("ViewContent", { content_name: "scan_results", value: result.visibilityScore })
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
  const verdict      = buildVerdict(aiMentions, totalEngines, businessName)

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

        {/* ── 1. HERO — the FOMO number is the headline ───────────── */}
        <div className="relative overflow-hidden bg-bg-secondary border border-white/[0.08] rounded-2xl px-6 py-8 sm:px-8 sm:py-9 !mt-4">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,107,26,0.10), transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <div className="sm:flex sm:items-center sm:gap-8 text-center sm:text-left">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40 mb-4">
                  Your free AI visibility scan
                </p>
                <HeroHeadline
                  loss={loss}
                  keyword={keyword}
                  searchesLabel={searchesLabel}
                  isLocal={isLocal}
                  city={result.city}
                  aiMentions={aiMentions}
                  totalEngines={totalEngines}
                  verdict={verdict}
                />
                {loss && loss.basis && (
                  <p className="text-white/30 text-[11px] leading-relaxed mt-3 mb-0">
                    Estimate — {loss.basis}
                  </p>
                )}
              </div>
              <div className="mt-7 sm:mt-0 flex-shrink-0">
                <ScoreGaugeBig score={score} />
                <p className="text-white/40 text-[11px] text-center mt-2 mb-0">
                  AI visibility score
                </p>
              </div>
            </div>

            <div className="mt-8">
              <SignupCta placement="top" />
            </div>
          </div>
        </div>

        {/* ── 2. THE EVIDENCE ─────────────────────────────────────── */}
        <div>
          <SectionHeading>What AI actually said</SectionHeading>
          <p className="text-white/50 text-sm leading-relaxed mb-4 -mt-1">
            The real answers from {totalEngines} AI assistants, word for word.
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

        {/* ── 3. COMPETITOR INTEL (table → chart fallback → omit) ── */}
        {hasIntelTable ? (
          <div>
            <SectionHeading>Who AI recommends instead</SectionHeading>
            <CompetitorIntelTable
              competitors={competitorDetails}
              you={{ name: businessName, aiMentions, googleRank: youGoogleRank }}
              totalEngines={totalEngines}
              keyword={keyword}
              serpCount={serpResults ? serpResults.length : null}
              serpCountry={readSerpCountry(insights)}
            />
          </div>
        ) : showChartFallback ? (
          <div>
            <SectionHeading>Who AI recommends instead</SectionHeading>
            <div className="bg-bg-secondary border border-white/[0.08] rounded-2xl p-5 sm:p-6">
              <p className="text-white text-[15px] font-semibold mb-4 mt-0">
                Who AI is sending your customers to instead
              </p>
              <CompetitorChart rows={chartRows} totalEngines={totalEngines} />
              <p className="text-white/40 text-xs leading-relaxed mt-4 mb-0">
                How many of the {totalEngines} AI answers named each business.
              </p>
            </div>
          </div>
        ) : null}

        {/* ── 4. MID-PAGE CTA (between evidence and findings) ─────── */}
        <MidCta />

        {/* ── 5. FINDINGS ─────────────────────────────────────────── */}
        {issues.length > 0 && (
          <div>
            <SectionHeading>Why this is happening</SectionHeading>
            <FindingsList issues={issues} />
          </div>
        )}

        {/* ── 6. HOW IT GETS FIXED ────────────────────────────────── */}
        <div>
          <SectionHeading>How alphaa fixes it</SectionHeading>
          <FixTimeline />
        </div>

        {/* ── 7. FIRST WEEK (before the final CTA) ────────────────── */}
        <div>
          <SectionHeading>What alphaa does in your first week</SectionHeading>
          <FirstWeekStrip />
        </div>

        {/* ── 8. DECISION BLOCK ───────────────────────────────────── */}
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
              Agencies charge $1,000–$2,000/mo for this work — alphaa is $99, with a weekly
              report proving where you stand.
            </p>

            {/* Honest proof — no invented customers */}
            <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 max-w-md mx-auto mb-7">
              <Bot className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
              <p className="text-white/60 text-[13px] leading-relaxed m-0">
                alphaa runs on alphaa — ask ChatGPT what tools improve AI search visibility for
                local businesses.
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

      {/* Sticky bottom CTA — appears after ~800px scroll, dismissible */}
      <StickyCtaBar businessName={businessName} losing={aiMentions < totalEngines} />
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
