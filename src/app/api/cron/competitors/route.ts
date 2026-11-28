export const dynamic = "force-dynamic"
export const maxDuration = 300

import { cronAllowed } from "@/lib/quotas"
import { relevantCompetitors } from "@/lib/competitor-relevance"
import { asUser } from "@/lib/usage"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { runAutoDiscovery } from "@/lib/discover-competitors"
import { dataforseoConfigured } from "@/lib/dataforseo"
import { analyzeCompetitor } from "@/lib/competitor-analyzer"

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

  if (!dataforseoConfigured()) {
    return NextResponse.json({ skipped: "DataForSEO not configured" })
  }

  const users = await db.user.findMany({
    where: { businessType: { not: null }, city: { not: null } },
    select: { id: true, businessName: true, businessType: true, city: true, state: true, websiteUrl: true, voiceDescription: true },
  })

  let refreshed = 0
  let processed = 0
  let discovered = 0
  for (const u of users) {
      asUser(u.id)
    // Only real competitors count (shared gate): an account left with only wikis/directories gets a new search.
    const rows = await db.competitor.findMany({ where: { userId: u.id }, select: { url: true, name: true, crawlData: true }, take: 30 })
    const existing = rows.length ? (await relevantCompetitors(u, rows)).length : 0
    if (existing > 0) {
      // Already has competitors: no new search, but re-read the oldest ones so Research never
      // shows a months-old read as current (up to 3 a week, each read at most once in 28 days).
      refreshed += await refreshStale(u).catch(() => 0)
      continue
    }
    try {
      const r = await runAutoDiscovery(u)
      discovered += r.discovered
      processed++
    } catch {
      // Skip this user on failure; keep going.
    }
  }

  return NextResponse.json({ processed, discovered, refreshed })
}

const STALE_MS = 28 * 86_400_000

/** Re-analyse a brand's oldest real competitors (crawl + analysis), keeping how each was added. */
async function refreshStale(u: { id: string; businessType: string | null; city: string | null }): Promise<number> {
  const old = await db.competitor.findMany({
    where: { userId: u.id, OR: [{ analyzedAt: null }, { analyzedAt: { lt: new Date(Date.now() - STALE_MS) } }] },
    orderBy: { analyzedAt: "asc" },
    take: 10,
  })
  const real = (await relevantCompetitors(u.id, old)).slice(0, 3)
  let n = 0
  for (const c of real) {
    try {
      const prev = (c.crawlData && typeof c.crawlData === "object" ? c.crawlData : {}) as Record<string, unknown>
      const a = await analyzeCompetitor(c.url, "", u.businessType ?? "business", u.city ?? "")
      await db.competitor.update({
        where: { id: c.id },
        data: { name: a.nameFromSite ? a.name : c.name ?? a.name, crawlData: { ...prev, ...a.crawlData, aiSummary: a.aiSummary } as object, analyzedAt: new Date() },
      })
      n++
    } catch {
      // A site that can't be read keeps its old read; the page shows how old it is.
    }
  }
  return n
}
