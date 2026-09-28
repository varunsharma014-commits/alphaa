/** A real, live Stripe subscription. Status alone isn't trusted: the column's DB default is "trialing". */
export function hasPaidPlan(u: { subscriptionStatus: string; stripeSubscriptionId: string | null }) {
  return !!u.stripeSubscriptionId && ["active", "trialing"].includes(u.subscriptionStatus)
}

/** Owner dogfood accounts: full access and agent work without a subscription. */
export const FOUNDER_EMAILS = ["varunsharma014@gmail.com"]
