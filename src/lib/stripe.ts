import Stripe from "stripe"

// Lazy singleton — avoids initializing Stripe at module load (which would crash
// during `next build` if STRIPE_SECRET_KEY is not yet set in the environment).
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

/** @deprecated Use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

// Plans set 2026-11-26: Starter $99 ($1,010/yr), Pro $499 ($5,090/yr), Growth $799 ($8,150/yr,
// early access, not sold until ads open). Yearly = 15% off. Checkout checks each price's amount
// against PLAN_PRICES before using it (api/stripe/checkout verifiedPrice), so an old price id left
// in env is never charged. Each Alphaa price also carries metadata { alphaa_plan, interval } so the
// webhook can map a subscription to its plan even if the env ids change (planFromPrice).
export const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  },
  growth: {
    monthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID!,
  },
  // Retired from sale 2026-11-18 (never had subscribers). Kept so the webhook can still map
  // an old subscription to a plan; checkout no longer sells it.
  fullservice: {
    monthly: process.env.STRIPE_FULLSERVICE_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_FULLSERVICE_MONTHLY_PRICE_ID!,
  },
}


type SoldPlan = "starter" | "pro" | "growth" | "fullservice"

/**
 * The plan a Stripe price sells. Env price ids first, then the price's `alphaa_plan` metadata
 * (set on every price created 2026-11-26), then the product name ("Alphaa Pro"). Older env ids
 * that were replaced still resolve through metadata or product name, so a renamed env var never
 * silently downgrades a paying customer to Starter.
 */
export function planFromPrice(price: { id: string; metadata?: Record<string, string> | null; product?: unknown } | null | undefined): SoldPlan {
  if (!price) return "starter"
  for (const plan of ["starter", "pro", "growth"] as const) {
    if (price.id === STRIPE_PRICE_IDS[plan].monthly || price.id === STRIPE_PRICE_IDS[plan].annual) return plan
  }
  if (price.id === STRIPE_PRICE_IDS.fullservice.monthly) return "fullservice"
  const meta = price.metadata?.alphaa_plan
  if (meta === "starter" || meta === "pro" || meta === "growth") return meta
  const name = typeof price.product === "object" && price.product && "name" in price.product ? String((price.product as { name?: string }).name ?? "") : ""
  if (/growth/i.test(name)) return "growth"
  if (/full/i.test(name)) return "fullservice"
  if (/\bpro\b/i.test(name)) return "pro"
  return "starter"
}
