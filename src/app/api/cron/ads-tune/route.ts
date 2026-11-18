export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hasGrowth, isComped } from "@/lib/billing"
import { runAsUser } from "@/lib/usage"
import { gadsAvailable } from "@/lib/gads/oauth"
import { runTune } from "@/lib/gads/tune"

// Weekly (Mon 12:00 UTC): tune the campaign I built for every Growth brand with Google Ads
// connected. Proposes changes (autopilot.ads "each") or makes them inside the cap ("budget").
// Never raises a budget, never turns a campaign on. `?dryRun=1` lists who would run.
let running = false

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rows = await db.mockActivity.findMany({ where: { type: "gads_account", metadata: { path: ["status"], equals: "active" } }, select: { userId: true, metadata: true }, take: 500 })
  const withCampaign = rows.filter((r) => (r.metadata as { campaign?: unknown } | null)?.campaign)
  const users = await db.user.findMany({ where: { id: { in: withCampaign.map((r) => r.userId) } }, select: { id: true, plan: true, email: true, subscriptionStatus: true } })
  const due = users.filter((u) => hasGrowth(u) && (u.subscriptionStatus === "active" || isComped(u.email)) && gadsAvailable(u))
  if (req.nextUrl.searchParams.get("dryRun") === "1") return NextResponse.json({ brands: due.length })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  void (async () => {
    let done = 0
    for (const u of due) {
      const t = await runAsUser(u.id, () => runTune(u.id)).catch((err) => { console.error("[ads-tune]", u.id, err instanceof Error ? err.message : err); return null })
      if (t) done++
    }
    console.log(`[ads-tune] weekly: ${done}/${due.length}`)
  })().finally(() => { running = false })
  return NextResponse.json({ started: due.length })
}
