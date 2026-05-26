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
  if (pos < 10) return 'text-green-400'
  if (pos <= 30) return 'text-amber-400'
  return 'text-red-400'
}

function positionBg(pos: number): string {
  if (pos < 10) return 'bg-green-500/10'
  if (pos <= 30) return 'bg-amber-500/10'
  return 'bg-red-500/10'
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

// ─── Summary metric card ──────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  sub?: string
}) {
  return (
    <div className="bg-bg-tertiary rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 text-muted" />
      </div>
      <div>
        <p className="text-white text-xl font-semibold font-mono">{value}</p>
        <p className="text-muted text-xs mt-0.5">{label}</p>
        {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function KeywordsPage() {
  const { userId: clerkId } = await auth()

  // Fetch user + integration + keyword rankings
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
          <p className="text-muted text-sm mt-1">
            Your Search Console keyword rankings in one place.
          </p>
        </div>

        <GlassCard className="flex flex-col items-center text-center py-12 gap-5">
          <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-white/10 flex items-center justify-center">
            <Search className="w-6 h-6 text-muted" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-white font-semibold text-lg">
              Connect Google Search Console to see your keywords
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Once connected, Alphaa pulls your top 50 keywords by impressions
              every day and shows you what's ranking and what needs work.
            </p>
          </div>
          <Link
            href="/dashboard/settings/integrations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white font-semibold text-sm transition-colors"
          >
            Connect Google
            <ArrowRight className="w-4 h-4" />
          </Link>
        </GlassCard>
      </div>
    )
  }

  // ── Connected but no data yet ──────────────────────────────────────────────
  if (rankings.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Keywords</h1>
          <p className="text-muted text-sm mt-1">
            Showing data from {integration.gscSiteUrl}
          </p>
        </div>

        <GlassCard className="flex flex-col items-center text-center py-12 gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
          <div className="space-y-1">
            <h2 className="text-white font-semibold">Syncing your data…</h2>
            <p className="text-muted text-sm">
              Your keyword rankings will appear here after the first sync.
              This usually takes a few minutes.
            </p>
          </div>
          <Link
            href="/dashboard/settings/integrations"
            className="text-brand-orange text-sm hover:underline flex items-center gap-1"
          >
            Sync manually <ArrowRight className="w-3 h-3" />
          </Link>
        </GlassCard>
      </div>
    )
  }

  // ── Compute summary stats ─────────────────────────────────────────────────
  const totalClicks = rankings.reduce((s, r) => s + r.clicks, 0)
  const totalImpressions = rankings.reduce((s, r) => s + r.impressions, 0)
  const avgCtr =
    totalImpressions > 0 ? totalClicks / totalImpressions : 0
  const avgPosition =
    rankings.length > 0
      ? rankings.reduce((s, r) => s + r.position, 0) / rankings.length
      : 0

  const winningKeywords = rankings.filter((r) => r.position < 10).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-semibold text-2xl">Keywords</h1>
          <p className="text-muted text-sm mt-1">
            Last 28 days · {integration.gscSiteUrl}
          </p>
        </div>
        {winningKeywords > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            {winningKeywords} keyword{winningKeywords !== 1 ? 's' : ''} in top 10
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Total Clicks"
          value={formatNumber(totalClicks)}
          icon={MousePointerClick}
        />
        <MetricCard
          label="Total Impressions"
          value={formatNumber(totalImpressions)}
          icon={Eye}
        />
        <MetricCard
          label="Avg. CTR"
          value={formatCtr(avgCtr)}
          icon={BarChart2}
        />
        <MetricCard
          label="Avg. Position"
          value={formatPosition(avgPosition)}
          icon={TrendingUp}
          sub={avgPosition < 10 ? 'Top 10 — great!' : avgPosition <= 30 ? 'Page 1–3' : 'Beyond page 3'}
        />
      </div>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-medium text-sm">
            Top Keywords{' '}
            <span className="text-muted font-normal">
              ({rankings.length} keywords)
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[
                  { label: 'Keyword', className: 'text-left pl-5 pr-4 py-3' },
                  { label: 'Clicks', className: 'text-right px-4 py-3' },
                  { label: 'Impressions', className: 'text-right px-4 py-3' },
                  { label: 'CTR', className: 'text-right px-4 py-3' },
                  { label: 'Position', className: 'text-right px-4 py-3 pr-5' },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`${col.className} text-muted text-xs font-medium uppercase tracking-wider whitespace-nowrap`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, idx) => {
                const isWinning = row.position < 10
                return (
                  <tr
                    key={idx}
                    className={`border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02] ${
                      isWinning ? 'bg-green-500/[0.02]' : ''
                    }`}
                  >
                    {/* Keyword */}
                    <td className="pl-5 pr-4 py-3 max-w-[260px]">
                      <div className="flex items-center gap-2">
                        {isWinning && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        )}
                        <span
                          className={`truncate text-sm ${
                            isWinning ? 'text-white font-medium' : 'text-white/80'
                          }`}
                          title={row.query}
                        >
                          {row.query}
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
                      <span className="text-muted font-mono text-xs">
                        {row.impressions.toLocaleString()}
                      </span>
                    </td>

                    {/* CTR */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-white/70 font-mono text-xs">
                        {formatCtr(row.ctr)}
                      </span>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3 pr-5 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-mono text-xs font-medium ${positionColor(row.position)} ${positionBg(row.position)}`}
                      >
                        {formatPosition(row.position)}
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
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            Position &lt;10 (page 1 top)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            Position 10–30
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            Position &gt;30
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
