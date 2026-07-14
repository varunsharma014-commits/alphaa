export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Link from 'next/link'
import { RefreshCw, Globe } from 'lucide-react'
import { AutopilotBar } from '@/components/dashboard/AutopilotBar'
import { StatBox } from '@/components/dashboard/StatBox'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { SectionDivider } from '@/components/dashboard/SectionDivider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeywordRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  prevPosition: number | null // from the batch ~7+ days earlier; null = new/no baseline
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPosition(pos: number): string {
  return pos.toFixed(1)
}

// Position = colored number: green if <=10, amber 11-30, red if >30.
function positionColor(pos: number): string {
  if (pos <= 10) return '#22c55e'
  if (pos <= 30) return '#f59e0b'
  return '#dc2626'
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
    include: { integration: true },
  })

  const integration = user?.integration ?? null
  const hasGsc = !!(integration?.gscSiteUrl)

  // Rankings come in daily batches (one set of rows per sync date). Show only
  // the LATEST batch, and compare against a batch ~7+ days earlier for deltas.
  let rankings: KeywordRow[] = []
  if (user) {
    const batches = await db.keywordRanking.groupBy({
      by: ['date'],
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 30,
    })
    if (batches.length > 0) {
      const latestDate = batches[0].date
      const weekAgo = new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      const baselineDate =
        batches.length > 1
          ? (batches.find((b) => b.date <= weekAgo)?.date ?? batches[batches.length - 1].date)
          : null

      const [currRows, prevRows] = await Promise.all([
        db.keywordRanking.findMany({
          where: { userId: user.id, date: latestDate },
          orderBy: { impressions: 'desc' },
          take: 50,
        }),
        baselineDate && baselineDate.getTime() !== latestDate.getTime()
          ? db.keywordRanking.findMany({ where: { userId: user.id, date: baselineDate } })
          : Promise.resolve([]),
      ])
      const prevByQuery = new Map(prevRows.map((r) => [r.query, r.position]))
      rankings = currRows.map((r) => ({
        query: r.query,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        prevPosition: prevByQuery.get(r.query) ?? null,
      }))
    }
  }

  // Header (shared across all states)
  const header = (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#ffffff' }}>
        Google rankings
      </h1>
      <p style={{ fontSize: '13px', color: '#888888', marginTop: '4px', lineHeight: 1.6 }}>
        Keywords people use to find businesses like yours — and where you rank.
      </p>
      <p style={{ fontSize: '12px', color: '#555555', marginTop: '8px', lineHeight: 1.6 }}>
        Google rankings still matter — but AI visibility is where new customers increasingly come from.
      </p>
    </div>
  )

  // ── Google not connected yet — be honest, don't pretend a sync is running ──
  if (!integration || !hasGsc) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <AutopilotBar message="Connect Google once and alphaa tracks your rankings automatically from then on" />
        {header}
        <div
          style={{
            background: '#161616',
            border: '0.5px solid #222222',
            borderRadius: '10px',
          }}
        >
          <EmptyState
            icon={Globe}
            title="Connect Google to see your rankings"
            body="Your rankings live in Google's search data. Connect your Google account once and alphaa pulls in every keyword people use to find you — updated daily, nothing else to do."
          >
            <Link
              href="/dashboard/settings/integrations"
              style={{
                background: '#e05a2b',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-block',
                textDecoration: 'none',
              }}
            >
              Connect Google →
            </Link>
          </EmptyState>
        </div>
      </div>
    )
  }

  // ── Connected but no rows yet — the first sync really is on its way ────────
  if (rankings.length === 0) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <AutopilotBar message="alphaa pulls your keyword data from Google automatically every day" />
        {header}
        <div
          style={{
            background: '#161616',
            border: '0.5px solid #222222',
            borderRadius: '10px',
          }}
        >
          <EmptyState
            icon={RefreshCw}
            title="Google is connected — your first keyword sync is on its way"
            body="alphaa syncs your rankings from Google every morning. Your keywords appear here after the first sync — nothing for you to do."
            sub="If nothing shows after a day or two, your website may be new to Google's search data — alphaa keeps checking automatically."
          />
        </div>
      </div>
    )
  }

  // ── Compute summary stats ─────────────────────────────────────────────────
  const totalClicks = rankings.reduce((s, r) => s + r.clicks, 0)
  const totalKeywords = rankings.length
  const avgPosition =
    totalKeywords > 0
      ? rankings.reduce((s, r) => s + r.position, 0) / totalKeywords
      : 0
  const top10 = rankings.filter((r) => r.position <= 10).length

  // Best performer = lowest (best) position
  const best = rankings.reduce(
    (b, r) => (r.position < b.position ? r : b),
    rankings[0]
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <AutopilotBar message="alphaa pulls your keyword data from Google automatically every day" />
      {header}

      {/* Plain-English summary line */}
      <p
        style={{
          fontSize: '13px',
          color: '#888888',
          lineHeight: 1.6,
          marginBottom: '16px',
        }}
      >
        You rank for{' '}
        <span style={{ color: '#ffffff', fontWeight: 500 }}>
          {totalKeywords} keyword{totalKeywords !== 1 ? 's' : ''}
        </span>
        . Your best performer is{' '}
        <span style={{ color: '#ffffff', fontWeight: 500 }}>“{best.query}”</span>{' '}
        at position{' '}
        <span style={{ color: positionColor(best.position), fontWeight: 500 }}>
          {formatPosition(best.position)}
        </span>
        .
      </p>

      {/* StatBox row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        <StatBox value={totalKeywords} label="Keywords tracked" />
        <StatBox
          value={formatPosition(avgPosition)}
          label="Average position"
          tone={avgPosition <= 10 ? 'success' : avgPosition <= 30 ? 'warning' : 'danger'}
        />
        <StatBox value={top10} label="In top 10" tone="success" />
        <StatBox value={formatNumber(totalClicks)} label="Visits from Google (last 28 days)" />
      </div>

      <SectionDivider>YOUR KEYWORDS</SectionDivider>

      {/* Keywords table */}
      <div
        style={{
          background: '#161616',
          border: '0.5px solid #222222',
          borderRadius: '10px',
          overflow: 'hidden',
          marginTop: '12px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222222' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#444444',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Keyword
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#444444',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Position
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#444444',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Change
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '12px 16px',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#444444',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom:
                      idx === rankings.length - 1 ? 'none' : '1px solid #1a1a1a',
                  }}
                >
                  {/* Keyword */}
                  <td
                    style={{
                      padding: '12px 16px',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#ffffff',
                    }}
                    title={row.query}
                  >
                    {row.query}
                  </td>

                  {/* Position — colored number */}
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontWeight: 500,
                        color: positionColor(row.position),
                      }}
                    >
                      {formatPosition(row.position)}
                    </span>
                  </td>

                  {/* Change vs the batch ~7 days earlier (lower position = better) */}
                  <td style={{ padding: '12px 16px' }}>
                    {row.prevPosition === null ? (
                      <span style={{ color: '#555555' }}>—</span>
                    ) : Math.round(row.prevPosition) === Math.round(row.position) ? (
                      <span style={{ color: '#555555' }}>steady</span>
                    ) : row.position < row.prevPosition ? (
                      <span style={{ color: '#22c55e', fontWeight: 500 }}>
                        ↑ {formatPosition(row.prevPosition)} → {formatPosition(row.position)}
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>
                        ↓ {formatPosition(row.prevPosition)} → {formatPosition(row.position)}
                      </span>
                    )}
                  </td>

                  {/* Clicks */}
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: '#888888',
                    }}
                  >
                    {row.clicks.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
