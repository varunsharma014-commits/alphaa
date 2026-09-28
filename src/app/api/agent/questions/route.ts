export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { saveAgentSettings } from "@/lib/agent/settings"
import { latestQuestionScan, questionLimit, runQuestionScan, trackedQuestions } from "@/lib/questions"

// GET: the tracked questions + latest results. POST: start a run now (takes a
// few minutes, so it runs in the background — the server is long-lived on
// Railway). PUT: replace the question list.
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const [questions, latest] = await Promise.all([trackedQuestions(user.id), latestQuestionScan(user.id)])
  const running = await db.mockActivity.findFirst({ where: { userId: user.id, type: "question_scan_started", createdAt: { gte: new Date(Date.now() - 10 * 60_000) } } })
  return NextResponse.json({ questions, latest, running: !!running && (!latest || latest.at < running.createdAt) })
}

export async function POST() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const recent = await db.mockActivity.findFirst({ where: { userId: user.id, type: "question_scan_started", createdAt: { gte: new Date(Date.now() - 20 * 3_600_000) } } })
  if (recent) return NextResponse.json({ error: "I ran them in the last day — I’ll run them again on my weekly pass." }, { status: 429 })
  await db.mockActivity.create({ data: { userId: user.id, type: "question_scan_started", title: "Started asking the AIs your customer questions" } })
  void runQuestionScan(user.id).catch((err) => console.error("[questions] run", err instanceof Error ? err.message : err))
  return NextResponse.json({ ok: true, started: true })
}

const put = z.object({ questions: z.array(z.string().trim().min(8).max(200)).min(1).max(20) })

export async function PUT(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof put>
  try {
    input = put.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Each question needs at least a few words." }, { status: 400 })
  }
  await saveAgentSettings(user.id, { questions: input.questions.slice(0, questionLimit(user.plan)) })
  return NextResponse.json({ ok: true })
}
