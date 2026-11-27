export const dynamic = "force-dynamic"
export const maxDuration = 300

import { cronAllowed } from "@/lib/quotas"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compedEmailWhere } from "@/lib/billing"
import { nicheEnabled, refreshNichePosts } from "@/lib/niche-posts"
import { runAsUser } from "@/lib/usage"

// Weekly (Sun 08:00 UTC): refresh "What's working in your niche" for every Growth brand.
// Apify bills per result, so each brand is capped inside lib/niche-posts.ts (≤ 24 + 20 + 12 + 12
// results a week) and a brand refreshed in the last 7 days is skipped. Runs in the background
// (one brand at a time) and returns at once; `?dryRun=1` lists who would run.
let running = false

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Platform AI budget (AI_DAILY_BUDGET_USD) reached today: this cron makes new AI work, so it waits (lib/quotas.ts).
  if (!(await cronAllowed("niche-posts"))) return NextResponse.json({ skipped: "platform AI budget reached for today" })
  if (!nicheEnabled()) return NextResponse.json({ skipped: "APIFY_TOKEN not configured" })
  const users = await db.user.findMany({
    where: { businessType: { not: null }, OR: [{ plan: { contains: "growth", mode: "insensitive" }, subscriptionStatus: "active" }, ...compedEmailWhere()] },
    select: { id: true },
    take: 300,
  })
  if (req.nextUrl.searchParams.get("dryRun") === "1") return NextResponse.json({ brands: users.length })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  void (async () => {
    let done = 0
    for (const u of users) {
      const r = await runAsUser(u.id, () => refreshNichePosts(u.id)).catch(() => null)
      if (r) done++
    }
    console.log(`[niche] weekly refresh: ${done}/${users.length}`)
  })().finally(() => { running = false })
  return NextResponse.json({ started: users.length })
}
