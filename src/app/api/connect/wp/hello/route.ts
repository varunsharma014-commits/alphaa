export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { verifyConnectionKey, indexNowKey } from "@/lib/connector/keys"
import { saveAgentSettings } from "@/lib/agent/settings"
import { publicUrl, bareHost } from "@/lib/connector/user"

// Called by the WordPress plugin when the owner pastes their key.
// Public route: the key itself is the proof.
const body = z.object({ key: z.string().min(10).max(200), siteUrl: z.string().max(500), restUrl: z.string().max(500), version: z.string().max(20) })

export async function POST(req: Request) {
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 })
  }
  const userId = verifyConnectionKey(input.key)
  if (!userId) return NextResponse.json({ ok: false, error: "That key isn’t valid. Copy it again from your Alphaa agent." }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ ok: false, error: "That key isn’t valid. Copy it again from your Alphaa agent." }, { status: 401 })

  const site = publicUrl(input.siteUrl)
  const rest = publicUrl(input.restUrl)
  if (!site || !rest || bareHost(site.hostname) !== bareHost(rest.hostname)) {
    return NextResponse.json({ ok: false, error: "This site’s address can’t be reached from the internet." }, { status: 400 })
  }
  const own = user.websiteUrl ? publicUrl(user.websiteUrl.startsWith("http") ? user.websiteUrl : `https://${user.websiteUrl}`) : null
  if (own && bareHost(own.hostname) !== bareHost(site.hostname)) {
    return NextResponse.json({ ok: false, error: `This key is for ${bareHost(own.hostname)}, but this site is ${bareHost(site.hostname)}.` }, { status: 400 })
  }

  const now = new Date().toISOString()
  await saveAgentSettings(user.id, { wp: { siteUrl: site.toString(), restUrl: rest.toString(), version: input.version, connectedAt: now, lastSeenAt: now } })
  await db.mockActivity.create({ data: { userId: user.id, type: "site_connected", title: `Connected to ${bareHost(site.hostname)} (WordPress)`, metadata: { siteUrl: site.toString() } } })
  return NextResponse.json({ ok: true, indexnow: indexNowKey(user.id) })
}
