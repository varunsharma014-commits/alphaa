export const dynamic = "force-dynamic"

// Content calendar (Social Studio → Calendar, lib/calendar). GET ?from&to = every scheduled and
// published item in that range across channels + the drafts waiting for a time + best times to
// post. POST op "move" reschedules one item (rules in lib/calendar/rules.ts), op "tz" saves the
// owner's time zone (from the browser on first visit, or the picker).
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings } from "@/lib/agent/settings"
import { calendarItems, autopilotOn } from "@/lib/calendar/items"
import { moveItem } from "@/lib/calendar/move"
import { getBestTimes, saveOwnerTz } from "@/lib/calendar/best-time-data"
import { DEFAULT_TZ, isValidTz } from "@/lib/calendar/tz"
import { hasPro } from "@/lib/billing"
import { within } from "@/lib/workspace/common"
import { CHANNELS, typical } from "@/lib/calendar/best-time"
import { requireCan } from "@/lib/team/actor"

const DAY = 86_400_000

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const url = new URL(req.url)
  const now = Date.now()
  let from = Date.parse(url.searchParams.get("from") ?? "")
  let to = Date.parse(url.searchParams.get("to") ?? "")
  if (!Number.isFinite(from)) from = now - 7 * DAY
  if (!Number.isFinite(to) || to <= from) to = from + 42 * DAY
  if (to - from > 70 * DAY) to = from + 70 * DAY
  const s = await getAgentSettings(user.id)
  const saved = isValidTz(s.calendar?.timezone) ? s.calendar!.timezone! : null
  const tz = saved ?? (isValidTz(url.searchParams.get("tz")) ? url.searchParams.get("tz")! : DEFAULT_TZ)
  // A slow Google Analytics read mustn't hold the calendar up: typical guidance until it's cached.
  const typicalAll = Object.fromEntries(CHANNELS.map((c) => [c, typical(c)]))
  const [items, best] = await Promise.all([calendarItems(user, new Date(from), new Date(to)), within(getBestTimes(user.id, { tz }).then((b) => b.channels), 4000, typicalAll)])
  return NextResponse.json({ tz, tzSaved: !!saved, auto: autopilotOn(s), pro: hasPro(user), items, best })
}

const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("move"), kind: z.enum(["social", "gbp", "site", "email"]), id: z.string().min(5).max(40), at: z.string().max(40), confirm: z.boolean().optional() }),
  z.object({ op: z.literal("tz"), tz: z.string().min(1).max(64) }),
])

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  if (input.op === "tz") {
    const s = await getAgentSettings(user.id)
    if (s.calendar?.timezone) {
      const denied = await requireCan("settings")
      if (denied) return denied
    }
    return (await saveOwnerTz(user.id, input.tz)) ? NextResponse.json({ ok: true, tz: input.tz }) : NextResponse.json({ error: "I don’t know that time zone." }, { status: 400 })
  }
  const denied = await requireCan("publish")
  if (denied) return denied
  const r = await moveItem(user, input.kind, input.id, input.at, !!input.confirm)
  if (r.ok) return NextResponse.json(r)
  return NextResponse.json({ error: r.error, needsOk: r.needsOk ?? false, earliest: r.earliest ?? null }, { status: r.status ?? 400 })
}
