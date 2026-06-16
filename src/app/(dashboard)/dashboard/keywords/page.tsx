export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { RefreshCw } from 'lucide-react'
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

  // ── No data yet (Search Console not synced, or no rows returned) ────────────
  if (!integration || !hasGsc || rankings.length === 0) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <AutopilotBar message="alphaa pulls your keyword data from Google automatically every week" />
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
            title="Syncing your keyword data from Google"
            body="This takes a few minutes the first time. We will show your rankings as soon as they are ready."
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
      <AutopilotBar message="alphaa pulls your keyword data from Google automatically every week" />
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
        <StatBox value={formatNumber(totalClicks)} label="Clicks this month" />
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

                  {/* Change — no historical delta available in current sync */}
                  <td style={{ padding: '12px 16px', color: '#555555' }}>—</td>

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
