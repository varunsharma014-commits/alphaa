// Local prices per market (Varun, 2026-10-30; plans reset 2026-11-26 to Starter $99 / Pro $499 /
// Growth $799): local round numbers, roughly equal to the USD prices. Checkout charges these
// through currency options on the same Stripe monthly prices (see scripts/stripe-local-currencies.ts).
export type MarketKey = "uk" | "de" | "fr" | "it" | "ae" | "ar"
export type Plan = "starter" | "pro" | "growth"
export type Currency = "usd" | "eur" | "gbp" | "aed"

export const MARKET_CURRENCY: Record<MarketKey, Currency> = { uk: "gbp", de: "eur", fr: "eur", it: "eur", ae: "aed", ar: "aed" }

/** Monthly amounts in whole units. */
export const AMOUNTS: Record<Currency, Record<Plan, number>> = {
  usd: { starter: 99, pro: 499, growth: 799 },
  eur: { starter: 99, pro: 499, growth: 799 },
  gbp: { starter: 79, pro: 399, growth: 639 },
  aed: { starter: 369, pro: 1849, growth: 2939 },
}

/** Growth's extra ad account (beyond the first), monthly, in whole units. */
export const EXTRA_AD_ACCOUNT_AMOUNTS: Record<Currency, number> = { usd: 200, eur: 199, gbp: 159, aed: 739 }

/** "99 €", "£79", "AED 369", "369 درهم", "$99". `plan` "adaccount" = Growth's extra ad account. */
export function formatPrice(currency: Currency, plan: Plan | "adaccount", lang = "en"): string {
  const n = (plan === "adaccount" ? EXTRA_AD_ACCOUNT_AMOUNTS[currency] : AMOUNTS[currency][plan]).toLocaleString("en-US")
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

/** Replace {starter} {pro} {growth} {adaccount} in market copy with the local prices. */
export function fillPrices(text: string, market: MarketKey, lang: string): string {
  const c = MARKET_CURRENCY[market]
  return text
    .replace(/\{starter\}/g, formatPrice(c, "starter", lang))
    .replace(/\{pro\}/g, formatPrice(c, "pro", lang))
    .replace(/\{growth\}/g, formatPrice(c, "growth", lang))
    .replace(/\{adaccount\}/g, formatPrice(c, "adaccount", lang))
}
