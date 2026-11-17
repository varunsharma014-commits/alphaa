import type { Metadata } from "next"
import { FaqSection } from "@/components/marketing/FaqSection"
import { HomeV2, HomeV2Final } from "@/components/marketing/home/HomeV2"
import { faqs } from "@/components/marketing/faq-data"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { pageMeta } from "@/lib/seo"
import { HREFLANG } from "@/content/locales"

// SoftwareApplication structured data so AI engines / Google can state exactly
// what Alphaa is, its category, and its price. No aggregateRating (we won't
// publish unverifiable review counts).
export const metadata: Metadata = pageMeta({
  title: "Get Recommended by ChatGPT, Gemini, Claude & Perplexity | Alphaa",
  absolute: true,
  description:
    "Alphaa is an AI Agent that gets your business recommended by ChatGPT, Gemini, Claude and Perplexity. It does the work, you tap approve. $99/month, month to month.",
  path: "/",
})
// Same page in each market's language (hreflang).
metadata.alternates = { canonical: "/", languages: HREFLANG }

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Alphaa",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "AI Search Optimization (AEO)",
  operatingSystem: "Web",
  url: "https://alphaa.app",
  description:
    "Alphaa is an AI agent that works to get businesses recommended by ChatGPT, Gemini, Claude and Perplexity: it checks what those AIs say about you, fixes what they can't read on your site, writes the pages they quote, and keeps your Google Business Profile active — from $99/month, month to month, instead of a $2,000/month SEO agency.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "99",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "99", priceCurrency: "USD", unitText: "MONTH" },
    },
    {
      "@type": "Offer",
      name: "Full Service",
      price: "299",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "299", priceCurrency: "USD", unitText: "MONTH" },
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "199",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "199", priceCurrency: "USD", unitText: "MONTH" },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }),
        }}
      />
      {/* Social proof and FAQ use data-reveal — invisible until this runs. */}
      <ScrollReveal />

      {/* Homepage v2 (2026-11-17): run your entire marketing using an AI agent. */}
      <HomeV2 />

      <FaqSection />

      <HomeV2Final />
    </>
  )
}
