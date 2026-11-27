// The Growth plan ($499/mo, $399/mo billed yearly; plans set 2026-11-18): everything in Pro,
// plus email campaigns and lead tracking. Social media moved down to Pro on 2026-11-18.
// Ads (Google + Meta) are NOT in Growth: they move to a new top plan above it (owner decision
// 2026-11-26, price not set) and are sold as "Coming soon" until Google and Meta approve access.
//
// Ads need platform approvals (Google Ads API developer token, Meta app review). Until those
// land the plan is shown as early access and nobody is charged for it: set
// NEXT_PUBLIC_GROWTH_ON_SALE=1 to open checkout.
export const GROWTH_ON_SALE = process.env.NEXT_PUBLIC_GROWTH_ON_SALE === "1"

export const GROWTH_EARLY_ACCESS_HREF = "mailto:hi@alphaa.app?subject=Growth%20plan%20early%20access"

export const GROWTH_FEATURES = [
  "Everything in Pro",
  "Emails that keep past customers coming back",
  "See which calls, emails and forms your marketing brought in",
]
