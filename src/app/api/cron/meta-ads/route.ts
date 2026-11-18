export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hasGrowth } from "@/lib/billing"
import { runAsUser } from "@/lib/usage"
import { metaAdsConfigured } from "@/lib/metaads/connect"
import { pollLeads } from "@/lib/metaads/leads"
import { brandsWithCampaigns, weeklyTune } from "@/lib/metaads/tune"

// Facebook + Instagram ads.
//   ?job=leads  hourly: new leads from my lead forms (active or paused campaigns)
//   ?job=tune   Mon 12:00 UTC: last 7 days → pause losers / shift budget (autopilot.ads) and report
// Background, one brand at a time; `?dryRun=1` lists who would run.
const running = { leads: false, tune: false }

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!metaAdsConfigured()) return NextResponse.json({ skipped: "Meta app not configured" })
  const job = req.nextUrl.searchParams.get("job") === "tune" ? "tune" : "leads"
  const ids = await brandsWithCampaigns(job === "tune" ? ["active"] : ["active", "paused"])
  const users = (await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, plan: true, email: true } })).filter(hasGrowth)
  if (req.nextUrl.searchParams.get("dryRun") === "1") return NextResponse.json({ job, brands: users.length })
  if (running[job]) return NextResponse.json({ skipped: "already running" })
  running[job] = true
  void (async () => {
    let n = 0
    for (const u of users) {
      const r = await runAsUser(u.id, () => (job === "tune" ? weeklyTune(u.id).then((t) => (t ? 1 : 0)) : pollLeads(u.id))).catch(() => 0)
      n += r
    }
    console.log(`[metaads] ${job}: ${users.length} brands, ${n} ${job === "tune" ? "passes" : "new leads"}`)
  })().finally(() => { running[job] = false })
  return NextResponse.json({ job, started: users.length })
}
