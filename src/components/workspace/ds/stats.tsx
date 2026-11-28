"use client"

import type { ReactNode } from "react"
import { Skeleton } from "./skeleton"

// One number with its label. `value: null` = nothing measured yet (shows "Not measured yet", never 0).
// delta: a short change, e.g. { text: "12%", dir: "up" }. "flat" = no change. Green means good:
// up is good by default; pass good: false for "up is bad" (cost per lead), good: true for "down is good".
export type Delta = { text: string; dir: "up" | "down" | "flat"; good?: boolean }

export function StatTile({ label, value, delta, hint, ghost = false, soft = false, onClick, href, empty = "Not measured yet", icon }: {
  label: ReactNode
  value: ReactNode | null | undefined
  delta?: Delta | null
  hint?: ReactNode
  /** Loading skeleton. */
  ghost?: boolean
  /** Flat tinted tile (inside another card). */
  soft?: boolean
  onClick?: () => void
  href?: string
  empty?: string
  icon?: ReactNode
}) {
  const cls = `xd-stat${soft ? " soft" : ""}`
  const body = ghost ? (
    <>
      <Skeleton kind="line" width="50%" />
      <Skeleton kind="line" width="70%" height={26} />
    </>
  ) : (
    <>
      <div className="xd-stat__k">{icon}{label}</div>
      <div className="xd-stat__v">
        {value == null || value === "" ? <b className="none" style={{ fontSize: "var(--x-fs-md)" }}>{empty}</b> : <b>{value}</b>}
        {delta && <span className={`xd-delta ${delta.dir === "flat" ? "flat" : (delta.good ?? delta.dir === "up") ? "up" : "down"}`}>{delta.dir === "up" ? "↑" : delta.dir === "down" ? "↓" : ""}{delta.text}</span>}
      </div>
      {hint && <div className="xd-stat__h">{hint}</div>}
    </>
  )
  if (ghost) return <div className={cls} aria-busy="true">{body}</div>
  if (href) return <a className={cls} href={href}>{body}</a>
  if (onClick) return <button type="button" className={cls} onClick={onClick}>{body}</button>
  return <div className={cls}>{body}</div>
}

/** Auto-fit grid of StatTiles; 2 columns under 480px. `min` = smallest tile width on desktop. */
export function StatRow({ children, min }: { children: ReactNode; min?: number }) {
  return <div className="xd-stats" style={min ? { gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` } : undefined}>{children}</div>
}
