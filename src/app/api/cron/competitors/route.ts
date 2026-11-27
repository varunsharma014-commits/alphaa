export const dynamic = "force-dynamic"
export const maxDuration = 300

import { cronAllowed } from "@/lib/quotas"
import { relevantCompetitors } from "@/lib/competitor-relevance"
import { asUser } from "@/lib/usage"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { runAutoDiscovery } from "@/lib/discover-competitors"

// Weekly auto-discovery. Runs competitor discovery for businesses that have a
// type + city but no competitors yet (new accounts whose onboarding-time
// discovery didn't run). Skips anyone who already has competitors so we don't
// spend SERP credits redundantly. Protected by the CRON_SECRET bearer token.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // Platform AI budget (AI_DAILY_BUDGET_USD) reached today: this cron makes new AI work, so it waits (lib/quotas.ts).
  if (!(await cronAllowed("competitors"))) return NextResponse.json({ skipped: "platform AI budget reached for today" })

  if (!process.env.APIFY_TOKEN) {
    return NextResponse.json({ skipped: "APIFY_TOKEN not configured" })
  }

  const users = await db.user.findMany({
    where: { businessType: { not: null }, city: { not: null } },
    select: { id: true, businessName: true, businessType: true, city: true, websiteUrl: true, voiceDescription: true },
  })

  let processed = 0
  let discovered = 0
  for (const u of users) {
      asUser(u.id)
    // Only real competitors count (shared gate): an account left with only wikis/directories gets a new search.
    const rows = await db.competitor.findMany({ where: { userId: u.id }, select: { url: true, name: true, crawlData: true }, take: 30 })
    const existing = rows.length ? (await relevantCompetitors(u, rows)).length : 0
    if (existing > 0) continue // already has competitors — skip to save SERP spend
    try {
      const r = await runAutoDiscovery(u)
      discovered += r.discovered
      processed++
    } catch {
      // Skip this user on failure; keep going.
    }
  }

  return NextResponse.json({ processed, discovered })
}
