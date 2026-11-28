// "Best time to post" (pure; the data loading is in best-time-data.ts). Three honest sources,
// best first, each labelled for the owner:
//   yours   = their own published posts' results (LinkedIn Page, Instagram, Facebook Page; lib/social/stats.ts)
//   site    = when people visit their website (GA4 sessions by weekday + hour, last 8 weeks)
//   typical = general guidance per platform. Never shown as "your data".
// Hours and weekdays are in the owner's time zone.
import { addDays, dateKey, DAY_SHORT, dowOfKey, hourLabel, parseKey, zonedParts, zonedToUtc } from "./tz"
import { MIN_LEAD_MS } from "./rules"

export type Channel = "facebook" | "instagram" | "linkedin" | "tiktok" | "x" | "google" | "site" | "email"
export const CHANNELS: Channel[] = ["facebook", "instagram", "linkedin", "tiktok", "x", "google", "site", "email"]
export const CHANNEL_NAME: Record<Channel, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok", x: "X", google: "Google listing", site: "Website", email: "Email" }

export type Slot = { dow: number; hour: number }
export type Best = {
  channel: Channel
  source: "yours" | "site" | "typical"
  /** One line for the owner saying where this comes from. */
  label: string
  /** Ranked local hours and weekdays, best first. */
  hours: number[]
  days: number[]
  slots: Slot[]
}
export type BestTimes = { at: string; tz: string; channels: Partial<Record<Channel, Best>> }

// General guidance (not the owner's data): weekday mornings for business audiences, lunch and
// early evening for consumer apps, emails mid-morning early in the week.
const TYPICAL: Record<Channel, { days: number[]; hours: number[] }> = {
  facebook: { days: [2, 3, 4, 1, 5], hours: [9, 13, 11] },
  instagram: { days: [2, 3, 4, 1, 5], hours: [11, 14, 9] },
  linkedin: { days: [2, 3, 4, 1], hours: [9, 12, 8] },
  tiktok: { days: [2, 4, 5, 3], hours: [19, 12, 16] },
  x: { days: [2, 3, 4, 1], hours: [9, 12, 15] },
  google: { days: [1, 2, 4, 5], hours: [9, 10, 8] },
  site: { days: [2, 3, 4, 1], hours: [9, 10, 8] },
  email: { days: [2, 4, 3], hours: [10, 9, 13] },
}

const topSlots = (days: number[], hours: number[]): Slot[] => days.slice(0, 3).map((dow, i) => ({ dow, hour: hours[i === 2 && hours[1] != null ? 1 : 0] }))

export function typical(channel: Channel): Best {
  const t = TYPICAL[channel]
  return { channel, source: "typical", label: `Typical for ${CHANNEL_NAME[channel]} (general guidance, not your data)`, hours: t.hours, days: t.days, slots: topSlots(t.days, t.hours) }
}

const SANE = (h: number) => h >= 6 && h <= 21

/** Ranks keys by score, highest first. */
const rank = (scores: Map<number, number>) => [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([k]) => k)

export type PostPoint = { at: number; impressions: number; engagements: number }
export const MIN_POSTS = 6

/** From the owner's own post results: engagement rate by local hour and weekday. Null if too few. */
export function fromPosts(channel: Channel, posts: PostPoint[], tz: string, what: string): Best | null {
  const pts = posts.filter((p) => p.impressions > 0 && Number.isFinite(p.at))
  if (pts.length < MIN_POSTS) return null
  const byHour = new Map<number, number[]>(), byDay = new Map<number, number[]>()
  for (const p of pts) {
    const z = zonedParts(p.at, tz)
    const rate = p.engagements / p.impressions
    // Neighbouring hours share a little of the credit, so one post doesn't decide an hour alone.
    for (const [h, w] of [[z.h, 1], [z.h - 1, 0.5], [z.h + 1, 0.5]] as const) {
      if (h < 0 || h > 23) continue
      const a = byHour.get(h) ?? []
      a.push(rate * w)
      byHour.set(h, a)
    }
    const d = byDay.get(z.dow) ?? []
    d.push(rate)
    byDay.set(z.dow, d)
  }
  const mean = (m: Map<number, number[]>) => new Map([...m.entries()].map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]))
  const hours = rank(mean(byHour)).filter(SANE)
  const days = rank(mean(byDay))
  if (!hours.length || !days.length) return null
  const best = `${DAY_SHORT[days[0]]} around ${hourLabel(hours[0])}`
  return { channel, source: "yours", label: `Your data: from ${pts.length} of your ${what} posts, ${best} got the most engagement`, hours: hours.slice(0, 4), days, slots: topSlots(days, hours) }
}

