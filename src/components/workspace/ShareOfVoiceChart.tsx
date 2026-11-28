"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { SovData } from "@/lib/ai-sources"

// Share of voice over time: % of AI answers naming the owner vs the top competitors, one point per
// weekly question scan. Categorical slots in fixed order (owner = slot 1 blue, always), validated
// with the dataviz validator on white (3 slots sit under 3:1 contrast → legend + table view).
// Works in both the workspace (--x-*) and the older dashboard pages (--ds-*).
const SLOTS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"]
const INK = "var(--x-ink, var(--ds-text, #1d1d1f))"
const MUT = "var(--x-mut, var(--ds-text-mute, #6e6e73))"
const LINE = "var(--x-line, rgba(0,0,0,.08))"
const SURF = "var(--x-surf, var(--ds-surface, #fff))"

const H = 240, L = 40, R = 16, T = 14, B = 30

const fmtWeek = (w: string) => new Date(`${w}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

export function ShareOfVoiceChart({ data }: { data: SovData }) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  // Draw at the container's real width so axis text stays 11px on a phone.
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(720)
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [table])
  const weeks = data.weeks
  const n = weeks.length
  const max = useMemo(() => {
    const top = Math.max(5, ...data.series.flatMap((s) => s.points.map((p) => p.share ?? 0)))
    return top <= 25 ? 25 : top <= 50 ? 50 : 100
  }, [data])
  if (n < 2) return null

  const x = (i: number) => L + (i / (n - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - v / max) * (H - T - B)
  const ticks = [0, max / 2, max]
  const every = Math.max(1, Math.ceil(n / (W < 480 ? 3 : 6)))
  const own = data.series[0]
  const first = own.points[0]?.share ?? 0
  const last = own.points[n - 1]?.share ?? 0
  const summary = `${own.name}: named in ${last}% of AI answers in the week of ${fmtWeek(weeks[n - 1].week)}, ${first}% in the week of ${fmtWeek(weeks[0].week)}. ${data.series.slice(1).map((s) => `${s.name} ${s.points[n - 1]?.share ?? 0}%`).join(", ")}.`

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginBottom: 10 }} aria-label="Legend">
        {data.series.map((s, i) => (
          <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: INK, fontWeight: s.own ? 650 : 500 }}>
            <span aria-hidden="true" style={{ width: 14, height: s.own ? 4 : 2, borderRadius: 2, background: SLOTS[i] }} />
            {s.own ? `${s.name} (you)` : s.name}
            <span style={{ color: MUT, fontWeight: 500 }}>{s.points[n - 1]?.share ?? 0}%</span>
          </span>
        ))}
        <button type="button" className="ax-lnk" style={{ marginLeft: "auto", fontSize: 12.5 }} onClick={() => setTable(!table)} aria-pressed={table}>{table ? "Show chart" : "Show as table"}</button>
      </div>

      {table ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <caption style={{ textAlign: "left", fontSize: 12, color: MUT, marginBottom: 6 }}>Share of AI answers naming each business, by week</caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", padding: "6px 8px", color: MUT, fontWeight: 600, borderBottom: `1px solid ${LINE}` }}>Week of</th>
                <th scope="col" style={{ textAlign: "right", padding: "6px 8px", color: MUT, fontWeight: 600, borderBottom: `1px solid ${LINE}` }}>Answers</th>
                {data.series.map((s) => <th key={s.key} scope="col" style={{ textAlign: "right", padding: "6px 8px", color: MUT, fontWeight: 600, borderBottom: `1px solid ${LINE}` }}>{s.own ? `${s.name} (you)` : s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {weeks.map((w, i) => (
                <tr key={w.week}>
                  <th scope="row" style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500, color: INK, borderBottom: `1px solid ${LINE}` }}>{fmtWeek(w.week)}</th>
                  <td style={{ textAlign: "right", padding: "6px 8px", color: MUT, borderBottom: `1px solid ${LINE}` }}>{w.answers}</td>
                  {data.series.map((s) => <td key={s.key} style={{ textAlign: "right", padding: "6px 8px", color: INK, fontVariantNumeric: "tabular-nums", borderBottom: `1px solid ${LINE}` }}>{s.points[i]?.share ?? 0}% <span style={{ color: MUT }}>({s.points[i]?.count ?? 0})</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={box} style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={summary} style={{ display: "block", overflow: "visible" }} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={LINE} strokeWidth={1} />
                <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={MUT}>{t}%</text>
              </g>
            ))}
            {weeks.map((w, i) => ((i % every === 0 && n - 1 - i >= Math.ceil(every / 2) + (W < 480 ? 1 : 0)) || i === n - 1) && (
              <text key={w.week} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={MUT}>{fmtWeek(w.week)}</text>
            ))}
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke={MUT} strokeWidth={1} strokeDasharray="3 3" />}
            {/* Rivals first, the owner's line on top. */}
            {[...data.series.map((s, i) => ({ s, i }))].reverse().map(({ s, i }) => (
              <g key={s.key}>
                <path d={s.points.map((p, k) => `${k ? "L" : "M"}${x(k).toFixed(1)},${y(p.share ?? 0).toFixed(1)}`).join(" ")} fill="none" stroke={SLOTS[i]} strokeWidth={s.own ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" />
                {s.points.map((p, k) => (
                  <circle key={k} cx={x(k)} cy={y(p.share ?? 0)} r={hover === k ? 5 : s.own ? 4 : 3} fill={SLOTS[i]} stroke={SURF} strokeWidth={2} />
                ))}
              </g>
            ))}
            {/* Hit areas: one column per week, wider than the marks. */}
            {weeks.map((w, i) => {
              const half = (W - L - R) / (n - 1) / 2
              return <rect key={w.week} x={x(i) - half} y={T} width={half * 2} height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
            })}
          </svg>
          {hover != null && (
            <div role="status" style={{ position: "absolute", top: 4, left: `${(x(hover) / W) * 100}%`, transform: hover > n / 2 ? "translateX(calc(-100% - 10px))" : "translateX(10px)", background: SURF, border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.12)", padding: "8px 10px", fontSize: 12, color: INK, pointerEvents: "none", minWidth: 170, zIndex: 2 }}>
              <div style={{ fontWeight: 650, marginBottom: 4 }}>Week of {fmtWeek(weeks[hover].week)} · {weeks[hover].answers} answers</div>
              {data.series.map((s, i) => ({ s, i, v: s.points[hover]?.share ?? 0, c: s.points[hover]?.count ?? 0 })).sort((a, b) => b.v - a.v).map(({ s, i, v, c }) => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: SLOTS[i] }} />{s.own ? `${s.name} (you)` : s.name}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{v}% <span style={{ color: MUT }}>({c})</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
