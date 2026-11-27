// Pure rules for Growth's ad-account allowance (no database; scripts/test-quotas.ts tests them).
// Varun, 2026-11-27: "1 ad account means 1 ad account. Google + Meta = 2 ad accounts." The
// allowance is a TOTAL across platforms: Growth includes 1 ad account, each "Extra ad account"
// add-on adds 1 more, on Google or Meta. lib/ad-accounts.ts loads the state and calls these.
import { EXTRA_AD_ACCOUNT_PRICE } from "@/lib/constants"

export type AdPlatform = "google" | "meta"
export type AdAccountState = {
  /** Accounts with a campaign of ours turned on, per platform. */
  live: Record<AdPlatform, string[]>
  /** The account picked for the brand on each platform (in use even with nothing running). */
  picks: Record<AdPlatform, string | null>
}

const key = (p: AdPlatform, id: string) => `${p}:${id}`

/** Every ad account in use now, across both platforms ("google:123", "meta:act_9"). */
export function accountsInUse(s: AdAccountState): Set<string> {
  const out = new Set<string>()
  for (const p of ["google", "meta"] as const) {
    for (const id of s.live[p]) out.add(key(p, id))
    const pick = s.picks[p]
    if (pick) out.add(key(p, pick))
  }
  return out
}

/**
 * The accounts in use after picking / building / turning on ads in `id` on `platform`. The same
 * platform's old pick is replaced, so it only still counts if its ads are on; the other
 * platform's pick and everything running stay.
 */
export function accountsAfter(s: AdAccountState, platform: AdPlatform, id: string): Set<string> {
  const out = new Set<string>()
  for (const p of ["google", "meta"] as const) {
    for (const a of s.live[p]) out.add(key(p, a))
    const pick = s.picks[p]
    if (pick && p !== platform) out.add(key(p, pick))
  }
  out.add(key(platform, id))
  return out
}

export function allowanceFor(plan: string, comped: boolean, extra: number): number {
  if (comped) return Infinity
  if (!/growth/i.test(plan)) return 0
  return 1 + Math.max(0, Math.floor(extra || 0))
}

/** May this brand use one more account? Not Growth (0) = the plan gate answers first. */
export function adAccountDecision(s: AdAccountState, allowance: number, platform: AdPlatform, id: string, onSale: boolean): { ok: true } | { ok: false; message: string; inUse: number } {
  if (allowance === Infinity || allowance === 0) return { ok: true }
  const after = accountsAfter(s, platform, id)
  if (after.size <= allowance) return { ok: true }
  return { ok: false, message: adAccountLimitMessage(allowance, onSale), inUse: after.size - 1 }
}

export function adAccountLimitMessage(allowance: number, onSale: boolean): string {
  const covers = allowance === 1 ? "1 ad account" : `${allowance} ad accounts`
  const add = onSale
    ? `Add one for $${EXTRA_AD_ACCOUNT_PRICE.monthly} a month per additional ad account (Google or Meta) in Settings → Billing, or pause the ads in the other account first.`
    : `Each additional ad account (Google or Meta) is $${EXTRA_AD_ACCOUNT_PRICE.monthly} a month: email hi@alphaa.app and we'll add one, or pause the ads in the other account first.`
  return `Your plan covers ${covers} in total, Google or Meta, and ${allowance === 1 ? "it's" : "they're all"} in use already. ${add}`
}
