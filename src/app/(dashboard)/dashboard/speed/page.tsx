export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { ScoreRing } from "@/components/common/ScoreRing"
import { ReCrawlButton } from "./ReCrawlButton"
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe,
  Settings,
  Zap,
} from "lucide-react"

export const metadata = { title: "Speed & Technical SEO" }

// PageSpeed API types
type PageSpeedAudit = {
  id: string
  title: string
  description: string
  score: number | null
  displayValue?: string
  numericValue?: number
}

type PageSpeedResult = {
  lighthouseResult: {
    categories: {
      performance: { score: number }
    }
    audits: Record<string, PageSpeedAudit>
  }
}

type CrawlIssue = {
  severity: "critical" | "warning" | "improvement"
  url?: string
  message?: string
  type?: string
  [key: string]: unknown
}

const CWV_AUDIT_IDS = [
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
] as const

const EXTRA_AUDIT_IDS = [
  "first-contentful-paint",
  "speed-index",
  "interactive",
] as const

const CWV_LABELS: Record<string, string> = {
  "largest-contentful-paint": "LCP",
  "total-blocking-time": "TBT / FID",
  "cumulative-layout-shift": "CLS",
}

const EXTRA_LABELS: Record<string, string> = {
  "first-contentful-paint": "FCP",
  "speed-index": "Speed Index",
  interactive: "Time to Interactive",
}

function scoreColor(score: number): string {
  if (score >= 0.9) return "text-green-400"
  if (score >= 0.5) return "text-amber-400"
  return "text-red-400"
}

function scoreLabel(score: number): string {
  if (score >= 0.9) return "Good"
  if (score >= 0.5) return "Needs Improvement"
  return "Poor"
}

function perfScoreLabel(pct: number): string {
  if (pct >= 90) return "Excellent"
  if (pct >= 70) return "Good"
  if (pct >= 50) return "Needs Work"
  return "Poor"
}

function perfScoreColor(pct: number): string {
  if (pct >= 90) return "text-green-400"
  if (pct >= 70) return "text-green-400"
  if (pct >= 50) return "text-amber-400"
  return "text-red-400"
}

function perfGradientFrom(pct: number): string {
  if (pct >= 70) return "from-green-500/[0.12]"
  if (pct >= 50) return "from-amber-500/[0.12]"
  return "from-red-500/[0.12]"
}

function perfBorderColor(pct: number): string {
  if (pct >= 70) return "border-green-500/20"
  if (pct >= 50) return "border-amber-500/20"
  return "border-red-500/20"
}

function perfOrbColor(pct: number): string {
  if (pct >= 70) return "bg-green-500/15"
  if (pct >= 50) return "bg-amber-500/15"
  return "bg-red-500/15"
}

// CWV threshold helpers
function lcpStatus(displayValue: string | undefined): { label: string; color: string; barColor: string; barPct: number } {
  // displayValue like "2.3 s" or "4.5 s"
  const val = parseFloat(displayValue ?? "99")
  if (val <= 2.5) return { label: "Good", color: "text-green-400", barColor: "bg-green-400", barPct: Math.min(100, (2.5 / val) * 60) }
  if (val <= 4) return { label: "Needs Work", color: "text-amber-400", barColor: "bg-amber-400", barPct: 40 }
  return { label: "Poor", color: "text-red-400", barColor: "bg-red-400", barPct: 20 }
}

function tbtStatus(displayValue: string | undefined): { label: string; color: string; barColor: string; barPct: number } {
  const val = parseFloat(displayValue ?? "9999")
  if (val <= 100) return { label: "Good", color: "text-green-400", barColor: "bg-green-400", barPct: 85 }
  if (val <= 300) return { label: "Needs Work", color: "text-amber-400", barColor: "bg-amber-400", barPct: 50 }
  return { label: "Poor", color: "text-red-400", barColor: "bg-red-400", barPct: 20 }
}

function clsStatus(displayValue: string | undefined): { label: string; color: string; barColor: string; barPct: number } {
  const val = parseFloat(displayValue ?? "99")
  if (val <= 0.1) return { label: "Good", color: "text-green-400", barColor: "bg-green-400", barPct: 85 }
  if (val <= 0.25) return { label: "Needs Work", color: "text-amber-400", barColor: "bg-amber-400", barPct: 50 }
  return { label: "Poor", color: "text-red-400", barColor: "bg-red-400", barPct: 20 }
}

