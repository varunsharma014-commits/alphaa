// The rescheduling rules (pure, tested in scripts/test-calendar.ts).
// - Past times are refused, and nothing goes out sooner than MIN_LEAD (the publishers run every 10 minutes).
// - Autopilot stop window: something Autopilot put on the schedule without the owner's OK gives them
//   STOP_WINDOW to see and stop it (72h from when it was scheduled). Moving it earlier than that
//   needs the owner's explicit OK (`confirm`), which is then recorded on the item (`ownerOk`).
// - When Autopilot is off, or the item was waiting for the owner (a draft), the owner moving it IS
//   the OK: it goes on the schedule at that time, no extra question.

export const MIN_LEAD_MS = 5 * 60_000
export const STOP_WINDOW_MS = 72 * 3_600_000
export const MAX_AHEAD_MS = 400 * 86_400_000

export type MoveInput = {
  now: number
  target: number
  /** Autopilot on with a current consent. */
  autopilotOn: boolean
  status: "draft" | "scheduled"
  /** The owner already approved this item (moved it, approved it, or confirmed an early time). */
  ownerOk: boolean
  /** End of the stop window, when Autopilot scheduled it on its own. null = none known/applies. */
  windowEnd: number | null
  confirm?: boolean
}

export type MoveDecision =
  | { ok: true; ownerOk: boolean; approves: boolean }
  | { ok: false; reason: "past" | "too_soon" | "too_far" | "window"; earliest: number | null; message: string }

export function decideMove(i: MoveInput, label: (t: number) => string = (t) => new Date(t).toISOString()): MoveDecision {
  if (!Number.isFinite(i.target)) return { ok: false, reason: "past", earliest: null, message: "Pick a date and time." }
  if (i.target < i.now) return { ok: false, reason: "past", earliest: i.now + MIN_LEAD_MS, message: "That time has already passed. Pick a time from now on." }
  if (i.target < i.now + MIN_LEAD_MS) return { ok: false, reason: "too_soon", earliest: i.now + MIN_LEAD_MS, message: "Give me at least 5 minutes, so I can get it ready." }
  if (i.target > i.now + MAX_AHEAD_MS) return { ok: false, reason: "too_far", earliest: null, message: "That’s more than a year away. Pick a closer date." }
  // A draft is waiting for the owner: moving it onto the calendar is their OK.
  if (i.status === "draft") return { ok: true, ownerOk: true, approves: true }
  // Autopilot off: it only goes out because the owner says so, and this move says so.
  if (!i.autopilotOn) return { ok: true, ownerOk: true, approves: !i.ownerOk }
  if (i.ownerOk) return { ok: true, ownerOk: true, approves: false }
  const end = i.windowEnd
  if (end != null && end > i.now && i.target < end) {
    if (!i.confirm) return { ok: false, reason: "window", earliest: end, message: `Autopilot gives you until ${label(end)} to stop this. Moving it earlier means it goes out before then. Is that OK?` }
    return { ok: true, ownerOk: true, approves: true }
  }
  return { ok: true, ownerOk: false, approves: false }
}

/** Stop window end for an Autopilot-scheduled item: stored, else 72h after it was created. */
export function windowEndFor(stopUntil: string | null | undefined, createdAt: Date | string | number): number {
  const s = stopUntil ? Date.parse(stopUntil) : NaN
  if (Number.isFinite(s)) return s
  const c = typeof createdAt === "number" ? createdAt : typeof createdAt === "string" ? Date.parse(createdAt) : createdAt.getTime()
  return c + STOP_WINDOW_MS
}
