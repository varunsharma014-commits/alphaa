import type Stripe from "stripe"
import { stripe, planItem, extraAdAccounts, planFromPrice } from "@/lib/stripe"
import { hasStripePlan, isComped, shopifyBilledShop } from "@/lib/billing"

// What the owner pays for right now, read-only from Stripe (UI audit package 4: the Billing page
// names the plan, price, next charge and card; the Plans page marks the current plan and period).
// Never throws: a Stripe error returns what the User row already knows.
export type BillingPlan = "starter" | "pro" | "growth"
export type BillingSummary = {
  source: "stripe" | "shopify" | "comped" | "none"
  plan: BillingPlan | null
  status: string
  interval: "month" | "year" | null
  /** What the next invoice charges for the plan + add-ons, in major units (list price, before coupons). */
  amount: number | null
  currency: string | null
  /** ISO date of the next charge (null when it is set to cancel). */
  nextChargeAt: string | null
  /** ISO date the plan ends when it is set to cancel. */
  endsAt: string | null
  card: { brand: string; last4: string } | null
  extraAdAccounts: number
  /** A coupon is on the subscription (e.g. the extra-brand 50% off). */
  discounted: boolean
}

export function planKeyOf(plan: string): BillingPlan | null {
  if (/growth/i.test(plan)) return "growth"
  if (/pro|full/i.test(plan)) return "pro"
  if (/starter/i.test(plan)) return "starter"
  return null
}

type U = { email: string; plan: string; subscriptionStatus: string; stripeSubscriptionId: string | null }

export async function billingSummary(user: U): Promise<BillingSummary> {
  const base: BillingSummary = {
    source: isComped(user.email) ? "comped" : shopifyBilledShop(user) ? "shopify" : hasStripePlan(user) ? "stripe" : "none",
    plan: planKeyOf(user.plan),
    status: user.subscriptionStatus,
    interval: null, amount: null, currency: null, nextChargeAt: null, endsAt: null, card: null, extraAdAccounts: 0, discounted: false,
  }
  if (!hasStripePlan(user) || !user.stripeSubscriptionId || !process.env.STRIPE_SECRET_KEY) return base
  try {
    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, { expand: ["default_payment_method", "customer.invoice_settings.default_payment_method"] })
    const item = planItem(sub.items.data)
    const plan = item ? planFromPrice(item.price) : null
    const amount = sub.items.data.reduce((s, i) => s + (i.price.unit_amount ?? 0) * (i.quantity ?? 1), 0) / 100
    const periodEnd = item?.current_period_end ?? null
    const pm = (sub.default_payment_method && typeof sub.default_payment_method === "object" ? sub.default_payment_method
      : typeof sub.customer === "object" && !("deleted" in sub.customer && sub.customer.deleted) ? (sub.customer as Stripe.Customer).invoice_settings?.default_payment_method : null) as Stripe.PaymentMethod | string | null
    const card = pm && typeof pm === "object" && pm.card ? { brand: pm.card.brand, last4: pm.card.last4 } : null
    const ending = sub.cancel_at_period_end || !!sub.cancel_at
    const endAt = sub.cancel_at ?? (sub.cancel_at_period_end ? periodEnd : null)
    return {
      ...base,
      plan: plan === "fullservice" ? "pro" : plan ?? base.plan,
      status: sub.status,
      interval: item?.price.recurring?.interval === "year" ? "year" : item?.price.recurring?.interval === "month" ? "month" : null,
      amount: amount || null,
      currency: item?.price.currency?.toUpperCase() ?? null,
      nextChargeAt: !ending && periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      endsAt: endAt ? new Date(endAt * 1000).toISOString() : null,
      card,
      extraAdAccounts: extraAdAccounts(sub.items.data),
      discounted: (sub.discounts?.length ?? 0) > 0,
    }
  } catch (e) {
    console.error("[billing-summary]", e instanceof Error ? e.message : e)
    return base
  }
}
