// Page-level SEO decay (pure, client-safe, unit-tested in scripts/test-seo-upkeep.ts).
// Input: one Search Console snapshot = every page's clicks / impressions / position for the
// last 28 days and the 28 days before (lib/seo/page-stats.ts). Output: the pages that lost
// something meaningful, with the real numbers and dates as evidence.
//
// Thresholds are set so a tiny site's noise (3 clicks → 1) never shows up as "decay":
//   clicks:      ≥ 10 clicks before, down ≥ 30% AND by ≥ 5 clicks
//   impressions: ≥ 200 before, down ≥ 30% AND by ≥ 100
//   position:    ≥ 50 impressions in both windows, was on pages 1-3 (≤ 30), now ≥ 3 places lower

export type Win = { start: string; end: string }
export type PageStat = {
  page: string
  clicks: number
  impressions: number
  position: number
  /** The previous 28 days. */
  pClicks: number
  pImpressions: number
  pPosition: number
}
export type PageSnapshot = { cur: Win; prev: Win; at: string; rows: PageStat[] }

export const DECAY = {
  minPrevClicks: 10,
  clickDropPct: 0.3,
  minClickLoss: 5,
  minPrevImpressions: 200,
  impressionDropPct: 0.3,
  minImpressionLoss: 100,
  minPositionImpressions: 50,
  positionDrop: 3,
  maxPrevPosition: 30,
} as const

export type DecaySignal =
  | { kind: "clicks"; before: number; after: number; pct: number }
  | { kind: "impressions"; before: number; after: number; pct: number }
  | { kind: "position"; before: number; after: number }

export type DecayingPage = {
  page: string
  path: string
  signals: DecaySignal[]
  /** Clicks lost vs the previous 4 weeks (0 when only impressions/position moved). */
  lostClicks: number
  score: number
  stat: PageStat
}

const pct = (before: number, after: number) => (before > 0 ? (before - after) / before : 0)

export function pathOf(url: string): string {
  try {
    const u = new URL(url)
    return decodeURIComponent(u.pathname) || "/"
  } catch {
    return url
  }
}

/** Every meaningful loss on one page, or [] when it's holding up (or too small to tell). */
export function signalsFor(r: PageStat, t = DECAY): DecaySignal[] {
  const out: DecaySignal[] = []
  if (r.pClicks >= t.minPrevClicks && pct(r.pClicks, r.clicks) >= t.clickDropPct && r.pClicks - r.clicks >= t.minClickLoss) {
    out.push({ kind: "clicks", before: r.pClicks, after: r.clicks, pct: Math.round(pct(r.pClicks, r.clicks) * 100) })
  }
  if (r.pImpressions >= t.minPrevImpressions && pct(r.pImpressions, r.impressions) >= t.impressionDropPct && r.pImpressions - r.impressions >= t.minImpressionLoss) {
    out.push({ kind: "impressions", before: r.pImpressions, after: r.impressions, pct: Math.round(pct(r.pImpressions, r.impressions) * 100) })
  }
  if (
    r.pImpressions >= t.minPositionImpressions &&
    r.impressions >= t.minPositionImpressions &&
    r.pPosition > 0 &&
    r.pPosition <= t.maxPrevPosition &&
    r.position - r.pPosition >= t.positionDrop
  ) {
    out.push({ kind: "position", before: Math.round(r.pPosition * 10) / 10, after: Math.round(r.position * 10) / 10 })
  }
  return out
}

/** Pages to refresh, worst first (clicks lost count most, then impressions, then places dropped). */
export function detectDecay(snap: PageSnapshot | null, t = DECAY, limit = 10): DecayingPage[] {
  if (!snap) return []
  const out: DecayingPage[] = []
  for (const r of snap.rows) {
    const signals = signalsFor(r, t)
    if (!signals.length) continue
    const lostClicks = Math.max(0, r.pClicks - r.clicks)
    const lostImpr = Math.max(0, r.pImpressions - r.impressions)
    const pos = signals.find((s) => s.kind === "position")
    const score = lostClicks * 10 + lostImpr / 20 + (pos ? (pos.after - pos.before) * 5 : 0)
    out.push({ page: r.page, path: pathOf(r.page), signals, lostClicks, score, stat: r })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
/** "Oct 5 – Nov 1" (UTC dates from Search Console). */
export function winLabel(w: Win): string {
  const f = (s: string) => {
    const [, m, d] = s.split("-").map(Number)
    return `${MONTHS[m - 1]} ${d}`
  }
  return `${f(w.start)} – ${f(w.end)}`
}

const n = (x: number) => Math.round(x).toLocaleString("en-US")

/** One plain line per signal, with the numbers and both date ranges. */
export function evidenceLines(p: DecayingPage, snap: Pick<PageSnapshot, "cur" | "prev">): string[] {
  const span = `${winLabel(snap.prev)} vs ${winLabel(snap.cur)}`
  return p.signals.map((s) => {
    if (s.kind === "clicks") return `Clicks from Google: ${n(s.before)} → ${n(s.after)} (−${s.pct}%), ${span}`
    if (s.kind === "impressions") return `Times shown on Google: ${n(s.before)} → ${n(s.after)} (−${s.pct}%), ${span}`
    return `Average position: ${s.before} → ${s.after} (lower is better), ${span}`
  })
}

/**
 * Merge the two windows into PageStat rows. A page missing from the current window counts as 0
 * only when that list wasn't cut off by the row limit (otherwise it may just be ranked below it).
 */
export function mergeWindows(
  cur: { page: string; clicks: number; impressions: number; position: number }[],
  prev: { page: string; clicks: number; impressions: number; position: number }[],
  rowLimit: number,
): PageStat[] {
  const byPage = new Map<string, PageStat>()
  for (const r of cur) byPage.set(r.page, { page: r.page, clicks: r.clicks, impressions: r.impressions, position: r.position, pClicks: 0, pImpressions: 0, pPosition: 0 })
  const curComplete = cur.length < rowLimit
  for (const r of prev) {
    const row = byPage.get(r.page)
    if (row) Object.assign(row, { pClicks: r.clicks, pImpressions: r.impressions, pPosition: r.position })
    else if (curComplete) byPage.set(r.page, { page: r.page, clicks: 0, impressions: 0, position: 0, pClicks: r.clicks, pImpressions: r.impressions, pPosition: r.position })
  }
  const round = (x: number) => Math.round(x * 100) / 100
  return [...byPage.values()].map((r) => ({ ...r, position: round(r.position), pPosition: round(r.pPosition) }))
}
