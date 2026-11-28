// "Promote this post" on Facebook & Instagram: an ad that uses the owner's existing organic post
// (so likes and comments stay on the post), built PAUSED. The owner turns it on with one tap,
// inside the monthly limit and the ad-account allowance; it stops after the days they picked.
//
// Checked on developers.facebook.com, 2026-11-28 (Marketing API v27.0):
// - Facebook post: POST /act_{id}/adcreatives  object_story_id = "<PAGE_ID>_<POST_ID>". If a
//   creative already uses that post, Meta answers with the existing creative id.
// - Instagram post: POST /act_{id}/adcreatives  object_id = <PAGE_ID>, instagram_user_id,
//   source_instagram_media_id = <IG media id> (instagram_actor_id / instagram_story_id were
//   replaced by these in v22.0).
// - Objective OUTCOME_ENGAGEMENT, ad set optimization_goal POST_ENGAGEMENT, destination_type
//   ON_POST, billing_event IMPRESSIONS; end_time on the ad set stops it.
// The request builders are pure and tested (scripts/test-ad-features.ts); nothing here runs in tests.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { findCity, graph } from "./graph"
import { promoBlocker, promoRequests, PROMO_DAYS, type PromoSpec } from "./promote-rules"
import { createCampaign, decToken, getAccess, getCampaign, listCampaigns, liveCampaigns, logChange, saveCampaign, type MetaCampaign } from "./store"
import { setLive } from "./ops"
import { dailyFromMonthly, metaMonthlyCap, SUGGESTED_DAILY } from "./plan"
import { countryOf, specialFor } from "./rules"
import { tallyUsage } from "@/lib/usage"
import { checkQuota } from "@/lib/quotas"
import { checkAdAccount } from "@/lib/ad-accounts"
import { lastReadyStrategy } from "@/lib/ad-strategy/generate"
import { promotablePosts } from "@/lib/promote/posts"

export { promoRequests, promoBlocker, PROMO_DAYS, type PromoSpec } from "./promote-rules"

/** The ad plan's Facebook & Instagram daily amount, else my usual starting amount. */
async function planDaily(userId: string): Promise<number> {
  const plan = await lastReadyStrategy(userId).catch(() => null)
  return plan?.testing?.platforms.find((p) => p.platform === "Facebook & Instagram")?.daily ?? SUGGESTED_DAILY
}

/** What the promote sheet shows before anything is built: daily (from the ad plan, inside the limit), days, audience. */
export async function promoDefaults(user: User): Promise<{ daily: number; maxDaily: number | null; days: number; audience: string; currency: string; ready: string | null }> {
  const access = await getAccess(user.id).catch(() => null)
  const acct = access?.adAccounts.find((a) => a.id === access.picks.adAccountId)
  const cap = await metaMonthlyCap(user.id)
  const committed = liveCampaigns(await listCampaigns(user.id, 50)).filter((c) => c.status === "active").reduce((t, c) => t + c.plan.dailyBudget, 0)
  const maxDaily = cap !== null ? Math.max(0, Math.floor((dailyFromMonthly(cap) - committed) * 100) / 100) : null
  const want = await planDaily(user.id)
  const daily = maxDaily !== null ? Math.min(want, maxDaily) : want
  const ready = !access ? "Connect Facebook & Instagram ads first." : !acct ? "Pick your ad account first." : !user.city?.trim() ? "Add your city first, so I only show it to people near you." : null
  return { daily, maxDaily, days: 7, audience: user.city?.trim() ? `Adults near ${user.city}${user.state ? `, ${user.state}` : ""}` : "People near you", currency: acct?.currency ?? "USD", ready }
}

export type PromoResult = { ok: true; said: string; campaign: MetaCampaign } | { ok: false; error: string; status?: number }

