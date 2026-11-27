export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { stripe, CREDIT_PRICE_IDS } from "@/lib/stripe"
import { isComped } from "@/lib/billing"
import { packFor } from "@/lib/credit-rules"
import { shopifyMerchantShop } from "@/lib/connector/shopify-billing"
import { MARKET_CURRENCY, MARKET_COOKIE, isMarketKey } from "@/content/markets/prices"
import { realEmail } from "@/lib/sites"

// POST { pack: 50 | 120 | 300 }: a one-time Stripe Checkout (mode=payment) for usage credits.
// The webhook (checkout.session.completed, metadata alphaa_credits) credits the brand once per
// session (lib/credits.ts grantCredits). Shopify-billed merchants can't buy here (App Store
// billing rules): the dashboard shows "Upgrade your plan in Shopify" instead.

// Never charge a price that doesn't match the pack (amount, one-time, USD, credits metadata).
const verified = new Map<string, boolean>()
async function verifiedCreditPrice(credits: number): Promise<string | null> {
  const pack = packFor(credits)
  const id = CREDIT_PRICE_IDS[credits as keyof typeof CREDIT_PRICE_IDS]
  if (!pack || !id) return null
  if (!verified.has(id)) {
    try {
      const p = await stripe.prices.retrieve(id)
      const ok = p.active && p.currency === "usd" && p.type === "one_time" && p.unit_amount === pack.usd * 100 && p.metadata?.alphaa_credits === String(credits)
      if (!ok) console.error("[credits] price does not match the pack", credits, id, p.unit_amount, p.type)
      verified.set(id, ok)
    } catch (e) {
      console.error("[credits] price lookup", id, e instanceof Error ? e.message : e)
      return null
    }
  }
  return verified.get(id) ? id : null
}

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { pack?: unknown }
  const credits = Number(body.pack)
  if (!packFor(credits)) return NextResponse.json({ error: "Pick a pack: 50, 120 or 300 credits." }, { status: 400 })
  if (isComped(user.email)) return NextResponse.json({ error: "Your account never runs out, so there's nothing to buy." }, { status: 409 })
  const shop = await shopifyMerchantShop(user)
  if (shop) return NextResponse.json({ error: "Your plan is billed through Shopify. Upgrade your plan in Shopify for more." }, { status: 409 })

  const price = await verifiedCreditPrice(credits)
  if (!price) return NextResponse.json({ error: "Credits aren't available right now. Email hi@alphaa.app." }, { status: 500 })

  let customer = user.stripeCustomerId
  if (!customer) {
    const c = await stripe.customers.create({ email: realEmail(user.email), name: user.fullName ?? undefined, description: user.websiteUrl ? `Alphaa: ${user.websiteUrl}` : undefined })
    customer = c.id
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer } })
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer,
    line_items: [{ price, quantity: 1 }],
    metadata: { alphaa_credits: String(credits), userId: user.id },
    payment_intent_data: { metadata: { alphaa_credits: String(credits), userId: user.id } },
    branding_settings: { display_name: "Alphaa", background_color: "#ffffff", button_color: "#000000", border_style: "pill", font_family: "default" },
    custom_text: { submit: { message: `${credits} Alphaa credits for your account, used only when your plan's included work runs out. They last 12 months.` } },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${appUrl}/dashboard/settings/business?credits=${credits}`,
    cancel_url: `${appUrl}/dashboard/settings/business`,
  }
  // Market visitors pay in their currency (the prices carry EUR/GBP/AED options); USD otherwise.
  const m = req.cookies.get(MARKET_COOKIE)?.value
  const currency = isMarketKey(m) ? MARKET_CURRENCY[m] : undefined
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create(currency ? { ...params, currency } : params)
  } catch (e) {
    if (!currency) throw e
    console.error("[credits] local currency failed, using USD", currency, e instanceof Error ? e.message : e)
    session = await stripe.checkout.sessions.create(params)
  }
  return NextResponse.json({ url: session.url })
}
