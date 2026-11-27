// How many ad accounts a brand may run ads in: a TOTAL across Google and Meta (Varun, 2026-11-27:
// "1 ad account means 1 ad account. Google + Meta = 2 ad accounts."). Growth includes 1; each
// "Extra ad account" add-on on the subscription adds 1 more, on either platform ($200/mo or
// $170/mo billed yearly; EXTRA_AD_ACCOUNT_PRICE). So a Growth brand using a Google Ads account
// needs 1 add-on to also connect a Meta ad account, and vice versa.
//
// An account is "in use" when it is the one picked for the brand or still has a campaign of ours
// turned on in it (switching the pick doesn't stop a running campaign in the old account).
// Pausing is never blocked. Rules: lib/ad-account-rules.ts (pure, tested).
//
// The add-on quantity is written by the Stripe webhook to agent settings `billing.extraAdAccounts`
// (lib/agent/settings.ts). Comped / founder accounts are unlimited.
import { isComped } from "@/lib/billing"
import { getAgentSettings } from "@/lib/agent/settings"
import { GROWTH_ON_SALE } from "@/lib/growth"
import { accountsInUse, adAccountDecision, allowanceFor, type AdAccountState, type AdPlatform } from "@/lib/ad-account-rules"

export type { AdPlatform }
type U = { id: string; plan: string; email?: string | null }

/** 1 + the extra ad accounts on the subscription for Growth (total, any platform), unlimited for comped, 0 otherwise. */
export async function adAccountAllowance(user: U): Promise<number> {
  const comped = isComped(user.email)
  const extra = comped || !/growth/i.test(user.plan) ? 0 : (await getAgentSettings(user.id)).billing?.extraAdAccounts ?? 0
  return allowanceFor(user.plan, comped, extra)
}

/** Ad accounts with a campaign of ours turned on, on one platform. */
async function liveAccounts(userId: string, platform: AdPlatform): Promise<string[]> {
  const out = new Set<string>()
  if (platform === "meta") {
    const { listCampaigns } = await import("@/lib/metaads/store")
    for (const c of await listCampaigns(userId, 50)) if (c.status === "active" && c.built?.campaignId) out.add(c.adAccountId)
    return [...out]
  }
  // Google: the latest enable/pause per account in the change log (lib/gads/store ads_change).
  const { db } = await import("@/lib/db")
  const rows = await db.mockActivity.findMany({ where: { userId, type: "ads_change" }, orderBy: { createdAt: "asc" }, select: { metadata: true }, take: 500 })
  const last = new Map<string, string>()
  for (const r of rows) {
    const m = r.metadata as { platform?: string; op?: string; customerId?: string } | null
    if (!m || m.platform === "meta" || !m.customerId) continue
    if (m.op === "enable" || m.op === "pause") last.set(m.customerId, m.op)
  }
  for (const [id, op] of last) if (op === "enable") out.add(id)
  return [...out]
}

/** Picks + running accounts on both platforms. */
export async function adAccountState(userId: string): Promise<AdAccountState> {
  const [{ getAccess }, { getGadsAccount }] = await Promise.all([import("@/lib/metaads/store"), import("@/lib/gads/store")])
  const [gLive, mLive, meta, gads] = await Promise.all([liveAccounts(userId, "google"), liveAccounts(userId, "meta"), getAccess(userId), getGadsAccount(userId)])
  return { live: { google: gLive, meta: mLive }, picks: { google: gads?.customerId ?? null, meta: meta?.picks.adAccountId ?? null } }
}

/** Every ad account in use now, across both platforms ("google:123", "meta:act_9"). */
export async function adAccountsInUse(userId: string): Promise<string[]> {
  return [...accountsInUse(await adAccountState(userId))]
}

/**
 * May this brand pick / build / turn on ads in `accountId` on `platform`? Counts every account in
 * use afterwards on both platforms against the total allowance.
 */
export async function checkAdAccount(user: U, platform: AdPlatform, accountId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const allowance = await adAccountAllowance(user)
  if (allowance === Infinity || allowance === 0) return { ok: true }
  const d = adAccountDecision(await adAccountState(user.id), allowance, platform, accountId, GROWTH_ON_SALE)
  return d.ok ? d : { ok: false, message: d.message }
}
