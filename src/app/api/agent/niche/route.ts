export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { hasPaidPlan, hasPro, isComped } from "@/lib/billing"
import { lastReadyNichePosts, nicheView, startNicheRefresh, type NicheItem } from "@/lib/niche-posts"
import { madeMessage, nicheMessages } from "@/lib/agent/niche-narration"
import { writeSocial } from "@/lib/content"
import { renderSocialCard } from "@/lib/social-card"
import { ensureBrandKit } from "@/lib/brand-kit"
import { createPost, listAccounts } from "@/lib/social/store"
import { countUsage } from "@/lib/usage"
import { agent } from "@/lib/agent/types"

const body = z.object({ op: z.enum(["status", "refresh", "make"]), id: z.string().min(4).max(40).optional() })

// "What's working in your niche": status (poll), refresh (background, at most once a day),
// make (write the owner's own version: caption + brand image; a draft SocialPost on Pro and up).
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPaidPlan(user) && !isComped(user.email)) return NextResponse.json({ error: "This comes with every paid plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }

  if (input.op === "status") return NextResponse.json({ messages: nicheMessages(await nicheView(user.id, { kick: true })) })

  if (input.op === "refresh") {
    startNicheRefresh(user.id, { minAgeMs: 86_400_000 })
    const v = await nicheView(user.id)
    const fresh = v.ready && Date.now() - Date.parse(v.ready.at) < 86_400_000
    return NextResponse.json({ messages: [
      agent([{ kind: "text", text: fresh && !v.running ? "These are from today already. I’ll look again tomorrow." : "On it. I’m reading today’s posts; this takes a few minutes." }]),
      ...nicheMessages({ ...v, running: v.running || !fresh }),
    ] })
  }

  const p = await lastReadyNichePosts(user.id)
  const item: NicheItem | undefined = p?.items.find((i) => i.id === input.id)
  if (!item) return NextResponse.json({ error: "That post isn’t in this week’s list any more." }, { status: 404 })
  const topic = item.angle || `A post for your business in the spirit of this: ${item.about}`
  const context = `A ${item.platform === "meta_ad" ? "long-running ad" : "post"} in this business's niche is getting attention. What it is: ${item.about}${item.why ? ` Why it works: ${item.why}` : ""} Make an original post for this business in the same spirit. Never copy or mention the other account.`
  const sp = await writeSocial(user, topic, context)
  const brand = await ensureBrandKit(user.id).catch(() => null)
  const card = await renderSocialCard(user.id, { headline: sp.headline, businessName: user.businessName, brand }).catch(() => null)
  // Saving it as a social post is Pro and up (2026-11-18).
  const growth = hasPro(user)
  let saved = false
  if (growth) {
    const accounts = (await listAccounts(user.id)).filter((a) => a.status === "active" && (card || (a.platform !== "instagram" && a.platform !== "tiktok")))
    await createPost(user.id, { text: sp.text, imageId: card?.id ?? null, accountIds: accounts.map((a) => a.id), status: "draft", scheduledFor: null, source: "manual", title: sp.headline })
    saved = true
  }
  await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Wrote a social post: “${sp.headline}”`, metadata: { topic, text: sp.text, kind: "social", imageId: card?.id ?? null, niche: item.id } } })
  countUsage(user.id, "niche_version")
  return NextResponse.json({ messages: [madeMessage({ text: sp.text, image: card?.url ?? null, saved, growth, from: item })] })
}
