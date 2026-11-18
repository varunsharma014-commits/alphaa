// The Growth plan ($499/mo, $399/mo billed yearly; plans set 2026-11-18): everything in Pro,
// plus Google + Meta ads built and tuned by the agent, email campaigns and lead tracking.
// Social media moved down to Pro on 2026-11-18.
//
// Ads need platform approvals (Google Ads API developer token, Meta app review). Until those
// land the plan is shown as early access and nobody is charged for it: set
// NEXT_PUBLIC_GROWTH_ON_SALE=1 to open checkout.
export const GROWTH_ON_SALE = process.env.NEXT_PUBLIC_GROWTH_ON_SALE === "1"

export const GROWTH_EARLY_ACCESS_HREF = "mailto:hi@alphaa.app?subject=Growth%20plan%20early%20access"

export const GROWTH_FEATURES = [
  "Everything in Pro",
  "Google and Meta ads that reach people looking for what you sell",
  "Less wasted ad spend: I tune your ads every week",
  "Emails that keep past customers coming back",
  "See which calls, emails and forms your marketing brought in",
  "Your ad budget goes straight to Google and Meta. We never take a cut.",
]
