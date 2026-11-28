export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hasGrowth, isComped } from "@/lib/billing"
import { runAsUser } from "@/lib/usage"
import type { AgentSettings } from "@/lib/agent/settings"
import { runAdRules } from "@/lib/ad-rules/run"

// Daily (09:00 UTC, re-hit hourly until 12:00 so a deploy can't skip a day): the owner's own ad
// rules for every Growth brand that has one turned on. Per-brand dedupe: runAdRules skips a brand
// checked in the last 20 hours, so the re-hits only finish brands a restart interrupted.
// Ad platform APIs only (no AI). `?dryRun=1` lists who would run.
let running = false

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rows = await db.mockActivity.findMany({ where: { type: "agent_settings" }, select: { userId: true, metadata: true }, take: 5000 })
  const ids = rows.filter((r) => ((r.metadata as AgentSettings | null)?.adRules ?? []).some((x) => x.on)).map((r) => r.userId)
  const users = (await db.user.findMany({ where: { id: { in: ids } } })).filter((u) => hasGrowth(u) && (u.subscriptionStatus === "active" || isComped(u.email)))
  if (req.nextUrl.searchParams.get("dryRun") === "1") return NextResponse.json({ brands: users.length })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  void (async () => {
    let acted = 0
    for (const u of users) {
      const r = await runAsUser(u.id, () => runAdRules(u)).catch((err) => { console.error("[ad-rules]", u.id, err instanceof Error ? err.message : err); return null })
      acted += r?.done ?? 0
    }
    console.log(`[ad-rules] ${users.length} brands, ${acted} changes`)
  })().finally(() => { running = false })
  return NextResponse.json({ started: users.length })
}
