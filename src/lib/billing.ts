/**
 * Where a paying customer's subscription lives. `User.stripeSubscriptionId` holds either a real
 * Stripe subscription id ("sub_…") or, for merchants billed through Shopify Managed Pricing, the
 * marker "shopify:<shop>.myshopify.com" (no schema change needed, and every paid gate/cron that
 * checks "stripeSubscriptionId not null + active/trialing" covers both). One field = one billing
 * source, so the two sides can't clobber each other: Stripe webhooks match on real sub/customer
 * ids and never see the marker; Shopify webhooks only ever clear rows carrying their marker.
 */
export const SHOPIFY_SUB_PREFIX = "shopify:"
export const shopifySubMarker = (shop: string) => `${SHOPIFY_SUB_PREFIX}${shop}`

/** The shop a Shopify-billed account pays through, or null (Stripe-billed / unpaid). */
export function shopifyBilledShop(u: { stripeSubscriptionId: string | null }): string | null {
  return u.stripeSubscriptionId?.startsWith(SHOPIFY_SUB_PREFIX) ? u.stripeSubscriptionId.slice(SHOPIFY_SUB_PREFIX.length) : null
}

/** A real, live subscription (Stripe or Shopify). Status alone isn't trusted: the column's DB default is "trialing". */
export function hasPaidPlan(u: { subscriptionStatus: string; stripeSubscriptionId: string | null }) {
  return !!u.stripeSubscriptionId && ["active", "trialing"].includes(u.subscriptionStatus)
}

/** A live subscription billed by Stripe specifically (not the Shopify marker). */
export function hasStripePlan(u: { subscriptionStatus: string; stripeSubscriptionId: string | null }) {
  return hasPaidPlan(u) && !shopifyBilledShop(u)
}

/**
 * Accounts with full access and agent work without a subscription: the owner's dogfood account,
 * plus COMP_ACCESS_EMAILS (comma-separated, e.g. Shopify/Webflow app-review logins).
 */
export const FOUNDER_EMAILS = [
  "varunsharma014@gmail.com",
  ...(process.env.COMP_ACCESS_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
]
