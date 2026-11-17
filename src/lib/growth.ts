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
  "A full week of marketing done in one tap, or just say it out loud",
  "Social posts that sound like you and look like your brand",
  "Emails that keep past customers coming back",
  "Google and Meta ads that reach people looking for what you sell",
  "Less wasted ad spend: I tune your ads every week",
  "See which calls, emails and forms your marketing brought in",
  "Your ad budget goes straight to Google and Meta. We never take a cut.",
]
