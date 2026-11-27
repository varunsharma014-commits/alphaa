export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { stripe, planFromPrice, planItem, extraAdAccounts } from "@/lib/stripe"
import { saveAgentSettings } from "@/lib/agent/settings"
import { packFor } from "@/lib/credit-rules"
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
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price.product"] })
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
        // The plan item, never the "Extra ad account" add-on (which can be listed first).
        const plan = planFromPrice(planItem(subscription.items.data)?.price)
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
        await saveAdAllowance({ stripeCustomerId: customerId }, subscriptionId, extraAdAccounts(subscription.items.data))
        await flagFirstMarketCustomer(customerId, sub.metadata?.market)
      } else if (sub.mode === "payment" && sub.metadata?.alphaa_credits) {
        // Usage credits (app/api/stripe/credits): credited once per session id, only when paid.
        if (sub.payment_status === "paid") {
          const credits = Number(sub.metadata.alphaa_credits)
          const userId = (sub.metadata.userId as string | undefined) ?? (await db.user.findFirst({ where: { stripeCustomerId: customerId }, select: { id: true } }))?.id
          if (userId && packFor(credits)) {
            const { grantCredits } = await import("@/lib/credits")
            const added = await grantCredits({ userId, sessionId: sub.id, credits, paymentIntent: (sub.payment_intent as string | null) ?? null, amount: sub.amount_total ?? undefined, currency: sub.currency ?? undefined })
            if (added) await logActivity(userId, "credits_bought", `Bought ${credits} credits`, "They're used only when your plan's included work runs out, and last 12 months.", { credits, sessionId: sub.id })
          } else console.error("[stripe] credits session without a brand or pack", sub.id)
        }
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
      // The event's price has metadata but an unexpanded product id; planFromPrice handles both.
      const plan = planFromPrice(planItem(sub.items?.data)?.price)
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: sub.status, plan },
      })
      await saveAdAllowance({ stripeSubscriptionId: sub.id }, sub.id, extraAdAccounts(sub.items?.data))
      break
    }
    case "customer.subscription.deleted": {
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: "cancelled", plan: "none" },
      })
      await saveAdAllowance({ stripeSubscriptionId: sub.id }, sub.id, 0)
      break
    }
    case "charge.refunded": {
      // A refunded credit pack loses what's left of it (a share of it for a partial refund).
      // Needs "charge.refunded" enabled on the Stripe webhook endpoint.
      if (sub.payment_intent) { // any charge: only one matching a credit purchase in the ledger changes anything
        try {
          const { refundCredits } = await import("@/lib/credits")
          const r = await refundCredits({ paymentIntent: sub.payment_intent as string, chargeId: sub.id, amount: sub.amount ?? 0, amountRefunded: sub.amount_refunded ?? 0 })
          if (r) console.log(`[stripe] refund removed ${r.credits} credits`, r.userId)
        } catch (e) {
          console.error("[stripe] credit refund", e instanceof Error ? e.message : e)
          return NextResponse.json({ error: "retry" }, { status: 500 })
        }
      }
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

// Growth's ad-account allowance = 1 + the "Extra ad account" quantity on the subscription
// (lib/ad-accounts.ts). Kept in agent settings `billing` so nothing reads Stripe on each check.
// Only writes when the number changed or was never written; never fails the webhook.
async function saveAdAllowance(where: { stripeCustomerId: string } | { stripeSubscriptionId: string }, subscriptionId: string, extra: number) {
  try {
    const users = await db.user.findMany({ where, select: { id: true } })
    const { getAgentSettings } = await import("@/lib/agent/settings")
    for (const u of users) {
      const cur = (await getAgentSettings(u.id)).billing
      if (cur && cur.extraAdAccounts === extra && cur.subscriptionId === subscriptionId) continue
      if (!cur && extra === 0) continue
      await saveAgentSettings(u.id, { billing: { extraAdAccounts: extra, subscriptionId, at: new Date().toISOString() } })
    }
  } catch (e) {
    console.error("[stripe] ad-account allowance", e instanceof Error ? e.message : e)
  }
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
