export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { GlassCard } from '@/components/common/GlassCard'
import { Search, ArrowRight, TrendingUp, MousePointerClick, Eye, BarChart2 } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeywordRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(1)}%`
}

function formatPosition(pos: number): string {
  return pos.toFixed(1)
}

function positionColor(pos: number): string {
  if (pos <= 3) return 'text-green-400'
  if (pos < 10) return 'text-teal-400'
  if (pos <= 30) return 'text-amber-400'
  return 'text-red-400'
}

function positionBarColor(pos: number): string {
  if (pos <= 3) return '#4ade80'   // green-400
  if (pos < 10) return '#2dd4bf'   // teal-400
  if (pos <= 30) return '#fbbf24'  // amber-400
  return '#f87171'                 // red-400
}

function positionBarWidth(pos: number): string {
  // Inverse: position 1 = 100%, position 50+ = ~0%
  const pct = Math.max(0, Math.min(100, ((50 - pos) / 49) * 100))
  return `${pct.toFixed(0)}%`
}


function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function KeywordsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: {
      integration: true,
      keywordRankings: {
        orderBy: { impressions: 'desc' },
        take: 50,
      },
    },
  })

  const integration = user?.integration ?? null
  const hasGsc = !!(integration?.gscSiteUrl)
  const rankings: KeywordRow[] = (user?.keywordRankings ?? []).map((r) => ({
    query: r.query,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }))

  // ── No integration connected ──────────────────────────────────────────────
  if (!integration || !hasGsc) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Keywords</h1>
          <p className="text-white/40 text-sm mt-1">
            Your Search Console keyword rankings in one place.
          </p>
        </div>

        {/* Beautiful empty state */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.10] via-transparent to-transparent p-12">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-5 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Search className="w-7 h-7 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-white font-bold text-xl">
                Connect Google Search Console
              </h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Once connected, Alphaa pulls your top 50 keywords by impressions
                every day and shows you exactly what is ranking and what needs work.
              </p>
            </div>
            <Link
              href="/dashboard/settings/integrations"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B1A] hover:bg-[#ff8040] text-white font-semibold text-sm transition-colors"
            >
              Connect Google
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Connected but no data yet ──────────────────────────────────────────────
  if (rankings.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Keywords</h1>
          <p className="text-white/40 text-sm mt-1">
            Syncing data from {integration.gscSiteUrl}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.10] via-transparent to-transparent p-12">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#FF6B1A]/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-5 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-full border-2 border-[#FF6B1A] border-t-transparent animate-spin" />
            <div className="space-y-2">
              <h2 className="text-white font-bold text-xl">Syncing your data…</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Your keyword rankings will appear here after the first sync.
                This usually takes a few minutes.
              </p>
            </div>
            <Link
              href="/dashboard/settings/integrations"
              className="inline-flex items-center gap-1.5 text-[#FF6B1A] text-sm hover:underline"
            >
              Sync manually <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Compute summary stats ─────────────────────────────────────────────────
  const totalClicks = rankings.reduce((s, r) => s + r.clicks, 0)
  const totalImpressions = rankings.reduce((s, r) => s + r.impressions, 0)
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0

  // Position distribution buckets
  const top3 = rankings.filter((r) => r.position <= 3).length
  const page1 = rankings.filter((r) => r.position > 3 && r.position <= 10).length
  const pages23 = rankings.filter((r) => r.position > 10 && r.position <= 30).length
  const beyond = rankings.filter((r) => r.position > 30).length
  const top10 = top3 + page1

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-semibold text-2xl">Keywords</h1>
          <p className="text-white/40 text-sm mt-1">
            Last 28 days · {integration.gscSiteUrl}
          </p>
        </div>
        {top10 > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            {top10} keyword{top10 !== 1 ? 's' : ''} in top 10
          </div>
        )}
      </div>

      {/* Stats strip — 4 gradient hero cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Clicks — blue */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.12] via-transparent to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />
          <div className="relative space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400/70 text-xs font-medium mb-2">
              <MousePointerClick className="w-3.5 h-3.5" />
              Total Clicks
            </div>
            <p className="text-white font-bold text-3xl font-mono leading-none">
              {formatNumber(totalClicks)}
            </p>
            <p className="text-white/30 text-xs">last 28 days</p>
          </div>
        </div>

        {/* Total Impressions — purple */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.12] via-transparent to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />
          <div className="relative space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400/70 text-xs font-medium mb-2">
              <Eye className="w-3.5 h-3.5" />
              Impressions
            </div>
            <p className="text-white font-bold text-3xl font-mono leading-none">
              {formatNumber(totalImpressions)}
            </p>
            <p className="text-white/30 text-xs">times shown</p>
          </div>
        </div>

        {/* Avg CTR — green */}
        <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.12] via-transparent to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-green-500/15 blur-2xl pointer-events-none" />
          <div className="relative space-y-1">
            <div className="flex items-center gap-1.5 text-green-400/70 text-xs font-medium mb-2">
              <BarChart2 className="w-3.5 h-3.5" />
              Click Rate
            </div>
            <p className="text-white font-bold text-3xl font-mono leading-none">
              {formatCtr(avgCtr)}
            </p>
            <p className="text-white/30 text-xs">avg. across keywords</p>
          </div>
        </div>

        {/* Top 10 keywords — orange */}
        <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.12] via-transparent to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[#FF6B1A]/15 blur-2xl pointer-events-none" />
          <div className="relative space-y-1">
            <div className="flex items-center gap-1.5 text-[#FF6B1A]/70 text-xs font-medium mb-2">
              <span className="text-sm">🏆</span>
              Top 10
            </div>
            <p className="text-white font-bold text-3xl font-mono leading-none">
              {top10}
            </p>
            <p className="text-white/30 text-xs">keywords on page 1</p>
          </div>
        </div>
      </div>

      {/* Position distribution visual */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3 px-0.5">
          Position Distribution
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Top 3 */}
          <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] via-transparent to-transparent p-5 flex flex-col gap-2">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-400 rounded-b-2xl" />
            <p className="text-white font-bold text-4xl font-mono leading-none">{top3}</p>
            <div>
              <p className="text-white/70 text-sm font-medium">Top 3</p>
              <p className="text-white/30 text-xs">positions 1–3</p>
            </div>
            <span className="text-xl">🏆</span>
          </div>

          {/* Page 1 (4-10) */}
          <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.08] via-transparent to-transparent p-5 flex flex-col gap-2">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-400 rounded-b-2xl" />
            <p className="text-white font-bold text-4xl font-mono leading-none">{page1}</p>
            <div>
              <p className="text-white/70 text-sm font-medium">Page 1</p>
              <p className="text-white/30 text-xs">positions 4–10</p>
            </div>
            <span className="text-xl">📄</span>
          </div>

          {/* Pages 2-3 (11-30) */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-transparent p-5 flex flex-col gap-2">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400 rounded-b-2xl" />
            <p className="text-white font-bold text-4xl font-mono leading-none">{pages23}</p>
            <div>
              <p className="text-white/70 text-sm font-medium">Pages 2–3</p>
              <p className="text-white/30 text-xs">positions 11–30</p>
            </div>
            <span className="text-xl">📈</span>
          </div>

          {/* Beyond (30+) */}
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.08] via-transparent to-transparent p-5 flex flex-col gap-2">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-400 rounded-b-2xl" />
            <p className="text-white font-bold text-4xl font-mono leading-none">{beyond}</p>
            <div>
              <p className="text-white/70 text-sm font-medium">Beyond</p>
              <p className="text-white/30 text-xs">positions 30+</p>
            </div>
            <span className="text-xl">⬇️</span>
          </div>
        </div>
      </div>

      {/* Keywords table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold text-sm">
            All Keywords{' '}
            <span className="text-white/30 font-normal">
              ({rankings.length})
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left pl-5 pr-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Keyword
                </th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Position
                </th>
                <th className="text-right px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Clicks
                </th>
                <th className="text-right px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Impressions
                </th>
                <th className="text-right px-4 py-3 pr-5 text-white/30 text-xs font-medium uppercase tracking-wider whitespace-nowrap">
                  Click Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, idx) => {
                const isTop3 = row.position <= 3
                const isPage1 = row.position > 3 && row.position <= 10
                return (
                  <tr
                    key={idx}
                    className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Keyword */}
                    <td className="pl-5 pr-4 py-3 max-w-[240px]">
                      <div className="flex items-center gap-2">
                        {isTop3 && (
                          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 inline-block" />
                        )}
                        {!isTop3 && isPage1 && (
                          <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 inline-block" />
                        )}
                        <span
                          className={`truncate text-sm ${
                            isTop3
                              ? 'text-white font-medium'
                              : isPage1
                              ? 'text-white/85'
                              : 'text-white/60'
                          }`}
                          title={row.query}
                        >
                          {row.query}
                        </span>
                      </div>
                    </td>

                    {/* Position — bar + number */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: positionBarWidth(row.position),
                              background: positionBarColor(row.position),
                            }}
                          />
                        </div>
                        <span className={`font-mono text-sm ${positionColor(row.position)}`}>
                          {formatPosition(row.position)}
                        </span>
                      </div>
                    </td>

                    {/* Clicks */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-white font-mono text-xs">
                        {row.clicks.toLocaleString()}
                      </span>
                    </td>

                    {/* Impressions */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-white/40 font-mono text-xs">
                        {row.impressions.toLocaleString()}
                      </span>
                    </td>

                    {/* Click Rate */}
                    <td className="px-4 py-3 pr-5 text-right">
                      <span className="text-white/60 font-mono text-xs">
                        {formatCtr(row.ctr)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Top 3
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
            Page 1 (4–10)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Pages 2–3 (11–30)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Beyond (30+)
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
