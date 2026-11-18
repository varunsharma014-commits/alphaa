export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { cleanGa4, cleanPixel, installTracking, removeTracking } from "@/lib/tracking"
import { testMessages, trackingMessages, upgradeMessages, verifyMessages } from "@/lib/agent/tracking-narration"
import { applyFix, startTest, verifyTest } from "@/lib/tracking-health"
import { checkCapiToken } from "@/lib/tracking-events"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { encryptSecret } from "@/lib/checks/bing-webmaster"
import { db } from "@/lib/db"

// Growth plan: set up / check / turn off GA4 + Meta Pixel on the owner's site.
// Every answer is the thread's messages, so the chat just shows them.
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("save"), ga4: z.string().max(40).optional(), pixel: z.string().max(40).optional(), events: z.boolean().optional() }),
  z.object({ op: z.literal("check") }),
  z.object({ op: z.literal("off") }),
  // Self-test: hand out the link, then check what arrived.
  z.object({ op: z.literal("test") }),
  z.object({ op: z.literal("verify") }),
  // Fix chips from the health list.
  z.object({ op: z.literal("fix"), fix: z.enum(["events", "install", "tag"]) }),
  // Meta Conversions API token (Events Manager). Stored encrypted.
  z.object({ op: z.literal("capi"), capiToken: z.string().min(20).max(600), testCode: z.string().max(40).optional() }),
  z.object({ op: z.literal("capi-off") }),
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

  if (input.op === "test") {
    const r = await startTest(user)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ messages: testMessages(r.link) })
  }
  if (input.op === "verify") {
    const r = await verifyTest(user)
    if (!r.started) return NextResponse.json({ error: "Start the test first, then open the link." }, { status: 400 })
    const t = (await getAgentSettings(user.id)).tracking
    return NextResponse.json({ messages: [...verifyMessages(r.result, { ga4: !!t?.ga4, pixel: !!t?.pixel }), ...(await trackingMessages(user))] })
  }
  if (input.op === "fix") {
    const r = await applyFix(user, input.fix)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 })
    return NextResponse.json({ messages: await trackingMessages(user, { fresh: true }) })
  }
  if (input.op === "capi" || input.op === "capi-off") {
    const s = await getAgentSettings(user.id)
    const t = s.tracking
    if (!t?.on) return NextResponse.json({ error: "Set up your tracking first." }, { status: 400 })
    if (input.op === "capi-off") {
      await saveAgentSettings(user.id, { tracking: { ...t, capi: undefined } })
      return NextResponse.json({ messages: await trackingMessages(user) })
    }
    const pixel = t.pixel ?? t.check?.elsewhere?.pixel[0]
    if (!pixel) return NextResponse.json({ error: "Add your Meta Pixel ID first." }, { status: 400 })
    const token = input.capiToken.trim()
    const testCode = (input.testCode ?? "").trim().replace(/[^A-Za-z0-9_-]/g, "") || undefined
    const ok = await checkCapiToken(pixel, token)
    if (!ok.ok) return NextResponse.json({ error: `Meta didn’t accept that token: ${ok.error}` }, { status: 400 })
    await saveAgentSettings(user.id, { tracking: { ...t, capi: { token: encryptSecret(token), pixel, testCode, savedAt: new Date().toISOString() } } })
    await db.mockActivity.create({ data: { userId: user.id, type: "site_change", title: "Started sending your leads to Meta from my server too", metadata: { op: "tracking", fix: "capi", undone: false } } })
    return NextResponse.json({ messages: await trackingMessages(user) })
  }

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