function cwvCardStatus(auditId: string, displayValue: string | undefined) {
  if (auditId === "largest-contentful-paint") return lcpStatus(displayValue)
  if (auditId === "total-blocking-time") return tbtStatus(displayValue)
  if (auditId === "cumulative-layout-shift") return clsStatus(displayValue)
  return { label: "Unknown", color: "text-fg/40", barColor: "bg-fg/20", barPct: 50 }
}

function cwvCardGradient(label: string): string {
  if (label === "Good") return "from-green-500/[0.10] border-green-500/20"
  if (label === "Needs Work") return "from-amber-500/[0.10] border-amber-500/20"
  return "from-red-500/[0.10] border-red-500/20"
}

function cwvFriendlyName(id: string): string {
  if (id === "largest-contentful-paint") return "Page Load Speed"
  if (id === "total-blocking-time") return "Interactivity"
  if (id === "cumulative-layout-shift") return "Layout Stability"
  return CWV_LABELS[id] ?? id
}

function cwvSubtitle(id: string): string {
  if (id === "largest-contentful-paint") return "How fast the main content appears"
  if (id === "total-blocking-time") return "How quickly your page responds to taps"
  if (id === "cumulative-layout-shift") return "How much the page shifts while loading"
  return ""
}

function impactBadge(score: number | null): { label: string; cls: string } {
  if (score === null || score >= 0.9) return { label: "Low", cls: "text-blue-400 bg-blue-400/10 border-blue-400/20" }
  if (score >= 0.5) return { label: "Medium", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" }
  return { label: "High", cls: "text-red-400 bg-red-400/10 border-red-400/20" }
}

export default async function SpeedPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    select: { id: true, websiteUrl: true },
  })

  if (!user?.websiteUrl) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-fg font-semibold text-2xl">Speed & Performance</h1>
          <p className="text-fg/50 text-sm mt-0.5">Website performance and crawl health</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.08] via-transparent to-transparent p-8">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#FF6B1A]/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-5 py-8">
            <span className="text-5xl">🌐</span>
            <div className="space-y-2 max-w-xs">
              <h2 className="text-fg font-semibold text-xl">No website URL set</h2>
              <p className="text-fg/50 text-sm leading-relaxed">
                Add your website URL in Settings to get performance scores and technical SEO insights.
              </p>
            </div>
            <a
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 bg-[#FF6B1A] hover:bg-[#e85c00] text-fg text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4" />
              Go to Settings
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Fetch PageSpeed data server-side
  let pageSpeed: PageSpeedResult | null = null
  let pageSpeedError: string | null = null
  try {
    const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      user.websiteUrl
    )}&strategy=mobile`
    const psRes = await fetch(psUrl, { cache: "no-store" })
    if (!psRes.ok) {
      const errText = await psRes.text()
      pageSpeedError = `PageSpeed API returned ${psRes.status}. ${errText.slice(0, 200)}`
    } else {
      pageSpeed = (await psRes.json()) as PageSpeedResult
    }
  } catch (err) {
    pageSpeedError = err instanceof Error ? err.message : "Failed to fetch PageSpeed data"
  }

  // Latest crawl result
  const crawlResult = await db.crawlResult.findFirst({
    where: { userId: user.id },
    orderBy: { crawledAt: "desc" },
  })

  const audits = pageSpeed?.lighthouseResult?.audits ?? {}
  const perfScore = pageSpeed?.lighthouseResult?.categories?.performance?.score ?? null
  const perfPct = perfScore !== null ? Math.round(perfScore * 100) : null

  // Find top opportunities
  const opportunities = Object.values(audits)
    .filter(
      (a) =>
        a.score !== null &&
        a.score < 0.9 &&
        a.displayValue &&
        !CWV_AUDIT_IDS.includes(a.id as (typeof CWV_AUDIT_IDS)[number]) &&
        !EXTRA_AUDIT_IDS.includes(a.id as (typeof EXTRA_AUDIT_IDS)[number])
    )
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 5)

  // Crawl issues breakdown
  const issues = (crawlResult?.issues ?? []) as CrawlIssue[]
  const criticalCount = issues.filter((i) => i.severity === "critical").length
  const warningCount = issues.filter((i) => i.severity === "warning").length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-fg font-semibold text-2xl">Speed & Performance</h1>
          <p className="text-fg/50 text-sm mt-0.5">
            Performance for{" "}
            <a
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF6B1A] hover:underline"
            >
              {user.websiteUrl}
            </a>
          </p>
        </div>
        <ReCrawlButton />
      </div>

      {/* Hero: Score ring */}
      {pageSpeedError ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-transparent p-6">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-fg font-medium">PageSpeed data unavailable</p>
              <p className="text-fg/40 text-sm mt-0.5">{pageSpeedError}</p>
            </div>
          </div>
        </div>
      ) : perfPct !== null ? (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${perfGradientFrom(perfPct)} via-transparent to-transparent ${perfBorderColor(perfPct)} p-6 md:p-8`}>
          <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full ${perfOrbColor(perfPct)} blur-3xl pointer-events-none`} />
          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            {/* Score ring */}
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={perfPct} size={120} />
              <div className="text-center">
                <p className={`text-lg font-bold ${perfScoreColor(perfPct)}`}>
                  {perfScoreLabel(perfPct)}
                </p>
                <p className="text-fg/40 text-xs">Performance Score</p>
              </div>
            </div>

            {/* Additional metrics */}
            <div className="flex-1 grid grid-cols-3 gap-3 w-full">
              {EXTRA_AUDIT_IDS.map((id) => {
                const audit = audits[id]
                if (!audit) return null
                return (
                  <div key={id} className="bg-fg/[0.04] rounded-xl p-4 text-center">
                    <p className="text-fg/40 text-xs mb-1">{EXTRA_LABELS[id]}</p>
                    <p className={`text-lg font-bold font-mono ${scoreColor(audit.score ?? 0)}`}>
                      {audit.displayValue ?? "—"}
                    </p>
                    <p className={`text-xs mt-0.5 ${scoreColor(audit.score ?? 0)}`}>
                      {scoreLabel(audit.score ?? 0)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <GlassCard>
          <div className="flex items-center justify-center py-10 gap-3">
            <div className="w-6 h-6 border-2 border-line/20 border-t-[#FF6B1A] rounded-full animate-spin" />
            <p className="text-fg/40 text-sm">Loading performance data…</p>
          </div>
        </GlassCard>
      )}

      {/* Core Web Vitals */}
      {!pageSpeedError && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#FF6B1A]" />
            <h2 className="text-fg font-semibold">Core Web Vitals</h2>
            <span className="text-fg/30 text-xs">— Google's key speed signals</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CWV_AUDIT_IDS.map((id) => {
              const audit = audits[id]
              if (!audit) return null
              const status = cwvCardStatus(id, audit.displayValue)
              const gradCls = cwvCardGradient(status.label)
              return (
                <div
                  key={id}
                  className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradCls} via-transparent to-transparent p-5`}
                >
                  <p className="text-fg/50 text-xs mb-1">{cwvFriendlyName(id)}</p>
                  <p className="text-3xl font-bold font-mono text-fg">
                    {audit.displayValue ?? "—"}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${status.color}`}>{status.label}</p>
                  <p className="text-fg/30 text-xs mt-0.5 leading-relaxed">
                    {cwvSubtitle(id)}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-fg/[0.06]">
                    <div
                      className={`h-full rounded-full ${status.barColor}`}
                      style={{ width: `${status.barPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Crawl Health */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-fg/40" />
            <h2 className="text-fg font-semibold">Crawl Health</h2>
          </div>
          {crawlResult && (
            <span className="text-fg/30 text-xs">
              Last crawled{" "}
              {new Date(crawlResult.crawledAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {!crawlResult ? (
          <div className="relative overflow-hidden rounded-2xl border border-line/10 bg-gradient-to-br from-fg/[0.04] via-transparent to-transparent p-8">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <span className="text-4xl">🔍</span>
              <p className="text-fg/50 text-sm">No crawl data yet</p>
              <p className="text-fg/30 text-xs max-w-xs leading-relaxed">
                Click &ldquo;Re-crawl site&rdquo; to scan your website for technical SEO issues.
              </p>
              <ReCrawlButton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-fg/[0.03] border border-line/[0.06] rounded-2xl p-5">
              <p className="text-fg/40 text-xs mb-2">Pages Found</p>
              <p className="text-3xl font-bold font-mono text-fg">{crawlResult.pagesScanned}</p>
              <div className="mt-3 h-1.5 rounded-full bg-fg/[0.06]">
                <div className="h-full rounded-full bg-fg/20" style={{ width: "100%" }} />
              </div>
            </div>
            <div className="bg-fg/[0.03] border border-red-500/[0.12] rounded-2xl p-5">
              <p className="text-fg/40 text-xs mb-2">Broken Links</p>
              <p className={`text-3xl font-bold font-mono ${criticalCount > 0 ? "text-red-400" : "text-green-400"}`}>
                {criticalCount}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-fg/[0.06]">
                <div
                  className={`h-full rounded-full ${criticalCount > 0 ? "bg-red-400" : "bg-green-400"}`}
                  style={{ width: criticalCount > 0 ? "100%" : "0%" }}
                />
              </div>
            </div>
            <div className="bg-fg/[0.03] border border-amber-500/[0.12] rounded-2xl p-5">
              <p className="text-fg/40 text-xs mb-2">Missing Meta Tags</p>
              <p className={`text-3xl font-bold font-mono ${warningCount > 0 ? "text-amber-400" : "text-green-400"}`}>
                {warningCount}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-fg/[0.06]">
                <div
                  className={`h-full rounded-full ${warningCount > 0 ? "bg-amber-400" : "bg-green-400"}`}
                  style={{ width: warningCount > 0 ? `${Math.min(100, (warningCount / Math.max(crawlResult.pagesScanned, 1)) * 100 * 3)}%` : "0%" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schema found/missing */}
      {crawlResult && (crawlResult.schemaFound?.length > 0 || crawlResult.schemaMissing?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {crawlResult.schemaFound?.length > 0 && (
            <div className="bg-green-400/[0.04] border border-green-400/10 rounded-2xl p-5">
              <p className="text-green-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Schema Detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {crawlResult.schemaFound.map((s) => (
                  <span key={s} className="text-xs text-fg/60 bg-fg/5 border border-line/[0.06] px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {crawlResult.schemaMissing?.length > 0 && (
            <div className="bg-red-400/[0.04] border border-red-400/10 rounded-2xl p-5">
              <p className="text-red-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Schema Missing
              </p>
              <div className="flex flex-wrap gap-1.5">
                {crawlResult.schemaMissing.map((s) => (
                  <span key={s} className="text-xs text-fg/60 bg-fg/5 border border-line/[0.06] px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opportunities */}
      {!pageSpeedError && opportunities.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-fg font-semibold">Top Speed Opportunities</h2>
            <span className="text-fg/30 text-xs">— things to fix for a faster site</span>
          </div>
          <div className="space-y-3">
            {opportunities.map((opp) => {
              const impact = impactBadge(opp.score)
              return (
                <div
                  key={opp.id}
                  className="bg-fg/[0.03] border border-line/[0.06] rounded-2xl p-5 flex items-start gap-4"
                >
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-medium flex-shrink-0 ${impact.cls}`}>
                    {impact.label} impact
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-fg text-sm font-medium">{opp.title}</p>
                    <p className="text-fg/40 text-xs mt-1 leading-relaxed line-clamp-2">
                      {opp.description}
                    </p>
                  </div>
                  {opp.displayValue && (
                    <span className="text-fg/40 text-xs font-mono flex-shrink-0">
                      {opp.displayValue}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Crawl issues list */}
      {crawlResult && issues.length > 0 && (
        <div>
          <h2 className="text-fg font-semibold mb-3">
            All Issues
            <span className="text-fg/30 font-normal text-sm ml-2">({issues.length})</span>
          </h2>
          <div className="space-y-2">
            {issues.slice(0, 8).map((issue, i) => {
              const colorMap = {
                critical: { dot: "bg-red-400", border: "border-red-500/20", label: "text-red-400" },
                warning: { dot: "bg-amber-400", border: "border-amber-500/20", label: "text-amber-400" },
                improvement: { dot: "bg-blue-400", border: "border-blue-500/20", label: "text-blue-400" },
              }
              const c = colorMap[issue.severity] ?? colorMap.warning
              return (
                <div key={i} className={`bg-fg/[0.03] border ${c.border} rounded-xl p-4 flex items-start gap-3`}>
                  <div className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium uppercase tracking-wide ${c.label}`}>
                      {issue.severity}
                    </span>
                    <p className="text-fg/60 text-sm mt-0.5 leading-relaxed">
                      {issue.message ?? issue.type ?? JSON.stringify(issue)}
                    </p>
                  </div>
                </div>
              )
            })}
            {issues.length > 8 && (
              <p className="text-fg/30 text-xs pt-1 pl-1">+{issues.length - 8} more issues</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
