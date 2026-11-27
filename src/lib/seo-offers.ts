// schema.org Offers for the three plans, from the same numbers the pricing page shows
// (PLAN_PRICES, EXTRA_AD_ACCOUNT_PRICE). Used by the homepage SoftwareApplication, the /pricing
// Product and each /services page, so a price change can't leave stale structured data.
// Each offer carries both billing periods: monthly, and yearly (the yearly total, 15% off).
// Growth is PreOrder while it's an early-access waitlist (nobody is charged until ads open).
import { EXTRA_AD_ACCOUNT_PRICE, PLAN_NAMES, PLAN_PRICES } from "@/lib/constants"
import { GROWTH_ON_SALE } from "@/lib/growth"

export type OfferPlan = "starter" | "pro" | "growth"

function spec(price: number, unit: "MONTH" | "YEAR", name: string) {
  return {
    "@type": "UnitPriceSpecification",
    name,
    price: String(price),
    priceCurrency: "USD",
    unitText: unit,
    referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: unit === "MONTH" ? "MON" : "ANN" },
  }
}

const EXTRA_AD_ACCOUNT_OFFER = {
  "@type": "Offer",
  name: "Additional ad account (Google or Meta)",
  price: String(EXTRA_AD_ACCOUNT_PRICE.monthly),
  priceCurrency: "USD",
  priceSpecification: [
    spec(EXTRA_AD_ACCOUNT_PRICE.monthly, "MONTH", "Billed monthly"),
    spec(EXTRA_AD_ACCOUNT_PRICE.annualTotal, "YEAR", `Billed yearly ($${EXTRA_AD_ACCOUNT_PRICE.annual}/month)`),
  ],
}

export function planOffer(k: OfferPlan, extra: Record<string, unknown> = {}) {
  const p = PLAN_PRICES[k]
  const growth = k === "growth"
  return {
    "@type": "Offer",
    name: PLAN_NAMES[k],
    price: String(p.monthly),
    priceCurrency: "USD",
    priceSpecification: [
      spec(p.monthly, "MONTH", "Billed monthly"),
      spec(p.annualTotal, "YEAR", `Billed yearly ($${p.annual}/month)`),
    ],
    availability: growth && !GROWTH_ON_SALE ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
    url: "https://alphaa.app/pricing",
    ...(growth ? { addOn: EXTRA_AD_ACCOUNT_OFFER } : {}),
    ...extra,
  }
}

export const PLAN_OFFERS = (["starter", "pro", "growth"] as const).map((k) => planOffer(k))
