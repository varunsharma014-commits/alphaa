export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { sendPaymentFailureEmail } from "@/lib/email"
import { resend } from "@/lib/resend"
import { fromAs } from "@/lib/email-sender"
import { logActivity } from "@/lib/activity"
import { SUPPORT_EMAIL } from "@/lib/constants"
import { sendAbandonedCheckoutEmail } from "@/lib/abandoned-checkout"

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
        // A Shopify-billed account ("shopify:" marker, lib/billing.ts) that checks out here becomes
        // Stripe-billed; Shopify webhooks only clear rows still carrying their marker.
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: trialEnd ? "trialing" : "active",
            plan,
            trialEndsAt: trialEnd,
          },
        })
        await flagFirstMarketCustomer(customerId, sub.metadata?.market)
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
              from: fromAs("Alphaa"),
              to: SUPPORT_EMAIL,
              subject: `💰 Setup PAID — ${user.businessName || user.email}`,
              text: `${user.businessName || "Unknown business"} (${user.email}) paid the setup fee.\n\nSLA: Install and verify within 2 business days.\nWebsite: ${user.websiteUrl || "not set"}\nIntake details: the "concierge_request" activity for user ${user.id} (or the earlier intake email).`,
            })
          } catch (e) {
            console.error("Concierge notification email failed:", e)
          }
        }
      }
      break
    }
    case "checkout.session.expired": {
      // Unpaid subscription checkout timed out: one reminder (guarantee +
      // refund), deduped per account. Never fail the webhook over email.
      try {
        await sendAbandonedCheckoutEmail(sub)
      } catch (e) {
        console.error("Abandoned checkout email failed:", e)
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
          : null
        try {
          await sendPaymentFailureEmail(user.email, {
            firstName: user.fullName?.trim().split(/\s+/)[0] || null,
            // The business, never the person's name; null reads "your business".
            businessName: user.businessName?.trim() || null,
            amount,
            retryDate,
            updateUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"}/dashboard/settings/billing`,
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

const MARKET_NAMES: Record<string, string> = { uk: "United Kingdom", de: "Germany", fr: "France", it: "Italy", ae: "UAE (English)", ar: "UAE (Arabic)" }

// Varun, 2026-10-30: translate the report, weekly briefing and emails for a
// market only once it has its first paying customer. The first paid checkout
// that came through a market page emails the team that reminder, once per market.
async function flagFirstMarketCustomer(customerId: string, market: string | undefined) {
  if (!market || !MARKET_NAMES[market]) return
  try {
    const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
    if (!user) return
    const seen = await db.mockActivity.count({ where: { type: "market_customer", metadata: { path: ["market"], equals: market } } })
    await logActivity(user.id, "market_customer", "New customer", `Signed up through the ${MARKET_NAMES[market]} page.`, { market })
    if (seen > 0) return
    await resend.emails.send({
      from: fromAs("Alphaa"),
      to: SUPPORT_EMAIL,
      subject: `🌍 First paying customer in ${MARKET_NAMES[market]}: time to translate`,
      text:
        `${user.businessName || user.email} (${user.email}) just became the first paying customer through alphaa.app/${market === "ar" ? "ae/ar" : market}.\n\n` +
        `Reminder you asked for (2026-10-30): now translate the scan report, the weekly briefing and the customer emails for ${MARKET_NAMES[market]}. ` +
        `Until then this customer gets them in English.\n\nAsk Claude: "translate Alphaa's report, briefing and emails for ${MARKET_NAMES[market]}".`,
    })
  } catch (e) {
    console.error("[stripe] first market customer check failed", market, e)
  }
}
