export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"
import { activeUsers, authorized } from "@/lib/cron/users"
import { db } from "@/lib/db"
import { hasGrowth } from "@/lib/billing"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { asUser } from "@/lib/usage"
import { eventDays } from "@/lib/tracking-events"
import { healthItems, refreshTracking, regressions, snapshot } from "@/lib/tracking-health"

// Daily: re-read every Growth site that has tracking on, fix what's safe to fix by itself
// (lib/tracking-health.ts), and note anything that got worse since yesterday in the
// "Tracking & Ads" thread (settings tracking.regressions + a MockActivity "tracking_regression").
// Plain fetches only: no AI spend. `?dryRun=1` reports without saving a new snapshot.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1"
  const all = await activeUsers()
  const ids = all.map((u) => u.id)
  const users = (await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, plan: true, email: true, websiteUrl: true } })).filter(hasGrowth)

  const run = async () => {
    const out: { id: string; fixed: number; worse: string[] }[] = []
    for (const u of users) {
      try {
        const before = await getAgentSettings(u.id)
        if (!before.tracking?.on || (!before.tracking.ga4 && !before.tracking.pixel)) continue
        asUser(u.id)
        const r = dryRun ? { check: before.tracking.check ?? null, fixed: [], tracking: before.tracking } : await refreshTracking(u)
        const s = await getAgentSettings(u.id)
        if (!s.tracking || !r.check) continue
        const items = healthItems(s, r.check, await eventDays(u.id, 31))
        const worse = regressions(before.tracking.health, items)
        out.push({ id: u.id, fixed: r.fixed.length, worse })
        if (dryRun) continue
        const now = new Date().toISOString()
        await saveAgentSettings(u.id, {
          tracking: { ...s.tracking, health: { at: now, items: snapshot(items) }, ...(worse.length ? { regressions: { at: now, lines: worse } } : {}) },
        })
        if (worse.length) {
          await db.mockActivity.create({ data: { userId: u.id, type: "tracking_regression", title: "Something changed in your tracking", metadata: { lines: worse } } })
        }
      } catch (err) {
        console.error(`[cron/tracking-health] ${u.id}`, err instanceof Error ? err.message : err)
      }
    }
    return out
  }

  if (dryRun) return NextResponse.json({ checked: await run() })
  void run()
  return NextResponse.json({ started: users.length })
}
