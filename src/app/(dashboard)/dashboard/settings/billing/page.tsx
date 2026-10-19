export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { BillingClient } from "./BillingClient"

// Shopify merchants manage their plan in Shopify admin and never see Stripe (App Store rule 1.2.1).
export default async function BillingSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/dashboard")
  const shop = await shopifyMerchantShop(user)
  return <BillingClient shopifyUrl={shop ? shopifyPricingUrl(shop) : null} />
}
