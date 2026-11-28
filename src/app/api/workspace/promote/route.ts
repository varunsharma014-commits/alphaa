export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { metaAdsConfigured } from "@/lib/metaads/connect"
import { getAccess, listCampaigns } from "@/lib/metaads/store"
import { forget } from "@/lib/metaads/report"
import { promoBlocker, promoDefaults, promotePost, startPromotion, stopPromotion, PROMO_DAYS } from "@/lib/metaads/promote"
import { promotablePosts, splitPicks, MIN_VIEWS_TO_RANK } from "@/lib/promote/posts"
import { statsLine } from "@/lib/social/stats"
import { linkedinAdsOn } from "@/lib/linkedin-ads/api"
import { getLiAds, liAdsUsable, listPromos, pickLiAccount, promoteOnLinkedIn, setLiPromo } from "@/lib/linkedin-ads/ops"
import { db } from "@/lib/db"
import { requireCan } from "@/lib/team/actor"

// Ads → Promote a post: the owner's best published posts (ranked by real stats where we have
// them, else "recent"), and the paused-then-approve promotion flow on Meta (and LinkedIn once
// LinkedIn grants ads access and LINKEDIN_ADS=1). Google has no promote.
const id = z.string().min(5).max(40)
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("meta_build"), socialPostId: id, accountId: id, daily: z.number().positive().max(100_000), days: z.number().int() }),
  z.object({ op: z.literal("meta_on"), id }),
  z.object({ op: z.literal("meta_off"), id }),
  z.object({ op: z.literal("li_build"), socialPostId: id, accountId: id, daily: z.number().positive().max(100_000), days: z.number().int(), notPolitical: z.boolean() }),
  z.object({ op: z.literal("li_on"), id }),
  z.object({ op: z.literal("li_off"), id }),
  z.object({ op: z.literal("li_pick"), id: z.string().min(1).max(30) }),
])

type U = NonNullable<Awaited<ReturnType<typeof currentUser>>>

async function view(user: U) {
  const [picks, access, camps, defaults, li, accounts] = await Promise.all([
    promotablePosts(user.id).catch(() => []),
    metaAdsConfigured() ? getAccess(user.id).catch(() => null) : null,
    listCampaigns(user.id, 50).catch(() => []),
    promoDefaults(user).catch(() => null),
    linkedinAdsOn() ? getLiAds(user.id).catch(() => null) : null,
    db.mockActivity.findMany({ where: { userId: user.id, type: "social_account" }, select: { id: true, metadata: true } }),
  ])
  const extOf = new Map(accounts.map((a) => [a.id, (a.metadata as { externalId?: string } | null)?.externalId ?? ""]))
  const metaOn = !!access
  const liOn = liAdsUsable(li)
  const shown = picks.filter((p) => (p.platform === "linkedin" ? liOn : metaOn))
  const { ranked, recent } = splitPicks(shown)
  const card = (p: (typeof picks)[number]) => ({
    socialPostId: p.socialPostId, accountId: p.accountId, platform: p.platform, accountName: p.accountName, text: p.text, image: p.image, url: p.url, publishedAt: p.publishedAt,
    stats: statsLine(p.stats ?? undefined), rate: p.rate,
    blocked: p.platform === "linkedin" ? null : promoBlocker({ from: p.platform, externalId: p.externalId, pageId: access?.picks.pageId, igUserId: access?.picks.igUserId, accountExternalId: extOf.get(p.accountId) ?? "" }),
  })
  return {
    metaOn,
    linkedin: { flag: linkedinAdsOn(), connected: !!li, usable: liOn, accounts: li?.accounts ?? [], pick: li?.pick ?? null, promos: liOn ? await listPromos(user.id) : [] },
    ranked: ranked.map(card), recent: recent.map(card), minViews: MIN_VIEWS_TO_RANK,
    defaults, days: PROMO_DAYS,
    promotions: camps.filter((c) => c.promoted && c.status !== "dismissed").map((c) => ({ id: c.id, name: c.name, status: c.status, daily: c.plan.dailyBudget, currency: c.currency, days: c.promoted!.days, endsAt: c.promoted!.endsAt ?? null, from: c.promoted!.from, postUrl: c.promoted!.postUrl ?? null, error: c.error ?? null, text: c.plan.ads[0]?.primaryText ?? "" })),
  }
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Promoting posts comes with the Growth plan." }, { status: 403 })
  return NextResponse.json(await view(user))
}

export async function POST(req: Request) {
  { const denied = await requireCan("ads"); if (denied) return denied } // teams (lib/team)
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Promoting posts comes with the Growth plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const meta = input.op.startsWith("meta")
  if (meta && !metaAdsConfigured()) return NextResponse.json({ error: "Facebook & Instagram ads are opening soon." }, { status: 409 })
  if (!meta && !linkedinAdsOn()) return NextResponse.json({ error: "LinkedIn Ads are opening soon." }, { status: 409 })
  try {
    let r: { ok: true; said: string } | { ok: false; error: string; status?: number }
    switch (input.op) {
      case "meta_build": r = await promotePost(user, input); break
      case "meta_on": r = await startPromotion(user, input.id); break
      case "meta_off": r = await stopPromotion(user, input.id); break
      case "li_build": r = await promoteOnLinkedIn(user, input); break
      case "li_on": r = await setLiPromo(user, input.id, true); break
      case "li_off": r = await setLiPromo(user, input.id, false); break
      case "li_pick": r = (await pickLiAccount(user.id, input.id)) ? { ok: true, said: "Got it." } : { ok: false, error: "That ad account isn’t on your LinkedIn login." }; break
    }
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 })
    if (meta) forget(user.id)
    return NextResponse.json({ said: r.said, ...(await view(user)) })
  } catch (err) {
    console.error("[promote]", input.op, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: err instanceof Error ? err.message.slice(0, 200) : "That didn’t work. Nothing changed." }, { status: 502 })
  }
}
