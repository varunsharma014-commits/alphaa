export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe, STRIPE_PRICE_IDS, STRIPE_SETUP_FEE_PRICE_ID } from "@/lib/stripe"
import { db } from "@/lib/db"
import { isComped, hasStripePlan, isExtraBrand, EXTRA_BRAND_COUPON, EXTRA_BRAND_PERCENT } from "@/lib/billing"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { MARKET_CURRENCY, MARKET_COOKIE, isMarketKey } from "@/content/markets/prices"
import type Stripe from "stripe"
import { realEmail } from "@/lib/sites"
import { GROWTH_ON_SALE } from "@/lib/growth"

// Visitors who came through a market page (/uk, /de…) pay in that market's
// currency. The monthly prices carry currency options in Stripe; if one is
// missing, Stripe rejects the currency and we fall back to USD.
function marketCurrency(req: NextRequest): string | undefined {
  const m = req.cookies.get(MARKET_COOKIE)?.value
  return isMarketKey(m) ? MARKET_CURRENCY[m] : undefined
}

function marketOf(req: NextRequest): string | undefined {
  const m = req.cookies.get(MARKET_COOKIE)?.value
  return isMarketKey(m) ? m : undefined
}

// Alphaa is sold to businesses only. Every Alphaa checkout lets the buyer
// add a VAT/tax ID (Stripe's "purchasing as a business" box) and says
// business-only on the pay button. Not VAT-registered and no Stripe Tax, so
// nothing here charges tax. customer_update is required when tax IDs are
// collected for an existing customer: it saves the name/address/tax ID they enter.
const BUSINESS_ONLY = {
  tax_id_collection: { enabled: true },
  customer_update: { name: "auto", address: "auto" },
  custom_text: { submit: { message: "Alphaa is sold to business customers only. Buying from the EU or UK? Add your VAT number above." } },
} satisfies Partial<Stripe.Checkout.SessionCreateParams>

// If Stripe ever rejects the business-only params, checkout must still work:
// log it and retry once without them.
async function create(params: Stripe.Checkout.SessionCreateParams) {
  try {
    return await stripe.checkout.sessions.create({ ...BUSINESS_ONLY, ...params })
  } catch (e) {
    console.error("[checkout] business-only params rejected, retrying without", e instanceof Error ? e.message : e)
    return stripe.checkout.sessions.create(params)
  }
}

async function createSession(params: Stripe.Checkout.SessionCreateParams, currency: string | undefined, market?: string) {
  // The market rides along so the webhook can flag a market's first customer.
  if (market) params = { ...params, metadata: { ...(params.metadata ?? {}), market } }
  if (!currency) return create(params)
  try {
    return await create({ ...params, currency })
  } catch (e) {
    console.error("[checkout] local currency failed, using USD", currency, e instanceof Error ? e.message : e)
    return create(params)
  }
}

