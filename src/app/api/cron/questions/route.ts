export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activeUsers, authorized } from "@/lib/cron/users"
import { runQuestionScan } from "@/lib/questions"

// Weekly: every tracked customer question × the four AIs, plus the fact check.
// Each business takes a few minutes, so the loop runs in the background on the
// long-lived server and the request returns straight away.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await activeUsers()
  void (async () => {
    for (const u of users) {
      const recent = await db.mockActivity.findFirst({ where: { userId: u.id, type: "question_scan", createdAt: { gte: new Date(Date.now() - 5 * 86_400_000) } } })
      if (recent) continue
      await runQuestionScan(u.id).catch((err) => console.error(`[cron/questions] ${u.id}`, err instanceof Error ? err.message : err))
    }
  })()
  return NextResponse.json({ started: users.length })
}
