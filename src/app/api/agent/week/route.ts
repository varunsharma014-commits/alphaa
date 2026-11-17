export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { hasPaidPlan, isComped } from "@/lib/billing"
import { startWeekRun, getWeekRun, WEEK_RUN } from "@/lib/agent/week"

// POST: start "run my marketing for this week" (or return the one already running / just done).
// GET ?id=: its progress, for the live steps in the chat.
export async function POST() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPaidPlan(user) && !isComped(user.email)) return NextResponse.json({ error: "Running your week comes with every paid plan.", upgrade: true }, { status: 403 })
  const recent = await db.mockActivity.findFirst({ where: { userId: user.id, type: WEEK_RUN, createdAt: { gte: new Date(Date.now() - 6 * 3_600_000) } }, orderBy: { createdAt: "desc" }, select: { id: true, metadata: true } })
  const status = (recent?.metadata as { status?: string } | null)?.status
  if (recent && (status === "running" || status === "done")) return NextResponse.json({ id: recent.id, again: status === "done" })
  return NextResponse.json({ id: await startWeekRun(user.id) })
}

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id") ?? ""
  const run = await getWeekRun(user.id, id)
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ run })
}
