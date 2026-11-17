// The Growth plan ($499/mo, decided 2026-11-17): everything in Pro, plus social posts, tracking
// setup, and Google + Meta ads built and tuned by the agent.
//
// Ads and social posting need platform approvals (Google Ads API developer token, Meta app
// review, LinkedIn posting access). Until those land the plan is shown as early access and
// nobody is charged for it: set NEXT_PUBLIC_GROWTH_ON_SALE=1 to open checkout.
export const GROWTH_ON_SALE = process.env.NEXT_PUBLIC_GROWTH_ON_SALE === "1"

export const GROWTH_EARLY_ACCESS_HREF = "mailto:hi@alphaa.app?subject=Growth%20plan%20early%20access"

export const GROWTH_FEATURES = [
  "Everything in Pro",
  "Social posts written for you to approve: Facebook, Instagram, LinkedIn",
  "Google Analytics and Meta Pixel set up and checked on your site",
  "Google and Meta ad campaigns built for you, paused until you approve",
  "Weekly ad tuning: cut wasted spend, refresh ads, move budget to what works",
  "Ad spend is paid to Google and Meta directly, never marked up",
]
