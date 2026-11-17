export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { cleanGa4, cleanPixel, installTracking, removeTracking } from "@/lib/tracking"
import { trackingMessages, upgradeMessages } from "@/lib/agent/tracking-narration"

// Growth plan: set up / check / turn off GA4 + Meta Pixel on the owner's site.
// Every answer is the thread's messages, so the chat just shows them.
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("save"), ga4: z.string().max(40).optional(), pixel: z.string().max(40).optional(), events: z.boolean().optional() }),
  z.object({ op: z.literal("check") }),
  z.object({ op: z.literal("off") }),
])

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await trackingMessages(user) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ messages: upgradeMessages(), upgrade: true }, { status: 403 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "I didn’t understand that." }, { status: 400 })
  }

  if (input.op === "off") {
    await removeTracking(user.id)
    return NextResponse.json({ messages: await trackingMessages(user) })
  }
  if (input.op === "check") return NextResponse.json({ messages: await trackingMessages(user, { fresh: true }) })

  const rawGa4 = (input.ga4 ?? "").trim()
  const rawPixel = (input.pixel ?? "").trim()
  const ga4 = cleanGa4(rawGa4)
  const pixel = cleanPixel(rawPixel)
  if (rawGa4 && !ga4) return NextResponse.json({ error: "That Google Analytics ID doesn’t look right. It starts with G- (for example G-AB12CD34EF)." }, { status: 400 })
  if (rawPixel && !pixel) return NextResponse.json({ error: "That Meta Pixel ID doesn’t look right. It’s a long number (15 or 16 digits)." }, { status: 400 })
  if (!ga4 && !pixel) return NextResponse.json({ error: "Add at least one: your Google Analytics ID or your Meta Pixel ID." }, { status: 400 })

  const r = await installTracking(user.id, { ga4, pixel, events: input.events !== false })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })
  return NextResponse.json({ messages: await trackingMessages(user) })
}
