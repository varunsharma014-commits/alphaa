import { realEmail } from "@/lib/sites"
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

/**
 * Who may open internal admin pages (all brands' usage and emails). NOT the comp list:
 * COMP_ACCESS_EMAILS holds app-store reviewer logins, who must never see other customers.
 * Extra emails via ADMIN_EMAILS (comma-separated).
 */
const ADMIN_EMAILS = ["varunsharma014@gmail.com", ...(process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)]
export function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(realEmail(email).trim().toLowerCase())
}

/** Prisma OR-clauses matching comp-access rows, their extra websites included. */
export function compedEmailWhere() {
  return [
    { email: { in: FOUNDER_EMAILS } },
    ...FOUNDER_EMAILS.filter((e) => e.includes("@")).map((e) => {
      const at = e.lastIndexOf("@")
      return { AND: [{ email: { startsWith: `${e.slice(0, at)}+as-` } }, { email: { endsWith: e.slice(at) } }] }
    }),
  ]
}

/** Founder / comp-access login, including that login\'s extra websites (lib/sites.ts). */
export function isComped(email: string | null | undefined): boolean {
  return !!email && FOUNDER_EMAILS.includes(realEmail(email).trim().toLowerCase())
}

/**
 * Pro and up (plans set 2026-11-26): everything except ads. Social media (connect, branded images,
 * Canva, posting), Google Business Profile posts, review replies and review requests, email to
 * past customers, lead tracking, more posts, up to 3 locations, auto-approve. Starter is AI
 * search (AEO) only. "fullservice" is retired from sale (no subscribers) but still reads as
 * Pro-level so any old row keeps working. Comped accounts get it too.
 */
export function hasPro(u: { plan: string; email?: string | null }): boolean {
  return /pro|full|growth/i.test(u.plan) || isComped(u.email)
}

/**
 * Growth plan ($799/mo, early access until ads open): Pro + Google and Meta ads management (ad
 * accounts, campaigns, tuning, ad budget). Email and lead tracking moved down to Pro on
 * 2026-11-26. Comped accounts get it too, so the founder and app reviewers can see every feature.
 */
export function hasGrowth(u: { plan: string; email?: string | null }): boolean {
  return /growth/i.test(u.plan) || isComped(u.email)
}

/** Ads management (Google Ads, Meta ads, ad budget): Growth only. */
export const hasAds = hasGrowth

/** Email to past customers and lead/call tracking: Pro and up since 2026-11-26 (was Growth). */
export const hasEmail = hasPro
export const hasTracking = hasPro

/** Google Business Profile posts, review replies and review requests: Pro and up since 2026-11-26. */
export const hasGoogleProfile = hasPro

// ── Extra brands (Varun, 2026-11-17): every brand after the first on one login is 50% off ──
// Each brand is its own User row with its own subscription (lib/sites.ts). A brand gets the
// Stripe coupon EXTRA_BRAND_COUPON (50% off, forever) when the same owner already pays for
// another brand. Shopify-billed brands count as paid.
export const EXTRA_BRAND_COUPON = () => process.env.STRIPE_EXTRA_BRAND_COUPON || "EXTRA_BRAND_50"
export const EXTRA_BRAND_PERCENT = 50

export async function isExtraBrand(user: { id: string; clerkId: string }): Promise<boolean> {
  const { db } = await import("@/lib/db")
  const { ownerClerkId, sitePrefix } = await import("@/lib/sites")
  const owner = ownerClerkId(user.clerkId)
  const other = await db.user.findFirst({
    where: {
      id: { not: user.id },
      OR: [{ clerkId: owner }, { clerkId: { startsWith: sitePrefix(owner) } }],
      stripeSubscriptionId: { not: null },
      subscriptionStatus: { in: ["active", "trialing", "past_due"] },
    },
    select: { id: true },
  })
  return !!other
}
