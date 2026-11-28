// Pure tests for the content calendar: time zones (lib/calendar/tz.ts), the rescheduling rules
// (lib/calendar/rules.ts) and "best time to post" (lib/calendar/best-time.ts). No database, no network.
//   npx tsx scripts/test-calendar.ts
// The DB-backed check (items, moves, the due sweeps on a throwaway Postgres) is scripts/test-calendar-db.ts.
import assert from "node:assert/strict"
import { addDays, dateKey, dowOfKey, offsetMinutes, whenLabel, zonedParts, zonedToUtc } from "../src/lib/calendar/tz"
import { decideMove, MIN_LEAD_MS, STOP_WINDOW_MS, windowEndFor } from "../src/lib/calendar/rules"
import { bestFor, fromPosts, fromTraffic, MIN_SESSIONS, nextOnWeekday, nextSlots, shiftGrid, timeOnDay, typical, type BestTimes, type PostPoint } from "../src/lib/calendar/best-time"

let passed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`ok   ${name}`) } catch (e) { console.error(`FAIL ${name}\n     ${e instanceof Error ? e.message : e}`); process.exitCode = 1 }
}
const H = 3_600_000, D = 24 * H

// ── Time zones ──────────────────────────────────────────────────────────────
test("Toronto winter offset is -5h, summer -4h", () => {
  assert.equal(offsetMinutes(Date.parse("2026-12-01T12:00:00Z"), "America/Toronto"), -300)
  assert.equal(offsetMinutes(Date.parse("2026-07-01T12:00:00Z"), "America/Toronto"), -240)
  assert.equal(offsetMinutes(Date.parse("2026-07-01T12:00:00Z"), "Asia/Kolkata"), 330)
})
test("zonedToUtc round-trips wall times", () => {
  const t = zonedToUtc({ y: 2026, m: 12, d: 2, h: 9, mi: 30 }, "America/Toronto")
  assert.equal(t.toISOString(), "2026-12-02T14:30:00.000Z")
  const p = zonedParts(t, "America/Toronto")
  assert.deepEqual([p.y, p.m, p.d, p.h, p.mi, p.dow], [2026, 12, 2, 9, 30, 3])
  assert.equal(zonedToUtc({ y: 2026, m: 12, d: 2, h: 9 }, "Asia/Dubai").toISOString(), "2026-12-02T05:00:00.000Z")
  assert.equal(zonedToUtc({ y: 2026, m: 12, d: 2, h: 9 }, "UTC").toISOString(), "2026-12-02T09:00:00.000Z")
})
test("DST days: a skipped hour moves forward, the repeated hour resolves", () => {
  // 2026-03-08 02:30 doesn't exist in Toronto.
  const t = zonedToUtc({ y: 2026, m: 3, d: 8, h: 2, mi: 30 }, "America/Toronto")
  const p = zonedParts(t, "America/Toronto")
  assert.ok(p.h === 3 || p.h === 1, `got ${p.h}`)
  const fall = zonedToUtc({ y: 2026, m: 11, d: 1, h: 9 }, "America/Toronto")
  assert.equal(zonedParts(fall, "America/Toronto").h, 9)
})
test("date keys: local day differs from the UTC day near midnight", () => {
  assert.equal(dateKey(Date.parse("2026-12-02T03:00:00Z"), "America/Toronto"), "2026-12-01")
  assert.equal(dateKey(Date.parse("2026-12-02T03:00:00Z"), "Asia/Tokyo"), "2026-12-02")
  assert.equal(addDays("2026-12-31", 1), "2027-01-01")
  assert.equal(addDays("2026-03-01", -1), "2026-02-28")
  assert.equal(dowOfKey("2026-11-28"), 6)
})
test("whenLabel reads in the owner's zone", () => {
  assert.equal(whenLabel("2026-12-02T14:30:00Z", "America/Toronto"), "Wed, Dec 2 · 9:30 AM")
})

// ── Rules ───────────────────────────────────────────────────────────────────
const now = Date.parse("2026-11-28T15:00:00Z")
const base = { now, autopilotOn: true, status: "scheduled" as const, ownerOk: false, windowEnd: now + 48 * H }
test("past times are refused", () => {
  const r = decideMove({ ...base, target: now - 60_000 })
  assert.equal(r.ok, false); if (!r.ok) assert.equal(r.reason, "past")
})
test("less than 5 minutes ahead is refused with the earliest time", () => {
  const r = decideMove({ ...base, target: now + 60_000 })
  assert.equal(r.ok, false); if (!r.ok) { assert.equal(r.reason, "too_soon"); assert.equal(r.earliest, now + MIN_LEAD_MS) }
})
test("Autopilot item moved inside its stop window needs the owner's OK", () => {
  const r = decideMove({ ...base, target: now + 24 * H })
  assert.equal(r.ok, false); if (!r.ok) { assert.equal(r.reason, "window"); assert.equal(r.earliest, base.windowEnd) }
  const ok = decideMove({ ...base, target: now + 24 * H, confirm: true })
  assert.ok(ok.ok && ok.ownerOk && ok.approves)
})
test("Autopilot item moved after its stop window needs nothing, and isn't an approval", () => {
  const r = decideMove({ ...base, target: now + 60 * H })
  assert.ok(r.ok && !r.ownerOk && !r.approves)
})
test("Autopilot off: the move is the OK", () => {
  const r = decideMove({ ...base, autopilotOn: false, target: now + 2 * H })
  assert.ok(r.ok && r.ownerOk && r.approves)
})
test("a draft moved onto the calendar is approved, Autopilot on or off", () => {
  for (const a of [true, false]) { const r = decideMove({ ...base, autopilotOn: a, status: "draft", windowEnd: null, target: now + 2 * H }); assert.ok(r.ok && r.ownerOk && r.approves) }
})
test("already OK'd: moves freely (still not into the past)", () => {
  assert.ok(decideMove({ ...base, ownerOk: true, target: now + H }).ok)
  assert.equal(decideMove({ ...base, ownerOk: true, target: now - H }).ok, false)
})
test("a stop window that already ended doesn't apply", () => {
  assert.ok(decideMove({ ...base, windowEnd: now - H, target: now + H }).ok)
})
test("more than a year ahead is refused", () => {
  assert.equal(decideMove({ ...base, ownerOk: true, target: now + 401 * D }).ok, false)
})
test("windowEndFor: stored end wins, else 72h after creation", () => {
  assert.equal(windowEndFor("2026-12-01T00:00:00Z", now), Date.parse("2026-12-01T00:00:00Z"))
  assert.equal(windowEndFor(null, now), now + STOP_WINDOW_MS)
})

