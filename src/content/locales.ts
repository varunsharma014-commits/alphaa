// Local market pages: alphaa.app/uk, /de, /fr, /it, /ae, /ae/ar. Each
// market's copy lives in src/content/markets/<key>.ts; LocalHome renders them. Copy follows the Alphaa voice rules: the agent
// speaks as "I", no "#1"/"best", no free trial (the check is free), outcomes
// as "can", prices are the real USD prices.

export type LocaleKey = "uk" | "de" | "fr" | "it" | "ae" | "ar"
// "ar" = the Arabic UAE page (/ae/ar)

export interface LocaleCopy {
  key: LocaleKey
  path: string
  lang: string // html lang
  hreflang: string
  country: string
  title: string
  description: string
  h1a: string // before the rotating AI name
  h1b: string
  sub: string
  cta: string
  guarantee: [string, string] // plain, bold
  fine: string
  arrows: [string, string]
  greet: { lines: string[]; ask: string; hint: string; idleHint: string; startHere: string }
  pillarsTitle: string
  pillars: { title: string; body: string }[]
  whereTitle: string
  whereIntro: string
  where: { name: string; why: string }[]
  priceTitle: string
  priceSub: string
  priceItems: string[]
  priceCta: string
  priceNote: string
  faqTitle: string
  faq: { q: string; a: string }[]
  english: string
}

import type { Market } from "@/content/markets/types"
import { market as uk } from "@/content/markets/uk"
import { market as de } from "@/content/markets/de"
import { market as fr } from "@/content/markets/fr"
import { market as it } from "@/content/markets/it"
import { market as ae } from "@/content/markets/ae"
import { market as ar } from "@/content/markets/ar"
import { fillPrices, type MarketKey } from "@/content/markets/prices"

/** Replace the {starter} {pro} {full} tokens everywhere with the local prices. */
function priced(m: Market): Market {
  const key = m.copy.key as MarketKey
  return JSON.parse(JSON.stringify(m), (_k, v) => (typeof v === "string" ? fillPrices(v, key, m.copy.lang) : v))
}

export const MARKETS: Record<LocaleKey, Market> = {
  uk: priced(uk),
  de: priced(de),
  fr: priced(fr),
  it: priced(it),
  ae: priced(ae),
  ar: priced(ar),
}

export const LOCALES: Record<LocaleKey, LocaleCopy> = Object.fromEntries(
  Object.entries(MARKETS).map(([k, m]) => [k, m.copy]),
) as Record<LocaleKey, LocaleCopy>

export const LOCALE_LIST: LocaleCopy[] = Object.values(LOCALES)

/** hreflang map for the homepage and every market page. */
export const HREFLANG: Record<string, string> = {
  "en-US": "/",
  ...Object.fromEntries(LOCALE_LIST.map((l) => [l.hreflang, l.path])),
  "x-default": "/",
}
