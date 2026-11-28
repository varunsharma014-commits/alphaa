export const dynamic = "force-dynamic"

import { cronAllowed } from "@/lib/quotas"
import { asUser } from "@/lib/usage"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activeUsers, authorized } from "@/lib/cron/users"
import { runQuestionScan } from "@/lib/questions"
import { refreshClustersIfStale } from "@/lib/clusters"

// The scheduler re-hits this hourly in its catch-up window; one loop at a time per process.
let running = false

// Weekly: every tracked customer question × the four AIs, plus the fact check.
// Each business takes a few minutes, so the loop runs in the background on the
// long-lived server and the request returns straight away.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Platform AI budget (AI_DAILY_BUDGET_USD) reached today: this cron makes new AI work, so it waits (lib/quotas.ts).
  if (!(await cronAllowed("questions"))) return NextResponse.json({ skipped: "platform AI budget reached for today" })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  const users = await activeUsers().catch((e) => { running = false; throw e })
  void (async () => {
    try {
    for (const u of users) {
      asUser(u.id)
      const recent = await db.mockActivity.findFirst({ where: { userId: u.id, type: "question_scan", createdAt: { gte: new Date(Date.now() - 5 * 86_400_000) } } })
      if (!recent) await runQuestionScan(u.id).catch((err) => console.error(`[cron/questions] ${u.id}`, err instanceof Error ? err.message : err))
      // Then the Topic plan, from this week's questions (per brand at most once in 6 days, lib/clusters.ts).
      await refreshClustersIfStale(u.id)
    }
    } finally {
      running = false
    }
  })()
  return NextResponse.json({ started: users.length })
}
