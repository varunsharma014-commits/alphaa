import { GROWTH_ON_SALE, GROWTH_EARLY_ACCESS_HREF } from "@/lib/growth"
import { GROWTH_FEATURES, PRO_FEATURES, STARTER_FEATURES } from "@/lib/plan-features"
import { PLAN_PRICES } from "@/lib/constants"

// Plans + billing FAQs, shared by the pricing page and its structured data.
// Three plans (owner decision 2026-11-18). `annual` = per-month price billed yearly.
export const plans = [
  {
    name: "Starter",
    monthly: PLAN_PRICES.starter.monthly,
    annual: PLAN_PRICES.starter.annual,
    description: "SEO and AI search, done every week: Google posts, blog posts, review replies and website fixes.",
    highlight: false,
    features: STARTER_FEATURES,
    cta: "Get started",
    priceId: { monthly: "starter_monthly", annual: "starter_annual" },
  },
  {
    name: "Pro",
    monthly: PLAN_PRICES.pro.monthly,
    annual: PLAN_PRICES.pro.annual,
    description: "Everything in Starter, plus your social media, more posts, more locations, and posts that publish on their own.",
    highlight: true,
    badge: "Most popular",
    features: PRO_FEATURES,
    cta: "Get started",
    priceId: { monthly: "pro_monthly", annual: "pro_annual" },
  },
  {
    name: "Growth",
    monthly: PLAN_PRICES.growth.monthly,
    annual: PLAN_PRICES.growth.annual,
    description: "Everything in Pro, plus Google and Meta ads, email and lead tracking. Your whole marketing, handled.",
    highlight: false,
    badge: GROWTH_ON_SALE ? "New" : "Early access",
    features: GROWTH_FEATURES,
    cta: GROWTH_ON_SALE ? "Get Growth" : "Get early access",
    href: GROWTH_ON_SALE ? undefined : GROWTH_EARLY_ACCESS_HREF,
    priceId: { monthly: "growth_monthly", annual: "growth_annual" },
  },
]

export const billingFaqs = [
  { q: "Is there a free trial?", a: "No. The free check at /start shows what the AIs say about you today and plans your first week of marketing, and that's the trial. Plans are month to month from day one." },
  { q: "What is the AI Visibility Guarantee?", a: "If, in your first 90 days on a paid plan, none of ChatGPT, Gemini, Claude or Perplexity names your business in any of our weekly checks, your next month is free. Your plan must be active at day 90. We apply the credit automatically (through Shopify billing if Shopify bills you) — you don't have to ask. Once per customer." },
  { q: "Can I cancel anytime?", a: "Yes. Online in a minute, in Billing. No phone calls, no contracts, no exit fees." },
  { q: "Do I need technical skills?", a: "No. Your agent writes, fixes and publishes; you approve with one tap. If your site isn't on WordPress, Shopify or Webflow, I email your web person the exact change." },
  { q: "Can I switch plans?", a: "Yes. Upgrade or downgrade anytime from your billing settings." },
  { q: "Do you have a discount for more than one brand?", a: "Yes. Every extra brand or website on the same login is 50% off its plan, for as long as you keep it. Each brand gets its own voice, results and marketing. Add one from the website menu in your dashboard." },
  { q: "Does the Growth plan include ad spend?", a: "No. Your ad budget is paid to Google and Meta directly from your own ad accounts, and we never mark it up. Campaigns are built paused, and nothing spends until you approve it." },
  { q: "Do you offer refunds?", a: "Yes, on your first charge: if you're not satisfied, email hi@alphaa.app from your account email within 7 calendar days of your first paid charge and we refund it in full. Later charges and renewals aren't refunded; cancelling stops the next renewal. See Terms, Section 5." },
]

