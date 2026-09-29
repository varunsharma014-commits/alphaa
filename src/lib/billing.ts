/** A real, live Stripe subscription. Status alone isn't trusted: the column's DB default is "trialing". */
export function hasPaidPlan(u: { subscriptionStatus: string; stripeSubscriptionId: string | null }) {
  return !!u.stripeSubscriptionId && ["active", "trialing"].includes(u.subscriptionStatus)
}

/**
 * Accounts with full access and agent work without a subscription: the owner's dogfood account,
 * plus COMP_ACCESS_EMAILS (comma-separated, e.g. Shopify/Webflow app-review logins).
 */
export const FOUNDER_EMAILS = [
  "varunsharma014@gmail.com",
  ...(process.env.COMP_ACCESS_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
]
