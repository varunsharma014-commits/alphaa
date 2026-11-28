export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPaidPlan, isComped } from "@/lib/billing"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { GROWTH_CTA, GROWTH_EARLY_ACCESS_HREF, GROWTH_ON_SALE } from "@/lib/growth"
import { ANNUAL_DISCOUNT_PERCENT, EXTRA_AD_ACCOUNT_PRICE } from "@/lib/constants"
import { plans as PRICING_PLANS } from "@/app/(marketing)/pricing/pricing-data"
import { seatCap } from "@/lib/quota-rules"
import { getAgentSettings } from "@/lib/agent/settings"
import { billingSummary, planKeyOf } from "@/lib/billing-summary"
import { pageTitle } from "@/lib/page-title"
import { PlansView, type CompareRow, type PlanInfo, type PlanKey } from "@/components/workspace/settings/PlansView"

export const metadata = { title: pageTitle("Plans") }

// Moving an existing customer between plans (plans set 2026-11-26): the same three cards as the
// marketing pricing page (pricing-data.ts `plans`: Growth → Pro (Recommended) → Starter). Moving
// up switches the price on the current Stripe subscription (api/stripe/checkout, prorated), so
// nobody ends up with two subscriptions; moving down goes through billing. `?plan=pro|growth`
// rings and scrolls to that card.
export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/dashboard")
  const asked = (await searchParams).plan
  const comped = isComped(user.email)
  const current = comped ? null : planKeyOf(user.plan)
  if (!hasPaidPlan(user) && !comped) redirect(`/onboarding?plan=${asked === "growth" || asked === "starter" ? asked : "pro"}`)

  const [shop, summary, settings] = await Promise.all([
    shopifyMerchantShop(user),
    billingSummary(user),
    getAgentSettings(user.id).catch(() => null),
  ])

  const plans: PlanInfo[] = PRICING_PLANS.map((p) => {
    const [first, ...rest] = p.features
    const inc = /^Everything in /i.test(first ?? "") ? first : null
    return { key: p.key, name: p.name, tagline: p.tagline, monthly: p.monthly, annual: p.annual, annualTotal: p.annualTotal, includes: inc, features: inc ? rest : p.features }
  })

  // Side by side, from the same promises as plan-features.ts (and the real seat caps).
  const seats = (k: PlanKey) => { const n = seatCap(k); return n > 0 ? `${n} people` : false }
  const compare: CompareRow[] = [
    { label: "Weekly AI search checks", sub: "ChatGPT, Gemini, Claude, Perplexity", values: { growth: true, pro: true, starter: true } },
    { label: "Customer questions put to AI", sub: "Every week", values: { growth: "20", pro: "20", starter: "10" } },
    { label: "Blog posts a month", values: { growth: "4", pro: "4", starter: "2" } },
    { label: "Wrong facts caught and fixed", values: { growth: true, pro: true, starter: true } },
    { label: "Business locations", values: { growth: "3", pro: "3", starter: "1" } },
    { label: "Social posts", sub: "Facebook, Instagram, LinkedIn", values: { growth: "3 a week", pro: "3 a week", starter: false } },
    { label: "Google Business Profile posts", values: { growth: "4 a week", pro: "4 a week", starter: false } },
    { label: "Replies to your Google reviews", values: { growth: true, pro: true, starter: false } },
    { label: "Emails to past customers", values: { growth: true, pro: true, starter: false } },
    { label: "Calls, emails and forms tracked", values: { growth: true, pro: true, starter: false } },
    { label: "Competitor benchmarking", values: { growth: true, pro: true, starter: false } },
    { label: "Team members", values: { growth: seats("growth"), pro: seats("pro"), starter: false } },
    { label: "Posts that publish on their own", values: { growth: true, pro: true, starter: false } },
    { label: "Google or Meta ads", sub: GROWTH_ON_SALE ? undefined : "When ads open", values: { growth: "1 ad account", pro: false, starter: false } },
    { label: "Support", values: { growth: "Priority chat", pro: "Priority chat", starter: "Email" } },
  ]

  return (
    <PlansView
      data={{
        plans,
        current,
        comped,
        billedYearly: summary.source === "stripe" && summary.interval ? summary.interval === "year" : null,
        shopifyUrl: shop ? shopifyPricingUrl(shop) : null,
        growthOnSale: GROWTH_ON_SALE,
        growthHref: GROWTH_EARLY_ACCESS_HREF,
        growthCta: GROWTH_CTA,
        extraAd: { monthly: EXTRA_AD_ACCOUNT_PRICE.monthly, annual: EXTRA_AD_ACCOUNT_PRICE.annual },
        extraAdsNow: summary.source === "stripe" ? summary.extraAdAccounts : settings?.billing?.extraAdAccounts ?? 0,
        discount: ANNUAL_DISCOUNT_PERCENT,
        asked: asked === "starter" || asked === "pro" || asked === "growth" ? asked : null,
        compare,
      }}
    />
  )
}
