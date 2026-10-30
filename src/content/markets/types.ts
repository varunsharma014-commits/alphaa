// Content for one local market (alphaa.app/uk, /de, /fr, /it, /ae, /ae/ar).
// Each market lives in its own file in this folder; LocalHome and
// LocalIndustry render them. Prices are never written here: use the tokens
// {starter} {pro} {full} and they are filled from MARKET_PRICES (see prices.ts),
// already formatted for the market (e.g. "99 €", "£79", "AED 369").
import type { LocaleCopy } from "@/content/locales"

export interface MarketIndustry {
  /** ASCII, lower-case, in the market's language, e.g. "zahnarzt", "dentiste", "solicitors". */
  slug: string
  /** Plural trade name as locals say it, e.g. "Zahnärzte". */
  name: string
  /** SEO title WITHOUT the brand, max 55 characters, in the market's language. */
  title: string
  /** Meta description, 110–155 characters. */
  description: string
  h1: string
  sub: string
  /** 3 real questions locals type into ChatGPT for this trade, naming real local cities/areas. */
  questions: string[]
  /** 3–4 sites AI reads for this trade in this country, and why. Real sites only. */
  where: { name: string; why: string }[]
  /** 3 things the agent does for this trade, first person ("I…"). */
  steps: { title: string; body: string }[]
  /** 3 FAQs a business owner in this trade would ask. */
  faq: { q: string; a: string }[]
}

export interface MarketExtra {
  /** Home-page section: questions locals really ask AI. */
  questionsTitle: string
  questionsIntro: string
  questions: { q: string; who: string }[] // 5
  industriesTitle: string
  industriesIntro: string
  /** Link label on each industry card, e.g. "Mehr für Zahnärzte". The trade name is appended by the template, so write just the prefix, e.g. "Mehr für". */
  industryLinkPrefix: string
  industries: MarketIndustry[] // 4
  /** Label for the "back to the country page" link on industry pages. */
  backToMarket: string
  /** CTA under industry pages, e.g. "Check my practice free". */
  industryCta: string
}

export interface Market {
  copy: LocaleCopy
  extra: MarketExtra
}
