// How many ad accounts a brand may run ads in (Growth: 1 included, +1 per "Extra ad account"
// add-on on the subscription, $200/mo or $170/mo billed yearly; EXTRA_AD_ACCOUNT_PRICE).
//
// "1 ad account" means one Google Ads account AND one Meta ad account for the business: the
// allowance applies per platform. An account is "in use" when it is the one picked for the
// brand or still has a campaign of ours turned on in it (switching the pick doesn't stop a
// running campaign in the old account). Pausing is never blocked.
//
// The add-on quantity is written by the Stripe webhook to agent settings `billing.extraAdAccounts`
// (lib/agent/settings.ts). Comped / founder accounts are unlimited.
import { isComped } from "@/lib/billing"
import { getAgentSettings } from "@/lib/agent/settings"
import { EXTRA_AD_ACCOUNT_PRICE } from "@/lib/constants"
import { GROWTH_ON_SALE } from "@/lib/growth"

type U = { id: string; plan: string; email?: string | null }
export type AdPlatform = "google" | "meta"

/** 1 + the extra ad accounts on the subscription for Growth, unlimited for comped, 0 otherwise. */
export async function adAccountAllowance(user: U): Promise<number> {
  if (isComped(user.email)) return Infinity
  if (!/growth/i.test(user.plan)) return 0
  const extra = (await getAgentSettings(user.id)).billing?.extraAdAccounts ?? 0
  return 1 + Math.max(0, Math.floor(extra))
}

/** Ad accounts with a campaign of ours turned on, per platform (besides the current pick). */
async function liveAccounts(userId: string, platform: AdPlatform): Promise<Set<string>> {
  const out = new Set<string>()
  if (platform === "meta") {
    const { listCampaigns } = await import("@/lib/metaads/store")
    for (const c of await listCampaigns(userId, 50)) if (c.status === "active" && c.built?.campaignId) out.add(c.adAccountId)
    return out
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
  return out
}

/** The account picked for this brand on a platform, if any. */
async function currentPick(userId: string, platform: AdPlatform): Promise<string | null> {
  if (platform === "meta") {
    const { getAccess } = await import("@/lib/metaads/store")
    return (await getAccess(userId))?.picks.adAccountId ?? null
  }
  const { getGadsAccount } = await import("@/lib/gads/store")
  return (await getGadsAccount(userId))?.customerId ?? null
}

/** Ad accounts in use per platform right now (pick + accounts with ads running). */
export async function adAccountsInUse(userId: string): Promise<Record<AdPlatform, string[]>> {
  const out = {} as Record<AdPlatform, string[]>
  for (const p of ["google", "meta"] as const) {
    const s = await liveAccounts(userId, p)
    const pick = await currentPick(userId, p)
    if (pick) s.add(pick)
    out[p] = [...s]
  }
  return out
}

const NAME: Record<AdPlatform, string> = { google: "Google Ads", meta: "Facebook & Instagram" }

export function adAccountLimitMessage(platform: AdPlatform, allowance: number): string {
  const covers = allowance === 1 ? "1 ad account" : `${allowance} ad accounts`
  const add = GROWTH_ON_SALE
    ? ` Add another ad account for $${EXTRA_AD_ACCOUNT_PRICE.monthly} a month in Billing (Settings → Billing), or pause the ads in the other account first.`
    : ` Extra ad accounts are $${EXTRA_AD_ACCOUNT_PRICE.monthly} a month: email hi@alphaa.app and we'll add one, or pause the ads in the other account first.`
  return `Your plan covers ${covers} on ${NAME[platform]}, and you're already running ads in ${allowance === 1 ? "one" : "all of them"}.${add}`
}

/**
 * May this brand pick / build / turn on ads in `accountId`? Counts the accounts that would be in
 * use afterwards (running elsewhere + this one); the old pick is replaced, so it only counts if
 * its ads are still on.
 */
export async function checkAdAccount(user: U, platform: AdPlatform, accountId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const allowance = await adAccountAllowance(user)
  if (allowance === Infinity) return { ok: true }
  if (allowance === 0) return { ok: true } // not Growth: the plan gate (hasGrowth) answers first
  const after = await liveAccounts(user.id, platform)
  after.add(accountId)
  if (after.size <= allowance) return { ok: true }
  return { ok: false, message: adAccountLimitMessage(platform, allowance) }
}