/** The owner tapped "Promote this post": build it PAUSED on Meta. Nothing spends until they turn it on. */
export async function promotePost(user: User, o: { socialPostId: string; accountId: string; daily: number; days: number }): Promise<PromoResult> {
  const access = await getAccess(user.id)
  if (!access?.picks.adAccountId || !access.picks.pageId) return { ok: false, error: "Pick your ad account and Facebook Page first.", status: 409 }
  const acct = access.adAccounts.find((a) => a.id === access.picks.adAccountId)
  if (!acct) return { ok: false, error: "That ad account isn’t shared with me any more. Reconnect Facebook & Instagram.", status: 409 }
  if (acct.account_status !== 1) return { ok: false, error: "Meta says that ad account can’t run ads right now. Check it in Meta Ads Manager.", status: 409 }
  if (!user.city?.trim()) return { ok: false, error: "Add your city first, so I only show it to people near you.", status: 409 }
  if (!(PROMO_DAYS as readonly number[]).includes(o.days)) return { ok: false, error: "Pick 3, 7 or 14 days." }
  const daily = Math.round(o.daily * 100) / 100
  if (!(daily >= 1) || daily > 100_000) return { ok: false, error: "Give me a daily amount of at least 1." }
  const cap = await metaMonthlyCap(user.id)
  if (cap !== null) {
    const committed = liveCampaigns(await listCampaigns(user.id, 50)).filter((c) => c.status === "active").reduce((t, c) => t + c.plan.dailyBudget, 0)
    const room = dailyFromMonthly(cap) - committed
    if (daily > room + 0.001) return { ok: false, error: `That’s over your monthly limit. The most I can add a day is ${Math.max(0, Math.floor(room * 100) / 100).toLocaleString("en-US")} ${acct.currency}.`, status: 409 }
  }
  const pick = (await promotablePosts(user.id)).find((p) => p.socialPostId === o.socialPostId && p.accountId === o.accountId)
  if (!pick || (pick.platform !== "facebook" && pick.platform !== "instagram")) return { ok: false, error: "I can’t find that post any more.", status: 404 }
  const accounts = await db.mockActivity.findFirst({ where: { id: o.accountId, userId: user.id, type: "social_account" }, select: { metadata: true } })
  const accExt = (accounts?.metadata as { externalId?: string } | null)?.externalId ?? ""
  const block = promoBlocker({ from: pick.platform, externalId: pick.externalId, pageId: access.picks.pageId, igUserId: access.picks.igUserId, accountExternalId: accExt })
  if (block) return { ok: false, error: block, status: 409 }
  const allowed = await checkAdAccount(user, "meta", acct.id)
  if (!allowed.ok) return { ok: false, error: allowed.message, status: 402 }
  const q = await checkQuota(user, "ad_change")
  if (!q.allowed) return { ok: false, error: q.message ?? "Out of ad changes for today.", status: 429 }

  const token = decToken(access)
  const country = countryOf(user.state)
  const special = specialFor(user.businessType)
  const city = await findCity(token, user.city, country).catch(() => null)
  const name = `${(user.businessName ?? "Alphaa").slice(0, 50)} · promoted post · ${new Date().toISOString().slice(0, 10)}`
  const spec: PromoSpec = { adAccountId: acct.id, currency: acct.currency, name, special, country, dailyBudget: daily, pageId: access.picks.pageId, city, radiusMiles: special !== "NONE" ? 15 : 10, from: pick.platform, postId: pick.externalId, igUserId: access.picks.igUserId ?? null }
  const req = promoRequests(spec)

  const c = await createCampaign(user.id, {
    status: "building", name, adAccountId: acct.id, currency: acct.currency, pageId: access.picks.pageId,
    plan: { goal: "OUTCOME_ENGAGEMENT", why: `Shows your ${pick.platform === "facebook" ? "Facebook" : "Instagram"} post to more people near you.`, keys: [], special, city, cityLabel: city ? [city.name, city.region].filter(Boolean).join(", ") : user.city, country, radiusMiles: spec.radiusMiles, dailyBudget: daily, budgetSource: cap !== null ? "autopilot" : "suggested", monthlyCap: cap, ads: [{ primaryText: pick.text, headline: pick.text.split("\n")[0].slice(0, 60), description: "", imageHeadline: "" }] },
    built: { ads: [] }, createdAt: new Date().toISOString(), approvedAt: new Date().toISOString(),
    promoted: { from: pick.platform, postId: pick.externalId, postUrl: pick.url, socialPostId: pick.socialPostId, days: o.days, endsAt: null },
  })
  const step = async (what: string, id: string) => {
    tallyUsage(user.id, "ads_op")
    await logChange(user.id, { campaignRowId: c.id, objectId: id, what: `created ${what} for your promoted post (paused)`, why: "You tapped Promote this post. Nothing runs until you turn it on.", by: "owner" })
  }
  try {
    const camp = await graph<{ id: string }>(`${acct.id}/campaigns`, token, { method: "POST", params: req.campaign })
    c.built = { ...c.built, campaignId: camp.id }; await saveCampaign(user.id, c); await step("campaign", camp.id)
    const set = await graph<{ id: string }>(`${acct.id}/adsets`, token, { method: "POST", params: req.adSet(camp.id) })
    c.built = { ...c.built, adSetId: set.id }; await saveCampaign(user.id, c); await step("ad set", set.id)
    const cr = await graph<{ id: string }>(`${acct.id}/adcreatives`, token, { method: "POST", params: req.creative })
    const ad = await graph<{ id: string }>(`${acct.id}/ads`, token, { method: "POST", params: req.ad(set.id, cr.id) })
    await step("ad", ad.id)
    c.built = { campaignId: camp.id, adSetId: set.id, ads: [{ adId: ad.id, creativeId: cr.id, imageHash: "" }] }
    c.status = "paused"
    await saveCampaign(user.id, c)
    return { ok: true, said: `It’s built and paused on Meta at ${daily} ${acct.currency} a day for ${o.days} days. Nothing is spending. Turn it on when you’re ready.`, campaign: c }
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 200) : "Meta said no"
    c.status = c.built?.campaignId ? "paused" : "failed"
    c.error = msg
    await saveCampaign(user.id, c)
    return { ok: false, error: `Meta didn’t accept it: ${msg}`, status: 502 }
  }
}

