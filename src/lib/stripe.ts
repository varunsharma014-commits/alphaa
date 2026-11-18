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

// Plans set 2026-11-18: Starter $99 ($79/mo yearly), Pro $399 ($319/mo yearly), Growth $499
// ($399/mo yearly, early access). Checkout checks each price's amount against PLAN_PRICES before
// using it (api/stripe/checkout verifiedPrice), so an old price id left in env is never charged.
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

