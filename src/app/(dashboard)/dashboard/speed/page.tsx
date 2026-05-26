export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { ReCrawlButton } from "./ReCrawlButton"
import {
  Gauge,
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

function scoreBg(score: number): string {
  if (score >= 0.9) return "bg-green-400"
  if (score >= 0.5) return "bg-amber-400"
  return "bg-red-400"
}

function scoreLabel(score: number): string {
  if (score >= 0.9) return "Good"
  if (score >= 0.5) return "Needs Improvement"
  return "Poor"
}

function cwvPasses(auditId: string, score: number | null): boolean {
  if (score === null) return false
  return score >= 0.9
}

function PerformanceCircle({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = scoreBg(score)
  const textColor = scoreColor(score)
  const circumference = 2 * Math.PI * 36
  const strokeDash = (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx="44"
            cy="44"
            r="36"
            fill="none"
            className={color.replace("bg-", "stroke-")}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold mono ${textColor}`}>{pct}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-medium text-sm">Performance</p>
        <p className={`text-xs ${textColor}`}>{scoreLabel(score)}</p>
      </div>
    </div>
  )
}

function PassFailBadge({ passes }: { passes: boolean }) {
  return passes ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" />
      Pass
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" />
      Fail
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "text-red-400 bg-red-400/10",
    warning: "text-amber-400 bg-amber-400/10",
    improvement: "text-blue-400 bg-blue-400/10",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[severity] ?? "text-white/40 bg-white/5"}`}>
      {severity}
    </span>
  )
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
          <h1 className="text-white font-semibold text-2xl">Speed & Technical SEO</h1>
          <p className="text-white/50 text-sm mt-0.5">Website performance and crawl health</p>
        </div>
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
            <Globe className="w-7 h-7 text-white/30" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No website URL set</h2>
          <p className="text-white/50 text-sm max-w-xs mb-5">
            Add your website URL in Settings to get performance scores and technical SEO insights.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-[#ff6b1a] hover:bg-[#e85c00] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Go to Settings
          </a>
        </GlassCard>
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

  // Find top 3 failed opportunities
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
    .slice(0, 3)

  // Crawl issues breakdown
  const issues = (crawlResult?.issues ?? []) as CrawlIssue[]
  const criticalCount = issues.filter((i) => i.severity === "critical").length
  const warningCount = issues.filter((i) => i.severity === "warning").length
  const improvementCount = issues.filter((i) => i.severity === "improvement").length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-semibold text-2xl">Speed & Technical SEO</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Performance for{" "}
            <a
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff6b1a] hover:underline"
            >
              {user.websiteUrl}
            </a>
          </p>
        </div>
        <ReCrawlButton />
      </div>

      {/* PageSpeed section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance circle */}
        <GlassCard>
          {pageSpeedError ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <p className="text-white/50 text-sm">PageSpeed unavailable</p>
              <p className="text-white/30 text-xs max-w-xs">{pageSpeedError}</p>
            </div>
          ) : perfScore !== null ? (
            <PerformanceCircle score={perfScore} />
          ) : (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-white/20 border-t-[#ff6b1a] rounded-full animate-spin" />
            </div>
          )}
        </GlassCard>

        {/* Core Web Vitals */}
        <GlassCard className="lg:col-span-2">
          <h2 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ff6b1a]" />
            Core Web Vitals
          </h2>
          {pageSpeedError ? (
            <p className="text-white/30 text-sm">Could not load data.</p>
          ) : (
            <div className="space-y-3">
              {CWV_AUDIT_IDS.map((id) => {
                const audit = audits[id]
                if (!audit) return null
                const passes = cwvPasses(id, audit.score)
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{CWV_LABELS[id]}</p>
                      <p className="text-white/40 text-xs">{audit.displayValue ?? "—"}</p>
                    </div>
                    <PassFailBadge passes={passes} />
                  </div>
                )
              })}

              <div className="pt-2 border-t border-white/[0.04]">
                <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-2">
                  Additional Metrics
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {EXTRA_AUDIT_IDS.map((id) => {
                    const audit = audits[id]
                    if (!audit) return null
                    return (
                      <div key={id} className="bg-white/[0.03] rounded-lg p-2.5">
                        <p className="text-white/40 text-xs mb-1">{EXTRA_LABELS[id]}</p>
                        <p className={`text-sm font-medium mono ${scoreColor(audit.score ?? 0)}`}>
                          {audit.displayValue ?? "—"}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Opportunities */}
      {!pageSpeedError && opportunities.length > 0 && (
        <GlassCard>
          <h2 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Top Opportunities
          </h2>
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="flex items-start gap-4 py-3 border-b border-white/[0.04] last:border-0"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    opp.score !== null && opp.score < 0.5 ? "bg-red-400" : "bg-amber-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{opp.title}</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed line-clamp-2">
                    {opp.description}
                  </p>
                </div>
                {opp.displayValue && (
                  <span className="text-white/50 text-xs mono flex-shrink-0">
                    {opp.displayValue}
                  </span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Crawl Results */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-white/40" />
            Crawl Results
          </h2>
          {crawlResult && (
            <span className="text-white/30 text-xs">
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
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <Globe className="w-8 h-8 text-white/20" />
            <p className="text-white/50 text-sm">No crawl data yet</p>
            <p className="text-white/30 text-xs max-w-xs">
              Click &ldquo;Re-crawl site&rdquo; to scan your website for technical SEO issues.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-white/30 text-xs mb-1">Pages Scanned</p>
                <p className="text-white font-semibold mono text-xl">{crawlResult.pagesScanned}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-white/30 text-xs mb-1">Critical Issues</p>
                <p className="text-red-400 font-semibold mono text-xl">{criticalCount}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-white/30 text-xs mb-1">Warnings</p>
                <p className="text-amber-400 font-semibold mono text-xl">{warningCount}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-white/30 text-xs mb-1">Improvements</p>
                <p className="text-blue-400 font-semibold mono text-xl">{improvementCount}</p>
              </div>
            </div>

            {/* Schema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {crawlResult.schemaFound.length > 0 && (
                <div className="bg-green-400/5 border border-green-400/10 rounded-xl p-3">
                  <p className="text-green-400 text-xs font-medium mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Schema Found
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {crawlResult.schemaFound.map((s) => (
                      <span
                        key={s}
                        className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {crawlResult.schemaMissing.length > 0 && (
                <div className="bg-red-400/5 border border-red-400/10 rounded-xl p-3">
                  <p className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Schema Missing
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {crawlResult.schemaMissing.map((s) => (
                      <span
                        key={s}
                        className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Issues list (up to 5) */}
            {issues.length > 0 && (
              <div>
                <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-2">
                  Issues
                </p>
                <div className="space-y-2">
                  {issues.slice(0, 5).map((issue, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0"
                    >
                      <SeverityBadge severity={issue.severity} />
                      <p className="text-white/60 text-xs leading-relaxed">
                        {issue.message ?? issue.type ?? JSON.stringify(issue)}
                      </p>
                    </div>
                  ))}
                  {issues.length > 5 && (
                    <p className="text-white/30 text-xs pt-1">
                      +{issues.length - 5} more issues
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
