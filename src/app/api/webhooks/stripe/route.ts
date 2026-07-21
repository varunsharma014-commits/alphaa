export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { sendPaymentFailureEmail } from "@/lib/email"
import { resend } from "@/lib/resend"
import { logActivity } from "@/lib/activity"
import { SUPPORT_EMAIL } from "@/lib/constants"

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
        // Full Service checkouts carry no trial, so their status is active.
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: trialEnd ? "trialing" : "active",
            plan,
            trialEndsAt: trialEnd,
          },
        })
      } else if (sub.mode === "payment" && sub.metadata?.purpose === "concierge_setup") {
        // One-time white-glove setup fee paid — a human owes this customer a
        // completed installation within the stated SLA. Record it and alert
        // the team; the intake details arrived via /api/concierge.
        const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
        if (user) {
          await logActivity(
            user.id,
            "concierge_paid",
            "White-glove setup booked",
            "A real person from alphaa will install your code within 2 business days.",
            { checkoutSessionId: sub.id }
          )
          try {
            await resend.emails.send({
              from: `Alphaa <${process.env.RESEND_FROM_EMAIL}>`,
              to: SUPPORT_EMAIL,
              subject: `💰 White-glove setup PAID — ${user.businessName ?? user.email}`,
              text: `${user.businessName ?? "Unknown business"} (${user.email}) paid the $149 setup fee.\n\nSLA: install + verify within 2 business days.\nIntake details: see the "concierge_request" activity for user ${user.id} (or the earlier intake email).\nWebsite: ${user.websiteUrl ?? "not set"}`,
            })
          } catch (e) {
            console.error("Concierge notification email failed:", e)
          }
        }
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
    case "invoice.payment_failed": {
      const user = await db.user.findFirst({ where: { stripeCustomerId: sub.customer as string } })
      if (user?.email) {
        const amount = `$${((sub.amount_due ?? 0) / 100).toFixed(2)}`
        const retryDate = sub.next_payment_attempt
          ? new Date(sub.next_payment_attempt * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : "soon"
        try {
          await sendPaymentFailureEmail(user.email, {
            firstName: user.fullName?.split(" ")[0] ?? "there",
            businessName: user.fullName ?? "your business",
            amount,
            retryDate,
            updateUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
          })
        } catch (e) {
          console.error("Payment failure email failed:", e)
        }
      }
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
    [process.env.STRIPE_FULLSERVICE_MONTHLY_PRICE_ID!]: "fullservice",
  }
  return ids[priceId] ?? "starter"
}