/** The owner's tap: set the end date (today + the days they picked), then turn it on (cap-checked in setLive). */
export async function startPromotion(user: User, rowId: string): Promise<PromoResult> {
  const [c, access] = await Promise.all([getCampaign(user.id, rowId), getAccess(user.id)])
  if (!c?.promoted || !c.built?.adSetId) return { ok: false, error: "That promotion isn’t built yet.", status: 409 }
  if (!access) return { ok: false, error: "Reconnect Facebook & Instagram first.", status: 409 }
  if (c.error) return { ok: false, error: "This one didn’t finish building. Promote the post again instead.", status: 409 }
  const allowed = await checkAdAccount(user, "meta", c.adAccountId)
  if (!allowed.ok) return { ok: false, error: allowed.message, status: 402 }
  const q = await checkQuota(user, "ad_change")
  if (!q.allowed) return { ok: false, error: q.message ?? "Out of ad changes for today.", status: 429 }
  const endsAt = new Date(Date.now() + c.promoted.days * 86_400_000)
  await graph(c.built.adSetId, decToken(access), { method: "POST", params: { end_time: Math.floor(endsAt.getTime() / 1000).toString() } })
  tallyUsage(user.id, "ads_op")
  c.promoted.endsAt = endsAt.toISOString()
  await saveCampaign(user.id, c)
  const r = await setLive(user.id, c.id, true)
  if (!r.ok) return { ok: false, error: r.error, status: 409 }
  return { ok: true, said: `It’s on until ${endsAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}. Meta reviews it first, usually within a day.`, campaign: r.campaign ?? c }
}

/** Pause one (never blocked). */
export async function stopPromotion(user: User, rowId: string): Promise<PromoResult> {
  const r = await setLive(user.id, rowId, false)
  return r.ok ? { ok: true, said: r.said, campaign: r.campaign! } : { ok: false, error: r.error, status: 409 }
}

