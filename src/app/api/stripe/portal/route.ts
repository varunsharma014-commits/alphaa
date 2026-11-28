export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { shopifyBilledShop } from "@/lib/billing"
import { shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { requireCan } from "@/lib/team/actor"

// Stripe Customer Portal. Body `{ flow?: "cancel" | "update" | "card" }` opens the portal straight
// on that task (Stripe's own cancel confirmation, plan switch, card update), so "Cancel my plan"
// is a real cancel step instead of the general page. If Stripe refuses the flow (portal settings
// don't allow it), it falls back to the general portal page.
export async function POST(req: NextRequest) {
  { const denied = await requireCan("billing"); if (denied) return denied } // teams (lib/team)
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  // Billed through Shopify Managed Pricing: the plan is managed (and cancelled) in Shopify admin.
  const shop = user ? shopifyBilledShop(user) : null
  if (shop) return NextResponse.json({ url: shopifyPricingUrl(shop) })
  if (!user?.stripeCustomerId) return NextResponse.json({ error: "No billing found" }, { status: 404 })

  const body = (await req.json().catch(() => ({}))) as { flow?: unknown }
  const flow = body.flow === "cancel" || body.flow === "update" || body.flow === "card" ? body.flow : null
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`
  const sub = user.stripeSubscriptionId?.startsWith("sub_") ? user.stripeSubscriptionId : null

  let flow_data: NonNullable<Parameters<typeof stripe.billingPortal.sessions.create>[0]>["flow_data"]
  const back = { type: "redirect" as const, redirect: { return_url: returnUrl } }
  if (flow === "cancel" && sub) flow_data = { type: "subscription_cancel", subscription_cancel: { subscription: sub }, after_completion: back }
  else if (flow === "update" && sub) flow_data = { type: "subscription_update", subscription_update: { subscription: sub }, after_completion: back }
  else if (flow === "card") flow_data = { type: "payment_method_update", after_completion: back }

  if (flow_data) {
    try {
      const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: returnUrl, flow_data })
      return NextResponse.json({ url: session.url })
    } catch (e) {
      console.error("[portal] flow refused, opening the general page", flow, e instanceof Error ? e.message : e)
    }
  }

  const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: returnUrl })
  return NextResponse.json({ url: session.url })
}
