// A long-form local guide for one market, e.g. alphaa.app/de/ratgeber/<slug>.
// Written in the market's language by a native writer, human voice (Varun
// Sharma is the author), not the agent "I". SEO terms are fine here.
export interface MarketGuide {
  /** ASCII lower-case hyphen slug in the market's language. */
  slug: string
  /** SEO title WITHOUT the brand, max 60 characters. */
  title: string
  /** Meta description, 120–155 characters. */
  description: string
  h1: string
  /** One-paragraph answer to the title question, 40–70 words (AI engines quote this). */
  answer: string
  /** 3–5 short takeaways. */
  takeaways: string[]
  sections: { h2: string; paragraphs: string[]; bullets?: string[] }[]
  faq: { q: string; a: string }[]
  /** ISO date the guide was written. */
  date: string
}

export interface MarketGuides {
  /** Path segment for guides in this language, e.g. "ratgeber", "guide", "guida", "guides", "adilla". ASCII. */
  base: string
  /** Section label, e.g. "Ratgeber". */
  label: string
  guides: MarketGuide[]
}
