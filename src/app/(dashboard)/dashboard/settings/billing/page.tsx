export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { GROWTH_ON_SALE } from "@/lib/growth"
import { getAgentSettings } from "@/lib/agent/settings"
import { EXTRA_AD_ACCOUNT_PRICE, PLAN_PRICES } from "@/lib/constants"
import { billingSummary } from "@/lib/billing-summary"
import { pageTitle } from "@/lib/page-title"
import { BillingView } from "@/components/workspace/settings/BillingView"

export const metadata = { title: pageTitle("Plan & billing") }

const NAME = { starter: "Starter", pro: "Pro", growth: "Growth" } as const

// Shopify merchants manage their plan in Shopify admin and never see Stripe (App Store rule 1.2.1).
// Growth customers billed by Stripe get an "Ad accounts" stepper (the Extra ad account add-on),
// only while Growth is on sale (NEXT_PUBLIC_GROWTH_ON_SALE). Stripe is read only here.
export default async function BillingSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/dashboard")
  const [shop, summary] = await Promise.all([shopifyMerchantShop(user), billingSummary(user)])
  const adAccounts = GROWTH_ON_SALE && !shop && summary.source === "stripe" && summary.plan === "growth"
    ? { extra: summary.extraAdAccounts || ((await getAgentSettings(user.id)).billing?.extraAdAccounts ?? 0), monthly: EXTRA_AD_ACCOUNT_PRICE.monthly, annual: EXTRA_AD_ACCOUNT_PRICE.annual, plan: PLAN_PRICES.growth.monthly }
    : null
  return <BillingView data={{ summary, planName: summary.plan ? NAME[summary.plan] : null, shopifyUrl: shop ? shopifyPricingUrl(shop) : null, adAccounts }} />
}
