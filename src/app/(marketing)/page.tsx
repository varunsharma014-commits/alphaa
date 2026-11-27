import { PLAN_NAMES, PLAN_PRICES } from "@/lib/constants"
import type { Metadata } from "next"
import { FaqSection } from "@/components/marketing/FaqSection"
import { HomeV2, HomeV2Final } from "@/components/marketing/home/HomeV2"
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
    "Run your marketing with an AI agent: social posts, Google updates, SEO, blogs, review replies and getting recommended by ChatGPT. In your voice, every week. From $99/month, month to month.",
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
    "Alphaa is an AI marketing agent for small businesses. Every week it runs their marketing: Google Business Profile updates, blog posts, review replies, website fixes so ChatGPT, Gemini, Claude and Perplexity can recommend them, social media posts with branded images on the Pro plan, ready to publish in one tap, and, on the Growth plan (early access), email campaigns and lead tracking. Written in the owner's own voice. From $99/month, month to month.",
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
    </V3Page>
  )
}
