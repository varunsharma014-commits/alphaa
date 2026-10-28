export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { pushBody, pushChange, type PushInput } from "@/lib/connector/push"

// Publishes one approved change to the owner's site (logic in lib/connector/push.ts,
// shared with approvals from the briefing email).
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: PushInput
  try {
    input = pushBody.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  return pushChange(user, input)
}
