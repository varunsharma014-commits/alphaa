import { PLAN_NAMES, PLAN_PRICES } from "@/lib/constants"
import type { Metadata } from "next"
import { FaqSection } from "@/components/marketing/FaqSection"
import { HomeV2, HomeV2Final } from "@/components/marketing/home/HomeV2"
import { HomeNotes } from "@/components/marketing/home/home-notes"
import { faqs } from "@/components/marketing/faq-data"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { pageMeta } from "@/lib/seo"
import { V3Page, Frame } from "@/components/marketing/v3"
import { HREFLANG } from "@/content/locales"

// SoftwareApplication structured data so AI engines / Google can state exactly
// what Alphaa is, its category, and its price. No aggregateRating (we won't
// publish unverifiable review counts).
export const metadata: Metadata = pageMeta({
  title: "Alphaa: AI Marketing Agent for Small Businesses | Social, SEO & AI Search",
  absolute: true,
  description:
    "Run your marketing with an AI agent: getting recommended by ChatGPT from $99/month, plus social posts, Google updates, review replies and email on Pro. In your voice, every week. Month to month.",
  path: "/",
})
// Same page in each market's language (hreflang).
metadata.alternates = { canonical: "/", languages: HREFLANG }

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Alphaa",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "AI Marketing Agent",
  operatingSystem: "Web",
  url: "https://alphaa.app",
  description:
    "Alphaa is an AI marketing agent for small businesses. Every week it runs their marketing. Starter ($99/month): AI search, meaning weekly checks of what ChatGPT, Gemini, Claude and Perplexity say, website fixes so they can recommend the business, and blog posts that answer what customers ask AI. Pro ($499/month): everything except ads, adding social media posts with branded images ready to publish in one tap, Google Business Profile updates, review replies, email campaigns and lead tracking. Growth ($799/month, early access): Pro plus Google or Meta ads for 1 ad account. Written in the owner's own voice. Month to month, or 15% off billed yearly.",
  // Same three plans as /pricing (lib/constants PLAN_PRICES).
  offers: (["starter", "pro", "growth"] as const).map((k) => ({
    "@type": "Offer",
    name: PLAN_NAMES[k],
    price: String(PLAN_PRICES[k].monthly),
    priceCurrency: "USD",
    priceSpecification: { "@type": "UnitPriceSpecification", price: String(PLAN_PRICES[k].monthly), priceCurrency: "USD", unitText: "MONTH" },
  })),
}

export default function HomePage() {
  return (
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            // Question + answer text only: no CTA or UI copy goes into the schema.
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }),
        }}
      />
      {/* Social proof and FAQ use data-reveal — invisible until this runs. */}
      <ScrollReveal />

      {/* Homepage v3 (2026-11-18): run your entire marketing using an AI agent. */}
      <HomeV2 />

      <Frame><FaqSection /></Frame>

      <HomeV2Final />

      {/* The page's small print, numbered; each marker above links to its note. */}
      <Frame><HomeNotes /></Frame>
    </V3Page>
  )
}
