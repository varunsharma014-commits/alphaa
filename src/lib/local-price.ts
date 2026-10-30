// The Starter price in the currency of the market page the visitor came
// through (cookie set by the middleware), e.g. "€99", "£79", "AED 369".
// Client-side only; the server render shows "$99".
import { MARKET_COOKIE, MARKET_CURRENCY, formatPrice, isMarketKey, type Plan } from "@/content/markets/prices"

export function localPrice(plan: Plan = "starter"): string {
  if (typeof document === "undefined") return formatPrice("usd", plan)
  const m = document.cookie.split("; ").find((c) => c.startsWith(`${MARKET_COOKIE}=`))?.split("=")[1]
  return formatPrice(isMarketKey(m) ? MARKET_CURRENCY[m] : "usd", plan)
}
