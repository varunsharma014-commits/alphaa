export const dynamic = "force-dynamic"

import { checkQuota } from "@/lib/quotas"
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { agent } from "@/lib/agent/types"
import { startStrategy, strategyRunning } from "@/lib/ad-strategy/generate"
import { adPlanMessages } from "@/lib/ad-strategy/thread"

const body = z.object({ op: z.enum(["make", "status"]) })

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await adPlanMessages(user) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPro(user)) return NextResponse.json({ error: "Your ad plan comes with the Pro plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  if (input.op === "make" && !strategyRunning(user.id)) {
    const room = await checkQuota(user, "ad_plan", { record: false })
    if (!room.allowed) return NextResponse.json({ error: room.message, quota: true }, { status: 429 })
    startStrategy(user.id)
  }
  // Give the new row a moment to exist so the thread shows it running.
  if (input.op === "make") await new Promise((r) => setTimeout(r, 400))
  const messages = await adPlanMessages(user)
  return NextResponse.json({ messages: input.op === "make" ? messages : [agent([{ kind: "text", text: "Here’s where it is." }]), ...messages] })
}
