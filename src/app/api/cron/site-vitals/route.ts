export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activeUsers, authorized } from "@/lib/cron/users"
import { asUser } from "@/lib/usage"
import { checkedRecently, runSiteVitals } from "@/lib/seo/site-vitals"

// Weekly: Core Web Vitals (PageSpeed Insights, free) + structured data audit for every brand with a
// website. No AI. The scheduler re-hits this hourly in its catch-up window (a deploy kills the
// loop); a brand checked in the last 6 days is skipped, and one loop runs at a time per process.
let running = false

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  const users = await activeUsers().catch((e) => { running = false; throw e })
  const withSite = users.filter((u) => u.websiteUrl?.trim())
  void (async () => {
    try {
      for (const u of withSite) {
        if (await checkedRecently(u.id).catch(() => true)) continue
        asUser(u.id)
        const user = await db.user.findUnique({ where: { id: u.id } })
        if (!user) continue
        await runSiteVitals(user, "weekly")
      }
    } finally {
      running = false
    }
  })()
  return NextResponse.json({ started: withSite.length })
}
