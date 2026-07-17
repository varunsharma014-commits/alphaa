// Share-of-voice trend: % of the 4 AI engines mentioning the business at each
// weekly scan. Pure-SVG server component — no chart library, no client JS.

export interface TrendPoint {
  date: Date
  appearedCount: number // 0–4 engines that mentioned the business
  totalEngines: number
}

const W = 832
const H = 180
const PAD_L = 40
const PAD_R = 16
const PAD_T = 16
const PAD_B = 28

export function VisibilityTrend({ points }: { points: TrendPoint[] }) {
  // A trend needs at least two scans; the page hides this component otherwise,
  // but guard anyway so a direct render can't divide by zero.
  if (points.length < 2) return null

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B

  const x = (i: number) => PAD_L + (i / (points.length - 1)) * plotW
  const y = (pct: number) => PAD_T + (1 - pct / 100) * plotH

  const pcts = points.map((p) =>
    p.totalEngines > 0 ? Math.round((p.appearedCount / p.totalEngines) * 100) : 0
  )

  const linePath = pcts
    .map((pct, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(pct).toFixed(1)}`)
    .join(" ")
  const areaPath = `${linePath} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`

  const first = pcts[0]
  const last = pcts[pcts.length - 1]
  const delta = last - first

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  // Label at most ~6 x-axis ticks so long histories don't overlap.
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "8px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>
          Your AI share of voice over time
        </span>
        <span
          style={{
            fontSize: "12px",
            color: delta > 0 ? "var(--ds-ok)" : delta < 0 ? "var(--ds-bad)" : "var(--ds-text-mute)",
          }}
        >
          {delta > 0 ? `▲ up ${delta} pts` : delta < 0 ? `▼ down ${Math.abs(delta)} pts` : "holding steady"}{" "}
          since {fmt(points[0].date)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Share of voice trend from ${first}% to ${last}% across ${points.length} scans`}
      >
        {/* Gridlines at 0/50/100% */}
        {[0, 50, 100].map((pct) => (
          <g key={pct}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(pct)}
              y2={y(pct)}
              stroke="var(--ds-text)"
              strokeOpacity={0.07}
            />
            <text
              x={PAD_L - 8}
              y={y(pct) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--ds-text-soft)"
            >
              {pct}%
            </text>
          </g>
        ))}

        <path d={areaPath} fill="var(--ds-accent)" fillOpacity={0.12} />
        <path d={linePath} fill="none" stroke="var(--ds-accent)" strokeWidth={2} strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.date.getTime()}>
            <circle cx={x(i)} cy={y(pcts[i])} r={3.5} fill="var(--ds-accent)" />
            {i % labelEvery === 0 || i === points.length - 1 ? (
              <text
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ds-text-soft)"
              >
                {fmt(p.date)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "6px" }}>
        Share of voice = the portion of the 4 AI engines (ChatGPT, Claude, Gemini,
        Perplexity) that mention your business when asked. Updated with every weekly scan.
      </p>
    </div>
  )
}
