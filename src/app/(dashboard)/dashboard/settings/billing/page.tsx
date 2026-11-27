export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { BillingClient } from "./BillingClient"
import { GROWTH_ON_SALE } from "@/lib/growth"
import { hasStripePlan } from "@/lib/billing"
import { getAgentSettings } from "@/lib/agent/settings"
import { EXTRA_AD_ACCOUNT_PRICE, PLAN_PRICES } from "@/lib/constants"

// Shopify merchants manage their plan in Shopify admin and never see Stripe (App Store rule 1.2.1).
// Growth customers billed by Stripe get an "Ad accounts" stepper (the Extra ad account add-on),
// only while Growth is on sale (NEXT_PUBLIC_GROWTH_ON_SALE).
export default async function BillingSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/dashboard")
  const shop = await shopifyMerchantShop(user)
  const adAccounts = GROWTH_ON_SALE && !shop && /growth/i.test(user.plan) && hasStripePlan(user)
    ? { extra: (await getAgentSettings(user.id)).billing?.extraAdAccounts ?? 0, monthly: EXTRA_AD_ACCOUNT_PRICE.monthly, annual: EXTRA_AD_ACCOUNT_PRICE.annual, plan: PLAN_PRICES.growth.monthly }
    : null
  return <BillingClient shopifyUrl={shop ? shopifyPricingUrl(shop) : null} adAccounts={adAccounts} />
}