// ── Best time ───────────────────────────────────────────────────────────────
test("typical guidance is labelled as not the owner's data", () => {
  const b = typical("instagram")
  assert.equal(b.source, "typical")
  assert.match(b.label, /not your data/)
  assert.ok(b.slots.length === 3 && b.hours.length > 0)
})
test("fromPosts needs at least 6 posts, then ranks by engagement rate", () => {
  const tz = "America/Toronto"
  // Tuesdays 9 AM Toronto (14:00Z) do well, Fridays 4 PM (21:00Z) badly.
  const tue = (w: number): PostPoint => ({ at: Date.parse("2026-10-06T13:00:00Z") + w * 7 * D, impressions: 1000, engagements: 80 })
  const fri = (w: number): PostPoint => ({ at: Date.parse("2026-10-09T20:00:00Z") + w * 7 * D, impressions: 1000, engagements: 10 })
  assert.equal(fromPosts("linkedin", [tue(0), tue(1), fri(0)], tz, "LinkedIn Page"), null)
  const b = fromPosts("linkedin", [tue(0), tue(1), tue(2), fri(0), fri(1), fri(2)], tz, "LinkedIn Page")!
  assert.equal(b.source, "yours")
  assert.equal(b.hours[0], 9)
  assert.equal(b.days[0], 2)
  assert.match(b.label, /Your data: from 6 of your LinkedIn Page posts, Tue around 9 AM/)
})
test("fromTraffic needs enough sessions and finds the busy hour", () => {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0))
  grid[3][10] = 50
  assert.equal(fromTraffic("site", grid, "x"), null)
  for (let d = 1; d <= 5; d++) { grid[d][10] += 60; grid[d][11] += 30; grid[d][15] += 10 }
  grid[3][10] += MIN_SESSIONS
  const b = fromTraffic("site", grid, "When people visit")!
  assert.equal(b.source, "site")
  assert.equal(b.hours[0], 10)
  assert.equal(b.days[0], 3)
})
test("shiftGrid moves hours across days", () => {
  const g = Array.from({ length: 7 }, () => Array(24).fill(0))
  g[0][23] = 5
  const s = shiftGrid(g, 2)
  assert.equal(s[1][1], 5)
  const back = shiftGrid(g, -24)
  assert.equal(back[6][23], 5)
})
test("bestFor prefers the owner's own data across platforms", () => {
  const yours = { ...typical("linkedin"), source: "yours" as const, label: "mine" }
  const times: BestTimes = { at: "", tz: "UTC", channels: { linkedin: yours, facebook: typical("facebook") } }
  assert.equal(bestFor(times, ["facebook", "linkedin"]).label, "mine")
  assert.equal(bestFor(null, ["tiktok"]).channel, "tiktok")
})
test("timeOnDay / nextOnWeekday stay ahead of now in the owner's zone", () => {
  const tz = "America/Toronto"
  const b = typical("linkedin") // Tue/Wed/Thu 9 AM first
  // Saturday Nov 28 15:00Z = 10 AM Toronto. Next Tuesday = Dec 1, 9 AM Toronto = 14:00Z.
  assert.equal(nextOnWeekday(b, 2, tz, now).toISOString(), "2026-12-01T14:00:00.000Z")
  // Today (Saturday) 9 AM has passed: the next ranked hour today (12 PM).
  assert.equal(timeOnDay(b, "2026-11-28", tz, now)!.toISOString(), "2026-11-28T17:00:00.000Z")
  // Every hour of the day gone: null.
  assert.equal(timeOnDay(b, "2026-11-28", tz, Date.parse("2026-11-29T03:00:00Z")), null)
})
test("nextSlots gives upcoming suggestions, soonest first, never in the past", () => {
  const s = nextSlots(typical("email"), "America/Toronto", now, 4)
  assert.equal(s.length, 4)
  for (let i = 1; i < s.length; i++) assert.ok(Date.parse(s[i].at) > Date.parse(s[i - 1].at))
  assert.ok(Date.parse(s[0].at) > now)
  assert.match(s[0].label, /^(Tue|Thu|Wed) /)
})

console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`)
