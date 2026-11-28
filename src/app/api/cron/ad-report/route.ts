export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hasGrowth, isComped } from "@/lib/billing"
import { runAsUser } from "@/lib/usage"
import type { AgentSettings } from "@/lib/agent/settings"
import { sendMonthly } from "@/lib/ad-report/links"

// 1st of the month (15:00 UTC, re-hit hourly to 20:00): last month's ad report link, emailed to
// owners who turned it on (and the one address they typed). Once per brand per month
// (`adReportMail.lastSent`), so re-hits never resend. Ad APIs + Resend only. `?dryRun=1` counts.
let running = false

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rows = await db.mockActivity.findMany({ where: { type: "agent_settings" }, select: { userId: true, metadata: true }, take: 5000 })
  const ids = rows.filter((r) => (r.metadata as AgentSettings | null)?.adReportMail?.monthly).map((r) => r.userId)
  const users = (await db.user.findMany({ where: { id: { in: ids } } })).filter((u) => hasGrowth(u) && (u.subscriptionStatus === "active" || isComped(u.email)))
  if (req.nextUrl.searchParams.get("dryRun") === "1") return NextResponse.json({ brands: users.length })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  void (async () => {
    let sent = 0
    for (const u of users) if ((await runAsUser(u.id, () => sendMonthly(u)).catch(() => "skipped")) === "sent") sent++
    console.log(`[ad-report] monthly: ${sent}/${users.length} sent`)
  })().finally(() => { running = false })
  return NextResponse.json({ started: users.length })
}
