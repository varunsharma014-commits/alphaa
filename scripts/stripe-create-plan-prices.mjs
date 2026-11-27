// Creates the Stripe prices for the plans set 2026-11-26 (Starter $99, Pro $499, Growth $799;
// yearly = 15% off: $1,010 / $5,090 / $8,150). Idempotent: each price has a lookup_key, and a
// price that already exists with that key is reused, never duplicated. Monthly prices carry the
// local currencies from src/content/markets/prices.ts (EUR / GBP / AED); yearly stays USD.
// Every price gets metadata { alphaa_plan, interval } (lib/stripe.ts planFromPrice).
//
// Add-on (2026-11-27): "Extra ad account" for Growth, its own product, $200/mo (+ EUR/GBP/AED from
// EXTRA_AD_ACCOUNT_AMOUNTS) and $2,040/yr ($170/mo). Metadata { alphaa_addon: "extra_ad_account",
// interval }, lookup keys alphaa_extra_ad_account_<monthly|yearly>_2026_11. Checkout adds it as a
// second line item with a quantity (lib/stripe.ts isAdAccountAddon keeps it out of planFromPrice).
//
// Run with production env:  railway run --service alphaa -- node scripts/stripe-create-plan-prices.mjs [--dry]
// Prints only price ids, never keys. Then set the printed ids as STRIPE_*_PRICE_ID on Railway.
import Stripe from "stripe"

const dry = process.argv.includes("--dry")
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Keep in sync with PLAN_PRICES (src/lib/constants.ts) and AMOUNTS (src/content/markets/prices.ts).
const PLANS = {
  starter: { product: "Alphaa Starter", monthly: 99, yearly: 1010, local: { eur: 99, gbp: 79, aed: 369 } },
  pro: { product: "Alphaa Pro", monthly: 499, yearly: 5090, local: { eur: 499, gbp: 399, aed: 1849 } },
  growth: { product: "Alphaa Growth", monthly: 799, yearly: 8150, local: { eur: 799, gbp: 639, aed: 2939 } },
}

// Keep in sync with EXTRA_AD_ACCOUNT_PRICE (src/lib/constants.ts) and EXTRA_AD_ACCOUNT_AMOUNTS (prices.ts).
const ADDONS = {
  extra_ad_account: { product: "Extra ad account", env: "EXTRA_AD_ACCOUNT", monthly: 200, yearly: 2040, local: { eur: 199, gbp: 159, aed: 739 } },
}

async function productId(name, metadata) {
  const found = await stripe.products.search({ query: `name:'${name}' AND active:'true'`, limit: 5 })
  // The Stripe account is shared with another product: reuse a product only if it's ours.
  const mine = metadata ? found.data.find((p) => p.metadata?.alphaa_addon === metadata.alphaa_addon) : found.data[0]
  if (mine) return mine.id
  if (dry) return `(new product ${name})`
  return (await stripe.products.create({ name, ...(metadata ? { metadata } : {}) })).id
}

async function ensurePrice({ plan, interval, amount, local, product, addon }) {
  const lookup_key = `alphaa_${plan}_${interval === "month" ? "monthly" : "yearly"}_2026_11`
  const existing = await stripe.prices.list({ lookup_keys: [lookup_key], limit: 1, expand: ["data.currency_options"] })
  const p = existing.data[0]
  if (p) {
    const ok = p.unit_amount === amount * 100 && p.recurring?.interval === interval && p.currency === "usd"
    console.log(`${plan} ${interval}: exists ${p.id} ${ok ? "OK" : "MISMATCH"} ${p.unit_amount / 100} usd/${p.recurring?.interval}`)
    return p.id
  }
  const params = {
    product,
    currency: "usd",
    unit_amount: amount * 100,
    recurring: { interval },
    lookup_key,
    nickname: `${(addon ? ADDONS[plan] : PLANS[plan]).product} ${interval === "month" ? "monthly" : "yearly"} (2026-11)`,
    metadata: addon ? { alphaa_addon: plan, interval: interval === "month" ? "monthly" : "annual" } : { alphaa_plan: plan, interval: interval === "month" ? "monthly" : "annual" },
    ...(local ? { currency_options: Object.fromEntries(Object.entries(local).map(([c, n]) => [c, { unit_amount: n * 100 }])) } : {}),
  }
  if (dry) { console.log(`${plan} ${interval}: would create ${amount} usd`, local ? JSON.stringify(local) : ""); return null }
  const created = await stripe.prices.create(params)
  console.log(`${plan} ${interval}: created ${created.id} ${amount} usd/${interval}`)
  return created.id
}

const out = {}
for (const [plan, c] of Object.entries(PLANS)) {
  const product = await productId(c.product)
  out[`STRIPE_${plan.toUpperCase()}_MONTHLY_PRICE_ID`] = await ensurePrice({ plan, interval: "month", amount: c.monthly, local: c.local, product })
  out[`STRIPE_${plan.toUpperCase()}_ANNUAL_PRICE_ID`] = await ensurePrice({ plan, interval: "year", amount: c.yearly, product })
}
for (const [addon, c] of Object.entries(ADDONS)) {
  const product = await productId(c.product, { alphaa_addon: addon })
  out[`STRIPE_${c.env}_MONTHLY_PRICE_ID`] = await ensurePrice({ plan: addon, interval: "month", amount: c.monthly, local: c.local, product, addon: true })
  out[`STRIPE_${c.env}_ANNUAL_PRICE_ID`] = await ensurePrice({ plan: addon, interval: "year", amount: c.yearly, product, addon: true })
}
console.log(JSON.stringify(out, null, 2))
