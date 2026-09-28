export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser, bareHost } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { bingSites, encryptSecret } from "@/lib/checks/bing-webmaster"
import { runCheck } from "@/lib/checks/run"

// Connect Bing Webmaster Tools with the owner's API key (Bing → Settings →
// API access). The key is stored encrypted and never sent back to the browser.
const body = z.object({ apiKey: z.string().trim().min(10).max(200) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "That doesn’t look like a Bing API key." }, { status: 400 })
  }
  const sites = await bingSites(input.apiKey)
  if ("error" in sites) return NextResponse.json({ error: sites.error }, { status: 400 })
  const want = user.websiteUrl ? bareHost(user.websiteUrl.replace(/^https?:\/\//, "").split("/")[0]) : null
  const match = sites.find((s) => want && bareHost(s.url.replace(/^https?:\/\//, "").split("/")[0]) === want)
  if (!match) return NextResponse.json({ error: want ? `Your Bing account doesn’t have ${want} yet. Add it in Bing Webmaster Tools (you can import it from Google Search Console), then try again.` : "Add your website to your Alphaa profile first." }, { status: 400 })
  if (!match.verified) return NextResponse.json({ error: `${want} is in Bing but not verified yet. Finish verification in Bing Webmaster Tools, then try again.` }, { status: 400 })
  await saveAgentSettings(user.id, { bingKeyEnc: encryptSecret(input.apiKey), bingSite: match.url })
  const summary = await runCheck(user.id, "bing").catch(() => null)
  return NextResponse.json({ ok: true, site: match.url, summary })
}

export async function DELETE() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  if (s.bingKeyEnc) await saveAgentSettings(user.id, { bingKeyEnc: undefined, bingSite: undefined })
  return NextResponse.json({ ok: true })
}
