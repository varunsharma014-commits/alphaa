// Adds EUR / GBP / AED amounts to Alphaa's monthly Stripe prices (one price,
// several currencies), so checkout can charge each market in its own currency.
// Run with production env:  railway run --service alphaa -- npx tsx scripts/stripe-local-currencies.ts
// Add --dry to only print. Touches only the three Alphaa monthly price ids.
import Stripe from "stripe"
import { AMOUNTS } from "../src/content/markets/prices"

const dry = process.argv.includes("--dry")
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const plans = [
  ["starter", process.env.STRIPE_STARTER_MONTHLY_PRICE_ID],
  ["pro", process.env.STRIPE_PRO_MONTHLY_PRICE_ID],
  ["full", process.env.STRIPE_FULLSERVICE_MONTHLY_PRICE_ID],
] as const

async function main() {
  for (const [plan, id] of plans) {
    if (!id) { console.log(plan, "no price id, skipped"); continue }
    const price = await stripe.prices.retrieve(id, { expand: ["currency_options"] })
    const want = {
      eur: { unit_amount: AMOUNTS.eur[plan] * 100 },
      gbp: { unit_amount: AMOUNTS.gbp[plan] * 100 },
      aed: { unit_amount: AMOUNTS.aed[plan] * 100 },
    }
    const have = Object.keys(price.currency_options ?? {})
    console.log(plan, id, price.currency, price.unit_amount, "has", have.join(","), "→ adding", JSON.stringify(want))
    if (!dry) {
      const updated = await stripe.prices.update(id, { currency_options: want, expand: ["currency_options"] })
      console.log("  now:", Object.keys(updated.currency_options ?? {}).join(","))
    }
  }
}
main().catch((e) => { console.error(e.message); process.exit(1) })
