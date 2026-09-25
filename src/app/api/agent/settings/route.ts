export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"

// Small owner-set flags the agent remembers (Bing/Apple listings done, a
// review link). The WordPress connection is only ever set by the plugin.
const body = z.object({
  bingPlacesDone: z.boolean().optional(),
  appleConnectDone: z.boolean().optional(),
  reviewLink: z.string().url().max(500).optional(),
})

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  return NextResponse.json({ webPersonEmail: s.webPersonEmail ?? null, wpConnected: !!s.wp, reviewLink: s.reviewLink ?? null })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 })
  }
  const now = new Date().toISOString()
  await saveAgentSettings(user.id, {
    ...(input.bingPlacesDone !== undefined ? { bingPlacesDone: input.bingPlacesDone ? now : undefined } : {}),
    ...(input.appleConnectDone !== undefined ? { appleConnectDone: input.appleConnectDone ? now : undefined } : {}),
    ...(input.reviewLink ? { reviewLink: input.reviewLink } : {}),
  })
  return NextResponse.json({ ok: true })
}
