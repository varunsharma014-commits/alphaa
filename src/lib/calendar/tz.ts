// Time-zone helpers for the content calendar (client + server, no dependencies). Everything is
// stored in UTC; the owner sees and picks times in their own zone (agent settings
// `calendar.timezone`, else the browser's).

export const DEFAULT_TZ = "UTC"

export function isValidTz(tz: string | null | undefined): tz is string {
  if (!tz || tz.length > 64) return false
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true } catch { return false }
}

export type Parts = { y: number; m: number; d: number; h: number; mi: number; dow: number }

const fmtCache = new Map<string, Intl.DateTimeFormat>()
function fmt(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" })
    fmtCache.set(tz, f)
  }
  return f
}
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

/** The wall-clock parts of an instant in a zone. m is 1-12, dow 0 = Sunday. */
export function zonedParts(at: Date | number, tz: string): Parts {
  const p: Record<string, string> = {}
  for (const x of fmt(tz).formatToParts(typeof at === "number" ? new Date(at) : at)) p[x.type] = x.value
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, dow: DOW[p.weekday] ?? 0 }
}

/** The zone's offset from UTC at that instant, in minutes (Toronto in winter = -300). */
export function offsetMinutes(at: number, tz: string): number {
  const p = zonedParts(at, tz)
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi)
  return Math.round((asUtc - Math.floor(at / 60_000) * 60_000) / 60_000)
}

/** The UTC instant for a wall-clock time in a zone. A time skipped by a DST jump moves forward. */
export function zonedToUtc(w: { y: number; m: number; d: number; h: number; mi?: number }, tz: string): Date {
  const guess = Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi ?? 0)
  let t = guess - offsetMinutes(guess, tz) * 60_000
  // Second pass settles times near a DST change.
  t = guess - offsetMinutes(t, tz) * 60_000
  return new Date(t)
}

/** "2026-11-28" for an instant, in the zone. */
export function dateKey(at: Date | number, tz: string): string {
  const p = zonedParts(at, tz)
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
}

export function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number)
  return { y, m, d }
}

/** Adds days to a "YYYY-MM-DD" key (calendar maths, no zone needed). */
export function addDays(key: string, n: number): string {
  const { y, m, d } = parseKey(key)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

export const dowOfKey = (key: string) => { const { y, m, d } = parseKey(key); return new Date(Date.UTC(y, m - 1, d)).getUTCDay() }

/** "9 AM" / "1:30 PM". */
export function hourLabel(h: number, mi = 0): string {
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}${mi ? `:${String(mi).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** "Tue, Dec 2 · 9 AM" in the zone. */
export function whenLabel(at: Date | number | string, tz: string): string {
  const t = typeof at === "string" ? Date.parse(at) : typeof at === "number" ? at : at.getTime()
  const p = zonedParts(t, tz)
  const month = new Date(Date.UTC(p.y, p.m - 1, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
  return `${DAY_SHORT[p.dow]}, ${month} ${p.d} · ${hourLabel(p.h, p.mi)}`
}

/** A short readable zone name: "Toronto time (EST)". */
export function tzLabel(tz: string, at = Date.now()): string {
  if (tz === "UTC") return "UTC"
  const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz
  let abbr = ""
  try { abbr = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(at).find((x) => x.type === "timeZoneName")?.value ?? "" } catch { /* keep the city */ }
  return abbr ? `${city} time (${abbr})` : `${city} time`
}
