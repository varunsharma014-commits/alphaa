"use client"

import { useEffect, useRef, useState } from "react"

// How many of the 4 AIs named the business at each weekly check, oldest first. Drawn at the
// container's real width so the axis text stays readable on a phone. Shown only before the
// weekly question share of voice has two weeks of data.
export interface TrendPoint { at: string; pct: number }

const H = 180, L = 40, R = 14, T = 12, B = 28
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })

export function VisibilityTrend({ points }: { points: TrendPoint[] }) {
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(720)
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  if (points.length < 2) return null
  const n = points.length
  const x = (i: number) => L + (i / (n - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - v / 100) * (H - T - B)
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(" ")
  const area = `${line} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const every = Math.max(1, Math.ceil(n / (W < 480 ? 3 : 6)))
  const first = points[0].pct, last = points[n - 1].pct
  return (
    <div ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`AIs naming you: ${last}% at the newest check, ${first}% on ${fmt(points[0].at)}.`} className="xp-trend">
        {[0, 50, 100].map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="xp-trend__grid" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="xp-trend__tx">{t}%</text>
          </g>
        ))}
        <path d={area} className="xp-trend__area" />
        <path d={line} className="xp-trend__line" />
        {points.map((p, i) => (
          <g key={p.at}>
            <circle cx={x(i)} cy={y(p.pct)} r={3.5} className="xp-trend__dot" />
            {(i % every === 0 && n - 1 - i >= Math.ceil(every / 2)) || i === n - 1 ? <text x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="xp-trend__tx">{fmt(p.at)}</text> : null}
          </g>
        ))}
      </svg>
    </div>
  )
}
