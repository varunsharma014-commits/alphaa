import React from "react"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { mailingAddress, sendMarketingEmail } from "@/lib/marketing-email"
import { isEmailSuppressed, unsubscribeLinks } from "@/lib/unsubscribe"
import NurtureEmail from "@/emails/NurtureEmail"

// One email when a subscription checkout expires unpaid (Stripe
// checkout.session.expired). The guarantee + 7-day refund + a link back.
// Once per account ever (deduped via the activity ledger), never to someone
// who is already subscribed, unsubscribed, or when there's no mailing address.

const EMAIL_KEY = "checkout-abandoned"

export async function sendAbandonedCheckoutEmail(session: {
  id: string
  mode?: string | null
  customer?: string | { id: string } | null
}): Promise<void> {
  if (session.mode !== "subscription") return
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
  if (!customerId) return

  const address = mailingAddress()
  if (!address) {
    console.log("[abandoned-checkout] COMPANY_MAILING_ADDRESS is not set: not sending")
    return
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return

  const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } })
  if (!user?.email) return
  if (["active", "trialing", "past_due"].includes(user.subscriptionStatus ?? "")) return

  const prior = await db.mockActivity.findMany({
    where: { userId: user.id, type: "email_sent" },
    select: { metadata: true },
  })
  if (prior.some((r) => (r.metadata as { emailKey?: string } | null)?.emailKey === EMAIL_KEY)) return
  if (await isEmailSuppressed(user.email)) return

  const unsub = unsubscribeLinks(`u_${user.id}`, user.email)
  if (!unsub) return

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  const name = user.businessName?.trim()

  // Log first so a webhook retry can't double-send; roll back on failure.
  await logActivity(user.id, "email_sent", "We emailed you about your unfinished checkout", undefined, {
    emailKey: EMAIL_KEY,
    checkoutSessionId: session.id,
  })
  try {
    await sendMarketingEmail({
      to: user.email,
      subject: "You were one step from starting",
      unsub,
      react: React.createElement(NurtureEmail, {
        preview: "No charge was made. Here's what protects you if you start.",
        blocks: [
          { kind: "p", text: `You started checkout${name ? ` for ${name}` : ""} but didn't finish. No charge was made.` },
          { kind: "p", text: "In case it helps you decide:" },
          {
            kind: "bullets",
            items: [
              "7-day refund on your first charge, no questions asked.",
              "90-day AI Visibility Guarantee. If none of ChatGPT, Gemini, Claude or Perplexity names you in our weekly checks in your first 90 days, your next month is free. Once per customer.",
              "Month to month. Cancel in two clicks.",
            ],
          },
          { kind: "p", text: "If something went wrong at checkout, reply and tell me. A person reads every reply." },
        ],
        cta: { label: "Pick up where you left off", href: `${base}/onboarding?utm_source=email&utm_medium=lifecycle&utm_campaign=checkout-abandoned` },
        footer: { reason: "You’re getting this because you started checkout at alphaa.app.", address, unsubscribeUrl: unsub.pageUrl },
      }),
    })
  } catch (err) {
    console.error("[abandoned-checkout] send failed", user.id, err)
    await db.mockActivity
      .deleteMany({ where: { userId: user.id, type: "email_sent", metadata: { path: ["checkoutSessionId"], equals: session.id } } })
      .catch(() => {})
  }
}