// The extra-brand coupon must exist in whichever Stripe mode is live; create it once if not.
let couponReady = false
async function ensureExtraBrandCoupon(): Promise<boolean> {
  if (couponReady) return true
  try {
    await stripe.coupons.retrieve(EXTRA_BRAND_COUPON())
  } catch (e) {
    if ((e as { code?: string }).code !== "resource_missing") { console.error("[checkout] coupon lookup", e); return false }
    try {
      await stripe.coupons.create({ id: EXTRA_BRAND_COUPON(), percent_off: EXTRA_BRAND_PERCENT, duration: "forever", name: `Extra brand: ${EXTRA_BRAND_PERCENT}% off` })
    } catch (err) { console.error("[checkout] coupon create", err); return false }
  }
  couponReady = true
  return true
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // `purchase` is the concierge path — named products resolved server-side so
  // the client never chooses an arbitrary price for them.
  const { priceId, purchase } = await req.json()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  // Comped accounts (founder, app-store reviewers) never pay: send them on.
  if ((purchase === "starter" || purchase === "pro" || purchase === "growth") && isComped(user.email)) {
    return NextResponse.json({ url: `${appUrl}/dashboard` })
  }

  // Growth stays early access (no charge) until ads and social posting are approved and live.
  if (purchase === "growth" && !GROWTH_ON_SALE) {
    return NextResponse.json({ error: "Growth is in early access. Email hi@alphaa.app and we'll set you up first." }, { status: 403 })
  }

  // Shopify merchants are billed only through Shopify (App Store rule 1.2.1): the plan opens
  // Shopify's own plan page, and the Stripe-only human services aren't sold to them at all.
  const shop = await shopifyMerchantShop(user)
  if (shop) {
    if (purchase === "setup" || purchase === "fullservice" || purchase === "growth") {
      return NextResponse.json({ error: "This service isn't available for Shopify stores. Email hi@alphaa.app and we'll help." }, { status: 403 })
    }
    return NextResponse.json({ url: shopifyPricingUrl(shop) })
  }

  let stripeCustomerId = user.stripeCustomerId
  // Apple-style hosted checkout for Alphaa sessions only (the Stripe account is
  // shared with another product, so this is per session, not account-wide).
  const branding_settings = {
    display_name: "Alphaa",
    background_color: "#ffffff",
    button_color: "#000000",
    border_style: "pill" as const,
    font_family: "default" as const,
  }

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: realEmail(user.email), name: user.fullName ?? undefined, description: user.websiteUrl ? `Alphaa: ${user.websiteUrl}` : undefined })
    stripeCustomerId = customer.id
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId } })
  }

  // One-time white-glove setup fee ($149) — payment mode, no subscription.
  if (purchase === "setup") {
    if (!STRIPE_SETUP_FEE_PRICE_ID) {
      return NextResponse.json({ error: "Setup service is not available right now" }, { status: 500 })
    }
    const session = await create({
      customer: stripeCustomerId,
      branding_settings,
      line_items: [{ price: STRIPE_SETUP_FEE_PRICE_ID, quantity: 1 }],
      mode: "payment",
      metadata: { purpose: "concierge_setup", userId: user.id },
      success_url: `${appUrl}/dashboard/concierge?paid=1`,
      cancel_url: `${appUrl}/dashboard/concierge`,
    })
    return NextResponse.json({ url: session.url })
  }

  const currency = marketCurrency(req)
  const market = marketOf(req)

  // A second (third…) brand on the same login: 50% off, forever.
  const extra = await isExtraBrand(user)
  const discounts = extra && (await ensureExtraBrandCoupon()) ? [{ coupon: EXTRA_BRAND_COUPON() }] : undefined

  // Full Service subscription ($299/mo, human-fulfilled). No trial: a person
  // starts doing real work immediately.
  if (purchase === "fullservice") {
    const session = await createSession({
      customer: stripeCustomerId,
      branding_settings,
      line_items: [{ price: STRIPE_PRICE_IDS.fullservice.monthly, quantity: 1 }],
      mode: "subscription",
      ...(discounts ? { discounts, metadata: { extra_brand: "1" } } : {}),
      payment_method_collection: "always",
      success_url: `${appUrl}/dashboard/concierge?upgraded=1`,
      cancel_url: `${appUrl}/dashboard/concierge`,
    }, currency, market)
    return NextResponse.json({ url: session.url })
  }

  // Already paying by Stripe and moving up a plan (e.g. Starter → Growth): switch the price on
  // the existing subscription (prorated) instead of opening a second subscription.
  if ((purchase === "pro" || purchase === "growth") && hasStripePlan(user) && user.stripeSubscriptionId) {
    const target = STRIPE_PRICE_IDS[purchase as "pro" | "growth"].monthly
    if (!target) return NextResponse.json({ error: "This plan isn't available right now. Email hi@alphaa.app." }, { status: 500 })
    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
    const item = sub.items.data[0]
    if (item && item.price.id !== target) {
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: target }],
        proration_behavior: "always_invoice",
        metadata: { ...sub.metadata, upgraded_to: purchase },
      })
      await db.user.update({ where: { id: user.id }, data: { plan: purchase } })
    }
    return NextResponse.json({ url: `${appUrl}/dashboard?upgraded=${purchase}` })
  }

  // `purchase: "starter" | "pro" | "growth"` comes from the agent conversation (/onboarding),
  // which never handles price ids itself.
  const fromAgent = purchase === "starter" || purchase === "pro" || purchase === "growth"
  const price = fromAgent ? STRIPE_PRICE_IDS[purchase as "starter" | "pro" | "growth"].monthly : priceId
  if (!price) return NextResponse.json({ error: "This plan isn't available right now. Email hi@alphaa.app." }, { status: 500 })
  // Local currencies exist on the monthly prices only; annual stays in USD.
  const monthly = [STRIPE_PRICE_IDS.starter.monthly, STRIPE_PRICE_IDS.pro.monthly, STRIPE_PRICE_IDS.growth.monthly].includes(price)
  const session = await createSession({
    customer: stripeCustomerId,
    branding_settings,
    line_items: [{ price, quantity: 1 }],
    mode: "subscription",
    ...(discounts ? { discounts, metadata: { extra_brand: "1" } } : {}),
    // No trial (decided 2026-09-24): the /start analysis does the convincing;
    // month to month, cancel any time.
    payment_method_collection: "always",
    // Expire after 1h (default 24h) so checkout.session.expired, and with it
    // the abandoned-checkout email, arrives while the visit is still fresh.
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: fromAgent ? `${appUrl}/onboarding?paid=1` : `${appUrl}/dashboard?upgraded=true`,
    cancel_url: fromAgent ? `${appUrl}/onboarding` : `${appUrl}/pricing`,
  }, monthly ? currency : undefined, market)

  return NextResponse.json({ url: session.url })
}
