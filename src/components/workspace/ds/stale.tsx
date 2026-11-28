"use client"

import { useEffect, useState } from "react"
import { isStale } from "@/lib/workspace/stale"
import { ago } from "@/lib/workspace/common"
import { Pill } from "./pill"
import { Button } from "./button"

export { isStale }

/** "3h ago" / "on Mon" / "on Jul 4", so it reads after "Checked". */
export function sinceText(at: string): string {
  const a = ago(at)
  return /ago$|just now/.test(a) ? a : `on ${a}`
}

// Shows only when data is older than twice its schedule: "Last checked 3 weeks ago" + a re-run.
// Renders nothing for fresh data, so it's safe to always include.
export function StaleBadge({ at, scheduleDays, onRerun, rerunLabel = "Check again", busy = false, always = false }: {
  at: string | null | undefined
  /** How often this normally refreshes, in days (weekly = 7). */
  scheduleDays: number
  onRerun?: () => void
  rerunLabel?: string
  busy?: boolean
  /** Also show the plain "Checked …" line when fresh. */
  always?: boolean
}) {
  // Rendered on the client so "ago" uses the viewer's clock, not the server's.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => { setNow(Date.now()) }, [])
  if (!at || now == null) return null
  const stale = isStale(at, scheduleDays, now)
  if (!stale && !always) return null
  return (
    <span className="xd-stale">
      {stale ? <Pill tone="warn" dot>Last checked {sinceText(at)}</Pill> : <span className="ax-t11">Checked {sinceText(at)}</span>}
      {stale && onRerun && <Button size="sm" onClick={onRerun} loading={busy}>{rerunLabel}</Button>}
    </span>
  )
}
