"use client"

// Setup progress, shown as steps rather than an empty bar: "Step 2 of 7" with one dot per step,
// and a checklist row per connection (done = check, next = the one button).
import type { ReactNode } from "react"
import { Glyph } from "./ui"
import "./briefing.css"

/** "Step n of total" with a dot per step (done, current, to do). */
export function StepDots({ n, total, label = "Setup" }: { n: number; total: number; label?: string }) {
  const safe = Math.max(1, Math.min(total, n))
  return (
    <span className="xb-steps" role="img" aria-label={`${label}: step ${safe} of ${total}`}>
      <span className="xb-steps__t">{label} · step {safe} of {total}</span>
      <span className="xb-steps__d" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <i key={i} className={i + 1 < safe ? "done" : i + 1 === safe ? "on" : ""} />)}
      </span>
    </span>
  )
}

/** One checklist row: a check when done, an open ring when not, and the action for the next one. */
export function ChecklistStep({ done, label, hint, action }: { done: boolean; label: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className={`xb-check${done ? " done" : ""}`} role="listitem">
      <span className="xb-check__ic" aria-hidden="true">{done ? <Glyph name="check" size={13} stroke={2.4} /> : null}</span>
      <div className="xb-check__b">
        <div className="xb-check__t">{label}<span className="sr-only">{done ? " (connected)" : " (not connected yet)"}</span></div>
        {hint && <div className="xb-check__h">{hint}</div>}
      </div>
      {action && <div className="xb-check__a">{action}</div>}
    </div>
  )
}
