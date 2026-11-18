export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { setupMessages, setupOp } from "@/lib/agent/setup"

// Guided setup card ("3 of 7 done"): GET redraws it, POST skips a step, confirms the brand, or closes it.
const body = z.object({
  op: z.enum(["skip", "done", "reset", "dismiss"]),
  step: z.enum(["google", "site", "voice", "brand", "autopilot", "social", "tracking"]).optional(),
})

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await setupMessages(user) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 })
  return NextResponse.json({ messages: await setupOp(user, parsed.data) })
}
