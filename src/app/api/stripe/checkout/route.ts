export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { stripe, STRIPE_PRICE_IDS, STRIPE_SETUP_FEE_PRICE_ID } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // `purchase` is the concierge path — named products resolved server-side so
  // the client never chooses an arbitrary price for them.
  const { priceId, purchase } = await req.json()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  let stripeCustomerId = user.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.fullName ?? undefined })
    stripeCustomerId = customer.id
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId } })
  }

  // One-time white-glove setup fee ($149) — payment mode, no subscription.
  if (purchase === "setup") {
    if (!STRIPE_SETUP_FEE_PRICE_ID) {
      return NextResponse.json({ error: "Setup service is not available right now" }, { status: 500 })
    }
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: STRIPE_SETUP_FEE_PRICE_ID, quantity: 1 }],
      mode: "payment",
      metadata: { purpose: "concierge_setup", userId: user.id },
      success_url: `${appUrl}/dashboard/concierge?paid=1`,
      cancel_url: `${appUrl}/dashboard/concierge`,
    })
    return NextResponse.json({ url: session.url })
  }

  // Full Service subscription ($299/mo, human-fulfilled). No trial: a person
  // starts doing real work immediately.
  if (purchase === "fullservice") {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{ price: STRIPE_PRICE_IDS.fullservice.monthly, quantity: 1 }],
      mode: "subscription",
      payment_method_collection: "always",
      success_url: `${appUrl}/dashboard/concierge?upgraded=1`,
      cancel_url: `${appUrl}/dashboard/concierge`,
    })
    return NextResponse.json({ url: session.url })
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    subscription_data: { trial_period_days: 14 },
    payment_method_collection: "always",
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
  })

  return NextResponse.json({ url: session.url })
}
