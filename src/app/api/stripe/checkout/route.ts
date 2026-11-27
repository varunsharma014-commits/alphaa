export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe, STRIPE_PRICE_IDS, EXTRA_AD_ACCOUNT_PRICE_IDS, isAdAccountAddon, planItem } from "@/lib/stripe"
import { db } from "@/lib/db"
import { isComped, hasStripePlan, isExtraBrand, EXTRA_BRAND_COUPON, EXTRA_BRAND_PERCENT } from "@/lib/billing"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"
import { MARKET_CURRENCY, MARKET_COOKIE, isMarketKey } from "@/content/markets/prices"
import type Stripe from "stripe"
import { realEmail } from "@/lib/sites"
import { GROWTH_ON_SALE } from "@/lib/growth"
import { PLAN_PRICES, EXTRA_AD_ACCOUNT_PRICE } from "@/lib/constants"

type SellPlan = "starter" | "pro" | "growth"
const SELL_PLANS: SellPlan[] = ["starter", "pro", "growth"]

// Never charge a price that doesn't match what the site shows (plans changed 2026-11-26; an old
// $399 Pro price left in env must not be sold as the $499 plan). Checks the USD amount and
// interval of the price id against PLAN_PRICES (monthly, or the yearly `annualTotal`) once per process.
const verified = new Map<string, boolean>()
async function verifiedPrice(plan: SellPlan, annual: boolean): Promise<string | null> {
  const id = STRIPE_PRICE_IDS[plan][annual ? "annual" : "monthly"]
  if (!id) return null
  if (!verified.has(id)) {
    try {
      const p = await stripe.prices.retrieve(id)
      const want = (annual ? PLAN_PRICES[plan].annualTotal : PLAN_PRICES[plan].monthly) * 100
      const ok = p.active && p.currency === "usd" && p.unit_amount === want && p.recurring?.interval === (annual ? "year" : "month")
      if (!ok) console.error("[checkout] price does not match the site", plan, annual ? "annual" : "monthly", id, p.unit_amount, p.recurring?.interval)
      verified.set(id, ok)
    } catch (e) {
      console.error("[checkout] price lookup", id, e instanceof Error ? e.message : e)
      return null
    }
  }
  return verified.get(id) ? id : null
}

// The Growth add-on "Extra ad account" ($200/mo or $2,040/yr), checked the same way.
async function verifiedAddonPrice(annual: boolean): Promise<string | null> {
  const id = EXTRA_AD_ACCOUNT_PRICE_IDS[annual ? "annual" : "monthly"]
  if (!id) return null
  if (!verified.has(id)) {
    try {
      const p = await stripe.prices.retrieve(id)
      const want = (annual ? EXTRA_AD_ACCOUNT_PRICE.annualTotal : EXTRA_AD_ACCOUNT_PRICE.monthly) * 100
      const ok = p.active && p.currency === "usd" && p.unit_amount === want && p.recurring?.interval === (annual ? "year" : "month") && isAdAccountAddon(p)
      if (!ok) console.error("[checkout] add-on price does not match the site", annual ? "annual" : "monthly", id, p.unit_amount, p.recurring?.interval)
      verified.set(id, ok)
    } catch (e) {
      console.error("[checkout] add-on price lookup", id, e instanceof Error ? e.message : e)
      return null
    }
  }
  return verified.get(id) ? id : null
}

/** Extra ad accounts asked for (Growth only): a whole number 0..MAX_EXTRA_AD_ACCOUNTS. */
const MAX_EXTRA_AD_ACCOUNTS = 20
function parseExtra(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return 0
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= MAX_EXTRA_AD_ACCOUNTS ? n : null
}

