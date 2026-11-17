export const dynamic = "force-dynamic"
export const maxDuration = 180

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { hasPaidPlan, isComped } from "@/lib/billing"
import { buildInsights } from "@/lib/insights"
import { insightsMessages } from "@/lib/agent/insights-narration"

// Rebuild "What's working" from today's data (at most once an hour per account).
export async function POST() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPaidPlan(user) && !isComped(user.email)) return NextResponse.json({ error: "This comes with every paid plan." }, { status: 403 })
  const recent = await db.mockActivity.findFirst({ where: { userId: user.id, type: "insights", createdAt: { gte: new Date(Date.now() - 3_600_000) } }, orderBy: { createdAt: "desc" }, select: { metadata: true } })
  const i = recent ? (recent.metadata as never) : await buildInsights(user.id).catch((err) => { console.error("[insights]", err); return null })
  const google = !!(await db.integration.findUnique({ where: { userId: user.id }, select: { id: true } }))
  return NextResponse.json({ messages: insightsMessages(i, { google }) })
}
