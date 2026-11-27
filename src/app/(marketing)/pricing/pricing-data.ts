import { GROWTH_ON_SALE, GROWTH_EARLY_ACCESS_HREF, GROWTH_CTA } from "@/lib/growth"
import { GROWTH_FEATURES, PRO_FEATURES, STARTER_FEATURES } from "@/lib/plan-features"
import { PLAN_PRICES, EXTRA_AD_ACCOUNT_PRICE, ANNUAL_DISCOUNT_PERCENT } from "@/lib/constants"

// Plans + billing FAQs, shared by the homepage, the pricing page and their structured data.
// Plans set 2026-11-26 (owner decision). Card order left → right: Growth (the price anchor),
// Pro (recommended), Starter. `annual` = per-month price billed yearly, `annualTotal` = the year.
export type PricingPlan = {
  key: "starter" | "pro" | "growth"
  name: string
  monthly: number
  annual: number
  annualTotal: number
  /** One line: who it's for. */
  tagline: string
  description: string
  highlight: boolean
  badge?: string
  features: string[]
  cta: string
  /** Early access: a link instead of checkout. */
  href?: string
  /** Shown under the price, e.g. the extra ad account price. */
  extra?: { monthly: string; annual: string }
  priceId: { monthly: string; annual: string }
}

export const plans: PricingPlan[] = [
  {
    key: "growth",
    name: "Growth",
    ...PLAN_PRICES.growth,
    tagline: "Your ads too, when ads open.",
    description: "Everything in Pro, plus Google and Meta ads for 1 ad account, built and tuned every week once Google and Meta approve ads access. Early access: nobody is charged until then.",
    highlight: false,
    badge: GROWTH_ON_SALE ? "New" : "Early access",
    features: GROWTH_FEATURES,
    cta: GROWTH_CTA,
    href: GROWTH_ON_SALE ? undefined : GROWTH_EARLY_ACCESS_HREF,
    extra: {
      monthly: `+$${EXTRA_AD_ACCOUNT_PRICE.monthly}/month per extra ad account`,
      annual: `+$${EXTRA_AD_ACCOUNT_PRICE.annual}/month per extra ad account, billed yearly`,
    },
    priceId: { monthly: "growth_monthly", annual: "growth_annual" },
  },
  {
    key: "pro",
    name: "Pro",
    ...PLAN_PRICES.pro,
    tagline: "All your marketing. Everything except ads.",
    description: "Everything in Starter, plus social posts ready to publish in one tap, Google Business Profile posts, review replies, emails to past customers and lead tracking, for up to 3 locations.",
    highlight: true,
    badge: "Recommended",
    features: PRO_FEATURES,
    cta: "Get started",
    priceId: { monthly: "pro_monthly", annual: "pro_annual" },
  },
  {
    key: "starter",
    name: "Starter",
    ...PLAN_PRICES.starter,
    tagline: "Get named by ChatGPT, Gemini, Claude and Perplexity.",
    description: "AI search, done every week: I check what the AIs say about you, fix wrong facts and your website, and write blog posts that answer what customers ask AI.",
    highlight: false,
    features: STARTER_FEATURES,
    cta: "Get started",
    priceId: { monthly: "starter_monthly", annual: "starter_annual" },
  },
]

/** Where a plan's button goes for the picked billing period. */
export const planHref = (p: PricingPlan, annual: boolean) => p.href ?? `/signup?plan=${p.priceId[annual ? "annual" : "monthly"]}`

export const ANNUAL_LABEL = `Annual · save ${ANNUAL_DISCOUNT_PERCENT}%`

export const billingFaqs = [
  { q: "Is there a free trial?", a: "No. The free check at /start shows what the AIs say about you today and plans your first week of marketing, and that's the trial. Plans are month to month from day one." },
  { q: "What is the AI Visibility Guarantee?", a: "If none of ChatGPT, Gemini, Claude or Perplexity names your business within your first 90 days on a paid plan, your next month is free. The weekly checks run automatically; there's nothing to switch on. Your plan must be active at day 90. We apply the credit automatically (through Shopify billing if Shopify bills you) — you don't have to ask. Once per customer." },
  { q: "Is there a discount for paying yearly?", a: `Yes, ${ANNUAL_DISCOUNT_PERCENT}% off every plan: Starter is $${PLAN_PRICES.starter.annual} a month billed yearly ($${PLAN_PRICES.starter.annualTotal.toLocaleString("en-US")} a year), Pro is $${PLAN_PRICES.pro.annual} a month ($${PLAN_PRICES.pro.annualTotal.toLocaleString("en-US")} a year) and Growth is $${PLAN_PRICES.growth.annual} a month ($${PLAN_PRICES.growth.annualTotal.toLocaleString("en-US")} a year). Yearly billing is in US dollars.` },
  { q: "What's the difference between the plans?", a: "Starter is AI search: getting your business named by ChatGPT, Gemini, Claude and Perplexity, with weekly checks, website fixes and blog posts. Pro is everything except ads: it adds your social media, Google Business Profile posts, review replies, emails to past customers and lead tracking, for up to 3 locations. Growth adds Google and Meta ads for 1 ad account." },
  { q: "Can I cancel anytime?", a: "Yes. Online in a minute, in Billing. No phone calls, no contracts, no exit fees." },
  { q: "Do I need technical skills?", a: "No. Your agent writes, fixes and publishes; you approve with one tap. If your site isn't on WordPress, Shopify or Webflow, I email your web person the exact change." },
  { q: "Can I switch plans?", a: "Yes. Upgrade or downgrade anytime from your billing settings." },
  { q: "Do you have a discount for more than one brand?", a: "Yes. Every extra brand or website on the same login is 50% off its plan, for as long as you keep it. Each brand gets its own voice, results and marketing. Add one from the website menu in your dashboard." },
  { q: "Do you manage ads?", a: `On the Growth plan, $${PLAN_PRICES.growth.monthly} a month for 1 ad account and $${EXTRA_AD_ACCOUNT_PRICE.monthly} a month for each extra ad account. Growth is in early access while Google and Meta approve ads access, so nobody is charged for it yet: join early access and we'll set you up first. Your ad budget is paid to Google and Meta directly from your own ad accounts, we never mark it up, and nothing spends until you approve it.` },
  { q: "Do you offer refunds?", a: "Yes, on your first charge: if you're not satisfied, email hi@alphaa.app from your account email within 7 calendar days of your first paid charge and we refund it in full. Later charges and renewals aren't refunded; cancelling stops the next renewal. See Terms, Section 5." },
]