/** "pro_annual" / "growth_monthly" / "starter" (pricing page and agent) → plan + period. */
function parsePlan(v: unknown): { plan: SellPlan; annual: boolean } | null {
  if (typeof v !== "string") return null
  const m = /^(starter|pro|growth)(?:_(monthly|annual))?$/.exec(v)
  return m ? { plan: m[1] as SellPlan, annual: m[2] === "annual" } : null
}

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

  // Plans are named ("starter" | "pro" | "growth", plus `annual`), and resolved to a price id
  // here, so the client never chooses an arbitrary price. A legacy `priceId` of the form
  // "pro_annual" is accepted the same way.
  const body = await req.json().catch(() => ({}))
  const named = parsePlan(body.purchase) ?? parsePlan(body.priceId)
  const purchase: SellPlan | string | undefined = named?.plan ?? body.purchase
  const annual = !!(body.annual || named?.annual)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  // Full Service and the one-time setup were retired from sale on 2026-11-18.
  if (purchase === "fullservice" || purchase === "setup") {
    return NextResponse.json({ error: "That service is no longer offered. See the plans at alphaa.app/pricing." }, { status: 410 })
  }
  if (!named) return NextResponse.json({ error: "Pick a plan first." }, { status: 400 })
  // Growth only: extra ad accounts beyond the 1 included (the "Extra ad account" add-on).
  const extraAds = parseExtra(body.extraAdAccounts)
  if (extraAds === null) return NextResponse.json({ error: `Pick between 0 and ${MAX_EXTRA_AD_ACCOUNTS} extra ad accounts.` }, { status: 400 })
  if (extraAds > 0 && named.plan !== "growth") return NextResponse.json({ error: "Extra ad accounts come with the Growth plan." }, { status: 400 })
  // Comped accounts (founder, app-store reviewers) never pay: send them on.
  if (isComped(user.email)) {
    return NextResponse.json({ url: `${appUrl}/dashboard` })
  }

  // Growth stays early access (no charge) until ads are approved and live.
  if (purchase === "growth" && !GROWTH_ON_SALE) {
    return NextResponse.json({ error: "Growth is in early access. Email hi@alphaa.app and we'll set you up first." }, { status: 403 })
  }

  // Shopify merchants are billed only through Shopify (App Store rule 1.2.1): the plan opens
  // Shopify's own plan page. Growth isn't sold to them yet.
  const shop = await shopifyMerchantShop(user)
  if (shop) {
    if (purchase === "growth") {
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

  const currency = marketCurrency(req)
  const market = marketOf(req)

  // A second (third…) brand on the same login: 50% off, forever.
  const extra = await isExtraBrand(user)
  const discounts = extra && (await ensureExtraBrandCoupon()) ? [{ coupon: EXTRA_BRAND_COUPON() }] : undefined

  // Already paying by Stripe and moving up a plan (e.g. Starter → Growth): switch the price on
  // the existing subscription (prorated) instead of opening a second subscription.
  if ((purchase === "pro" || purchase === "growth") && hasStripePlan(user) && user.stripeSubscriptionId) {
    // Keep the billing period they already pay on (a yearly Starter moves to yearly Pro).
    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
    const item = planItem(sub.items.data)
    const onYearly = item?.price.recurring?.interval === "year"
    const yearly = onYearly || annual
    const target = await verifiedPrice(purchase, yearly)
    if (!target) return NextResponse.json({ error: "This plan isn't available right now. Email hi@alphaa.app." }, { status: 500 })
    const items: Stripe.SubscriptionUpdateParams.Item[] = []
    if (item && item.price.id !== target) items.push({ id: item.id, price: target })
    // The add-on follows the plan: set to the asked quantity on Growth, removed on any other plan.
    const addonItems = sub.items.data.filter((i) => isAdAccountAddon(i.price))
    const want = purchase === "growth" ? extraAds : 0
    if (want > 0) {
      const addon = await verifiedAddonPrice(yearly)
      if (!addon) return NextResponse.json({ error: "Extra ad accounts aren't available right now. Email hi@alphaa.app." }, { status: 500 })
      const [first, ...rest] = addonItems
      if (first) {
        if (first.price.id !== addon || first.quantity !== want) items.push({ id: first.id, price: addon, quantity: want })
      } else items.push({ price: addon, quantity: want })
      for (const r of rest) items.push({ id: r.id, deleted: true })
    } else for (const r of addonItems) items.push({ id: r.id, deleted: true })
    if (items.length) {
      await stripe.subscriptions.update(sub.id, {
        items,
        proration_behavior: "always_invoice",
        metadata: { ...sub.metadata, upgraded_to: purchase, ...(purchase === "growth" ? { extra_ad_accounts: String(want) } : {}) },
      })
      await db.user.update({ where: { id: user.id }, data: { plan: purchase } })
      // The webhook (customer.subscription.updated) writes the ad-account allowance.
    }
    return NextResponse.json({ url: `${appUrl}/dashboard?upgraded=${purchase}` })
  }

  // The agent conversation (/onboarding) names the plan; it never handles price ids itself.
  const fromAgent = SELL_PLANS.includes(named.plan)
  const price = await verifiedPrice(named.plan, annual)
  if (!price) return NextResponse.json({ error: "This plan isn't available right now. Email hi@alphaa.app." }, { status: 500 })
  const line_items: NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]> = [{ price, quantity: 1 }]
  if (extraAds > 0) {
    const addon = await verifiedAddonPrice(annual)
    if (!addon) return NextResponse.json({ error: "Extra ad accounts aren't available right now. Email hi@alphaa.app." }, { status: 500 })
    line_items.push({ price: addon, quantity: extraAds })
  }
  // Local currencies exist on the monthly prices only; annual stays in USD.
  const monthly = !annual
  const session = await createSession({
    customer: stripeCustomerId,
    branding_settings,
    line_items,
    mode: "subscription",
    ...(discounts ? { discounts, metadata: { extra_brand: "1" } } : {}),
    ...(extraAds > 0 ? { subscription_data: { metadata: { extra_ad_accounts: String(extraAds) } } } : {}),
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