/** A 7×24 grid of website sessions (dow × local hour). */
export type TrafficGrid = number[][]
export const MIN_SESSIONS = 300
export const MIN_SOCIAL_SESSIONS = 100

/** From website visits by weekday and hour (owner's zone). Null if too little traffic. */
export function fromTraffic(channel: Channel, grid: TrafficGrid, label: string, min = MIN_SESSIONS): Best | null {
  const total = grid.reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0)
  if (total < min) return null
  const hourScore = new Map<number, number>(), dayScore = new Map<number, number>()
  for (let h = 0; h < 24; h++) {
    let s = 0
    for (let d = 0; d < 7; d++) s += (grid[d]?.[h] ?? 0) + 0.5 * ((grid[d]?.[h - 1] ?? 0) + (grid[d]?.[h + 1] ?? 0))
    hourScore.set(h, s)
  }
  for (let d = 0; d < 7; d++) dayScore.set(d, (grid[d] ?? []).reduce((a, b) => a + b, 0))
  const hours = rank(hourScore).filter(SANE)
  const days = rank(dayScore)
  if (!hours.length) return null
  return { channel, source: "site", label: `${label}: busiest ${DAY_SHORT[days[0]]} around ${hourLabel(hours[0])}`, hours: hours.slice(0, 4), days, slots: topSlots(days, hours) }
}

/** Moves a grid from one zone's hours to another's (whole-hour shift, wrapping across days). */
export function shiftGrid(grid: TrafficGrid, shiftHours: number): TrafficGrid {
  const s = Math.round(shiftHours)
  if (!s) return grid
  const out: TrafficGrid = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
    const t = d * 24 + h + s
    const k = ((t % 168) + 168) % 168
    out[Math.floor(k / 24)][k % 24] += grid[d]?.[h] ?? 0
  }
  return out
}

/** The best entry for a post that goes to several platforms: someone's own data first. */
export function bestFor(times: BestTimes | null, channels: Channel[]): Best {
  const list = channels.map((c) => times?.channels[c] ?? typical(c))
  return list.find((b) => b.source === "yours") ?? list.find((b) => b.source === "site") ?? list[0] ?? typical("site")
}

/** The time to use on a given local day: that weekday's slot, else the best hour, still ahead of now. */
export function timeOnDay(best: Best, key: string, tz: string, now = Date.now(), lead = 15 * 60_000): Date | null {
  const dow = dowOfKey(key)
  const slot = best.slots.find((s) => s.dow === dow)
  const order = Array.from(new Set([...(slot ? [slot.hour] : []), ...best.hours]))
  const { y, m, d } = parseKey(key)
  for (const h of order) {
    const t = zonedToUtc({ y, m, d, h }, tz)
    if (t.getTime() >= now + lead) return t
  }
  return null
}

/** The next date (today counts) that falls on `dow`, at the best time; the next day if today's times have passed. */
export function nextOnWeekday(best: Best, dow: number, tz: string, now = Date.now()): Date {
  let key = dateKey(now, tz)
  for (let i = 0; i < 7 && dowOfKey(key) !== dow; i++) key = addDays(key, 1)
  for (let i = 0; i < 3; i++) {
    const t = timeOnDay(best, key, tz, now)
    if (t) return t
    key = addDays(key, 1)
  }
  return new Date(now + 3_600_000)
}

/** Upcoming suggested times for the picker, soonest first. */
export function nextSlots(best: Best, tz: string, now = Date.now(), n = 4): { at: string; label: string }[] {
  const wanted = new Set(best.slots.map((s) => `${s.dow}:${s.hour}`))
  const extra = new Set(best.days.slice(0, 3).flatMap((d) => best.hours.slice(0, 2).map((h) => `${d}:${h}`)))
  const out: { at: string; label: string; pri: number; t: number }[] = []
  let key = dateKey(now, tz)
  for (let i = 0; i < 15; i++, key = addDays(key, 1)) {
    const dow = dowOfKey(key)
    const { y, m, d } = parseKey(key)
    for (const h of best.hours.slice(0, 3)) {
      const k = `${dow}:${h}`
      if (!wanted.has(k) && !extra.has(k)) continue
      const t = zonedToUtc({ y, m, d, h }, tz).getTime()
      if (t < now + MIN_LEAD_MS) continue
      out.push({ at: new Date(t).toISOString(), label: `${DAY_SHORT[dow]} ${hourLabel(h)}`, pri: wanted.has(k) ? 0 : 1, t })
    }
  }
  const primary = out.filter((o) => o.pri === 0)
  const pick = (primary.length >= n ? primary : [...primary, ...out.filter((o) => o.pri === 1)]).slice(0, n)
  return pick.sort((a, b) => a.t - b.t).map(({ at, label }) => ({ at, label }))
}
