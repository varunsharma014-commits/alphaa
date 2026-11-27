// The Growth plan ($799/mo, $679/mo billed yearly; plans set 2026-11-26): everything in Pro, plus
// Google or Meta ads management for 1 ad account. Each additional ad account (Google or Meta) is +$200/mo ($170/mo
// billed yearly): EXTRA_AD_ACCOUNT_PRICE in lib/constants.ts. Email and lead tracking moved down
// to Pro on 2026-11-26.
//
// Ads need platform approvals (Google Ads API developer token, Meta app review). Until those
// land the plan is an early-access waitlist and nobody is charged for it: set
// NEXT_PUBLIC_GROWTH_ON_SALE=1 to open checkout (needs STRIPE_GROWTH_*_PRICE_ID on Railway).
export const GROWTH_ON_SALE = process.env.NEXT_PUBLIC_GROWTH_ON_SALE === "1"

export const GROWTH_EARLY_ACCESS_HREF = "mailto:hi@alphaa.app?subject=Growth%20plan%20early%20access"

/** Button text on every Growth card while it's a waitlist. */
export const GROWTH_CTA = GROWTH_ON_SALE ? "Get Growth" : "Join early access"

export const GROWTH_FEATURES = [
  "Everything in Pro",
  "Google or Meta ads for 1 ad account, built and tuned every week, when ads open",
  "Ads aimed at people already searching for what you sell",
  "Your budget moved to the ads that bring calls and bookings",
  "Nothing spends until you approve it. Your ad budget is paid to Google and Meta directly, never marked up",
]
