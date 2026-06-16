export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { discoverCompetitors } from "@/lib/discover-competitors"

// Weekly auto-discovery. Runs competitor discovery for businesses that have a
// type + city but no competitors yet (new accounts whose onboarding-time
// discovery didn't run). Skips anyone who already has competitors so we don't
// spend SERP credits redundantly. Protected by the CRON_SECRET bearer token.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.APIFY_TOKEN) {
    return NextResponse.json({ skipped: "APIFY_TOKEN not configured" })
  }

  const users = await db.user.findMany({
    where: { businessType: { not: null }, city: { not: null } },
    select: { id: true, businessName: true, businessType: true, city: true, websiteUrl: true },
  })

  let processed = 0
  let discovered = 0
  for (const u of users) {
    const existing = await db.competitor.count({ where: { userId: u.id } })
    if (existing > 0) continue // already has competitors — skip to save SERP spend
    try {
      discovered += await discoverCompetitors(u)
      processed++
    } catch {
      // Skip this user on failure; keep going.
    }
  }

  return NextResponse.json({ processed, discovered })
}
