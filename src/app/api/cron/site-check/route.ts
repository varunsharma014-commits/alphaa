export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activeUsers, authorized } from "@/lib/cron/users"
import { asUser } from "@/lib/usage"
import { weeklySiteCheck } from "@/lib/seo/site-watch"

// Weekly site check (Sun 09:00 UTC, re-hit hourly until Monday 12:00 by lib/cron-scheduler.ts):
// broken links, dead outbound links and redirect chains for every active brand, found without a
// click. A brand checked in the last 5 days (this run or "Check my site now") is skipped, so a re-hit
// only finishes the brands a deploy interrupted. No AI: fetches only (lib/seo/site-watch.ts).
let running = false

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  const users = await activeUsers().catch(() => [])
  // In the background (a 40-page check takes a minute or two per brand); one brand at a time.
  void (async () => {
    const tally: Record<string, number> = {}
    try {
      for (const u of users) {
        if (!u.websiteUrl) continue
        asUser(u.id)
        const user = await db.user.findUnique({ where: { id: u.id } })
        if (!user) continue
        const r = await weeklySiteCheck(user).catch((err) => {
          console.error(`[cron/site-check] ${u.id}`, err instanceof Error ? err.message : err)
          return { status: "failed" as const }
        })
        tally[r.status] = (tally[r.status] ?? 0) + 1
      }
      console.log("[cron/site-check]", JSON.stringify(tally))
    } finally {
      running = false
    }
  })()
  return NextResponse.json({ started: users.length })
}
