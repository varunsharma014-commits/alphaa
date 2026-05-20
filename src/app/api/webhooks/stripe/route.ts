export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const sub = (event.data.object as any)

  switch (event.type) {
    case "checkout.session.completed": {
      const customerId = sub.customer as string
      const subscriptionId = sub.subscription as string
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
        const priceId = subscription.items.data[0]?.price.id ?? ""
        const plan = getPlanFromPriceId(priceId)
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { stripeSubscriptionId: subscriptionId, subscriptionStatus: "trialing", plan, trialEndsAt: trialEnd },
        })
      }
      break
    }
    case "customer.subscription.updated": {
      const plan = getPlanFromPriceId(sub.items?.data[0]?.price.id ?? "")
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: sub.status, plan },
      })
      break
    }
    case "customer.subscription.deleted": {
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: "cancelled", plan: "none" },
      })
      break
    }
    case "invoice.payment_succeeded": {
      await db.user.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { subscriptionStatus: "active" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}

function getPlanFromPriceId(priceId: string) {
  const ids = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!]: "starter",
    [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!]: "starter",
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]: "pro",
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID!]: "pro",
  }
  return ids[priceId] ?? "starter"
}
