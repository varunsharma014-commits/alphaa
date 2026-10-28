export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { getFirstAnswer, markFirstAnswerSeen } from "@/lib/agent/first-answer"
import { accountQuestion } from "@/lib/sandbox"

// GET: the first-visit ChatGPT answer (null once seen). POST: mark it seen.
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const first = await getFirstAnswer(user)
  if (!first) return NextResponse.json({ show: false })
  return NextResponse.json({
    show: true,
    answer: first.answer,
    businessName: user.businessName ?? "",
    // Nothing asked yet: the page asks this, live.
    question: first.answer ? null : await accountQuestion(user),
  })
}

export async function POST() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await markFirstAnswerSeen(user.id)
  return NextResponse.json({ ok: true })
}
