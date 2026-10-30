// Local prices per market (Varun, 2026-10-30): local round numbers, roughly
// equal to $99 / $199 / $299. Checkout charges these through currency options
// on the same Stripe prices (see scripts/stripe-local-currencies.ts).
export type MarketKey = "uk" | "de" | "fr" | "it" | "ae" | "ar"
export type Plan = "starter" | "pro" | "full"
export type Currency = "usd" | "eur" | "gbp" | "aed"

export const MARKET_CURRENCY: Record<MarketKey, Currency> = { uk: "gbp", de: "eur", fr: "eur", it: "eur", ae: "aed", ar: "aed" }

/** Monthly amounts in whole units. */
export const AMOUNTS: Record<Currency, Record<Plan, number>> = {
  usd: { starter: 99, pro: 199, full: 299 },
  eur: { starter: 99, pro: 199, full: 299 },
  gbp: { starter: 79, pro: 159, full: 239 },
  aed: { starter: 369, pro: 739, full: 1099 },
}

/** "99 €", "£79", "AED 369", "369 درهم", "$99". */
export function formatPrice(currency: Currency, plan: Plan, lang = "en"): string {
  const n = AMOUNTS[currency][plan].toLocaleString("en-US")
  if (currency === "eur") return lang.startsWith("en") ? `€${n}` : `${n} €`
  if (currency === "gbp") return `£${n}`
  if (currency === "aed") return lang.startsWith("ar") ? `${n} درهم` : `AED ${n}`
  return `$${n}`
}

export function isMarketKey(v: string | undefined | null): v is MarketKey {
  return !!v && v in MARKET_CURRENCY
}

/** Cookie set by the middleware when someone visits a market page. */
export const MARKET_COOKIE = "alphaa_market"

/** Replace {starter} {pro} {full} in market copy with the local prices. */
export function fillPrices(text: string, market: MarketKey, lang: string): string {
  const c = MARKET_CURRENCY[market]
  return text
    .replace(/\{starter\}/g, formatPrice(c, "starter", lang))
    .replace(/\{pro\}/g, formatPrice(c, "pro", lang))
    .replace(/\{full\}/g, formatPrice(c, "full", lang))
}
