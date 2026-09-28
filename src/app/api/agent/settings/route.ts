export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { networkOf } from "@/lib/checks/profiles"
import { platformAvailability } from "@/lib/connector/availability"

// Small owner-set flags the agent remembers (Bing/Apple listings done, a
// review link). The WordPress connection is only ever set by the plugin.
const body = z.object({
  bingPlacesDone: z.boolean().optional(),
  appleConnectDone: z.boolean().optional(),
  reviewLink: z.string().url().max(500).optional(),
  profileUrl: z.string().url().max(500).optional(), // add one profile
  autoPublishPosts: z.boolean().optional(), // Pro: publish posts with no placeholders without asking
})

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  return NextResponse.json({
    webPersonEmail: s.webPersonEmail ?? null,
    wpConnected: !!s.wp,
    siteConnected: !!s.wp || !!s.site,
    platform: s.wp ? "wordpress" : s.site?.platform ?? null,
    available: platformAvailability(),
    autoPublishPosts: !!s.autoPublishPosts,
    canAutoPublish: /pro|full/i.test(user.plan),
    reviewLink: s.reviewLink ?? null,
  })
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
  if (input.autoPublishPosts !== undefined) {
    if (input.autoPublishPosts && !/pro|full/i.test(user.plan)) return NextResponse.json({ error: "Auto-publish comes with the Pro plan.", upgrade: true }, { status: 403 })
    await saveAgentSettings(user.id, { autoPublishPosts: input.autoPublishPosts })
  }
  if (input.profileUrl) {
    if (!networkOf(input.profileUrl)) return NextResponse.json({ error: "That isn’t a Facebook, Instagram, LinkedIn, Yelp, YouTube, TikTok, X, Nextdoor or Google link." }, { status: 400 })
    const s = await getAgentSettings(user.id)
    await saveAgentSettings(user.id, { profiles: Array.from(new Set([...(s.profiles ?? []), input.profileUrl])) })
  }
  await saveAgentSettings(user.id, {
    ...(input.bingPlacesDone !== undefined ? { bingPlacesDone: input.bingPlacesDone ? now : undefined } : {}),
    ...(input.appleConnectDone !== undefined ? { appleConnectDone: input.appleConnectDone ? now : undefined } : {}),
    ...(input.reviewLink ? { reviewLink: input.reviewLink } : {}),
  })
  return NextResponse.json({ ok: true })
}
