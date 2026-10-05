export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { shopifyBilledShop } from "@/lib/billing"
import { shopifyPricingUrl } from "@/lib/connector/shopify-billing"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  // Billed through Shopify Managed Pricing: the plan is managed (and cancelled) in Shopify admin.
  const shop = user ? shopifyBilledShop(user) : null
  if (shop) return NextResponse.json({ url: shopifyPricingUrl(shop) })
  if (!user?.stripeCustomerId) return NextResponse.json({ error: "No billing found" }, { status: 404 })

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
  })

  return NextResponse.json({ url: session.url })
}
