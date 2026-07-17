import { DsCard } from "@/components/dashboard/DsCard"
import { TrendingUp, TrendingDown, Clock } from "lucide-react"

// "Proof it's working" — renders ONLY real measured trends. Every section
// requires >= 2 real data points; anything without history shows the honest
// building-your-baseline state instead. Never fabricates a delta.

export interface AuditPoint {
  score: number
  createdAt: Date
  appeared: number // engines that mentioned the business in this check
  total: number    // engines checked
}

export interface KeywordDelta {
  query: string
  prev: number
  curr: number
}

function Sparkline({ points }: { points: number[] }) {
  const w = 220
  const h = 44
  const pad = 4
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => {
    const x = pad + i * step
    const y = h - pad - ((p - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const last = coords[coords.length - 1].split(",")
  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: "block" }}>
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="var(--ds-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill="var(--ds-accent)" />
    </svg>
  )
}

export function ProgressCard({
  auditPoints,
  improved,
  declined,
}: {
  auditPoints: AuditPoint[] // oldest → newest
  improved: KeywordDelta[]
  declined: KeywordDelta[]
}) {
  const hasScoreTrend = auditPoints.length >= 2
  const hasKeywordTrend = improved.length > 0 || declined.length > 0

  // Engine-mention trend needs two checks that actually measured engines.
  const measured = auditPoints.filter((a) => a.total > 0)
  const hasMentionTrend = measured.length >= 2
  const firstMeasured = measured[0]
  const lastMeasured = measured[measured.length - 1]

  if (!hasScoreTrend && !hasKeywordTrend && !hasMentionTrend) {
    return (
      <DsCard>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--ds-surface)", border: "1px solid var(--ds-border-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={16} color="var(--ds-text-mute)" />
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>
              Building your baseline
            </p>
            <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "2px" }}>
              alphaa measures your AI visibility every Wednesday and your Google rankings
              daily. Once there are two data points, your trend appears here &mdash; real
              numbers, not promises.
            </p>
          </div>
        </div>
      </DsCard>
    )
  }

  const first = auditPoints[0]
  const latest = auditPoints[auditPoints.length - 1]
  const scoreDelta = hasScoreTrend ? latest.score - first.score : 0

  return (
    <DsCard style={{ padding: 0 }}>
      {/* Score trend */}
      {hasScoreTrend && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "16px 1.25rem", borderBottom: hasMentionTrend || hasKeywordTrend ? "0.5px solid var(--ds-border)" : "none", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ds-text-ghost)" }}>Presence score</p>
            <p style={{ fontSize: "22px", fontWeight: 600, color: "var(--ds-text)", marginTop: "4px" }}>
              {first.score} <span style={{ color: "var(--ds-text-faint)", fontWeight: 400 }}>→</span> {latest.score}
              {scoreDelta !== 0 && (
                <span style={{ fontSize: "13px", marginLeft: "8px", color: scoreDelta > 0 ? "var(--ds-ok)" : "var(--ds-bad)" }}>
                  {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} since you joined
                </span>
              )}
            </p>
          </div>
          <Sparkline points={auditPoints.map((a) => a.score)} />
        </div>
      )}

      {/* Engine mentions trend */}
      {hasMentionTrend && (
        <div style={{ padding: "14px 1.25rem", borderBottom: hasKeywordTrend ? "0.5px solid var(--ds-border)" : "none" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ds-text-ghost)" }}>AI engines mentioning you</p>
          <p style={{ fontSize: "14px", color: "var(--ds-text)", marginTop: "4px" }}>
            {lastMeasured.appeared} of {lastMeasured.total} in the latest check
            {lastMeasured.appeared !== firstMeasured.appeared && (
              <span style={{ fontSize: "12px", marginLeft: "8px", color: lastMeasured.appeared > firstMeasured.appeared ? "var(--ds-ok)" : "var(--ds-text-mute)" }}>
                {lastMeasured.appeared > firstMeasured.appeared ? "↑" : "↓"} was {firstMeasured.appeared} of {firstMeasured.total} at your first check
              </span>
            )}
          </p>
        </div>
      )}

      {/* Keyword movers */}
      {hasKeywordTrend && (
        <div style={{ padding: "14px 1.25rem" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ds-text-ghost)", marginBottom: "8px" }}>
            Google ranking moves this week
          </p>
          {improved.map((k) => (
            <div key={k.query} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0" }}>
              <TrendingUp size={14} color="var(--ds-ok)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "var(--ds-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                &ldquo;{k.query}&rdquo;
              </span>
              <span style={{ fontSize: "12px", color: "var(--ds-ok)", flexShrink: 0 }}>
                #{k.prev} → #{k.curr}
              </span>
            </div>
          ))}
          {declined.map((k) => (
            <div key={k.query} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0" }}>
              <TrendingDown size={14} color="var(--ds-text-mute)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "var(--ds-text-mute)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                &ldquo;{k.query}&rdquo;
              </span>
              <span style={{ fontSize: "12px", color: "var(--ds-text-mute)", flexShrink: 0 }}>
                #{k.prev} → #{k.curr}
              </span>
            </div>
          ))}
        </div>
      )}
    </DsCard>
  )
}
