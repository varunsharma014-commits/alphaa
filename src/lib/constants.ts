// Three plans on sale (owner decision 2026-11-18): Starter, Pro, Growth (early access).
// "fullservice" is retired from sale (no subscribers ever); it stays here so any old row keeps
// working, and every gate treats it as Pro-level (lib/billing.ts hasPro).
export const PLANS = {
  NONE: "none",
  STARTER: "starter",
  PRO: "pro",
  GROWTH: "growth",
  FULLSERVICE: "fullservice",
} as const

export const PLAN_NAMES = {
  none: "No plan",
  starter: "Starter",
  pro: "Pro",
  growth: "Growth",
  fullservice: "Full Service (retired)",
} as const

// Plans set 2026-11-26 (owner decision): Starter $99 = AI search (AEO) only, Pro $499 = everything
// except ads, Growth $799 = Pro + ads for 1 ad account (early access until ads open).
// USD. `monthly` = billed monthly; `annualTotal` = what one year costs billed yearly (15% off,
// rounded to $10); `annual` = that yearly total shown per month (rounded down to the dollar).
// Checkout (api/stripe/checkout verifiedPrice) charges `annualTotal` on the yearly Stripe price.
export const PLAN_PRICES = {
  starter: { monthly: 99, annual: 84, annualTotal: 1010 },
  pro: { monthly: 499, annual: 424, annualTotal: 5090 },
  growth: { monthly: 799, annual: 679, annualTotal: 8150 },
  // Retired, not sold: what a legacy row paid (monthly only).
  fullservice: { monthly: 299, annual: 299, annualTotal: 3588 },
} as const

/** Annual billing discount, in percent, on every plan. */
export const ANNUAL_DISCOUNT_PERCENT = 15

/** Growth includes ads for 1 ad account; each extra ad account costs this (USD a month). */
export const EXTRA_AD_ACCOUNT_PRICE = { monthly: 200, annual: 170, annualTotal: 2040 } as const

export const SUPPORT_EMAIL = "hi@alphaa.app"

export const ROUTES = {
  HOME: "/",
  SCAN: "/scan",
  PRICING: "/pricing",
  HOW_IT_WORKS: "/how-it-works",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  SETTINGS: "/dashboard/settings",
} as const

export const BUSINESS_TYPES = [
  "Dentist",
  "Lawyer / Law Firm",
  "Med Spa",
  "Plumber",
  "Electrician",
  "HVAC",
  "General Contractor",
  "Real Estate Agent",
  "Restaurant",
  "Retail Store",
  "Chiropractor",
  "Physical Therapist",
  "Accountant / CPA",
  "Insurance Agent",
  "Salon / Barbershop",
  "Auto Repair",
  "Landscaping",
  "Cleaning Service",
  "Photographer",
  "SaaS / Software",
  "Marketing or Ad Agency",
  "Ecommerce / Online Store",
  "Consulting",
  "Professional Services",
  "B2B Services",
  "Agency",
  "Online Education",
  "Media / Publishing",
  "Financial Services",
  "Manufacturing",
  "Nonprofit",
  "Other",
] as const

export const AI_ENGINES = ["chatgpt", "perplexity", "google_ai", "gemini"] as const

export const SCAN_MESSAGES = [
  "I’m checking your Google listing…",
  "I’m asking ChatGPT about your business…",
  "I’m reading your website the way AI does…",
  "I’m looking at who else nearby gets named…",
  "I’m reading the answers AI gives about your area…",
  "I’m checking which sites AI quotes about you…",
  "I’m comparing you with the businesses AI recommends…",
  "I’m adding up what I found…",
]
