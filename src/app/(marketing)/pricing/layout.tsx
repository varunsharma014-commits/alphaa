import type { Metadata } from "next"
import { plans, billingFaqs } from "./pricing-data"

// page.tsx is a client component (the monthly/annual toggle needs state), and
// client components can't export metadata — hence this layout.
export const metadata: Metadata = {
  title: "Pricing — $99/month, no contracts",
  description:
    "Alphaa is an AI agent that gets your business recommended by ChatGPT, Claude, Gemini and Perplexity. From $99/month, month to month, no contracts — instead of a $2,000/month SEO agency. Starter, Pro and Full Service plans.",
  alternates: { canonical: "/pricing" },
}

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Alphaa",
  description: "An AI agent that works to get businesses recommended by ChatGPT, Gemini, Claude and Perplexity. Month to month, no contract.",
  brand: { "@type": "Brand", name: "Alphaa" },
  url: "https://alphaa.app/pricing",
  offers: plans.map((p) => ({
    "@type": "Offer",
    name: p.name,
    description: p.description,
    price: String(p.monthly),
    priceCurrency: "USD",
    priceSpecification: { "@type": "UnitPriceSpecification", price: String(p.monthly), priceCurrency: "USD", unitText: "MONTH" },
    availability: "https://schema.org/InStock",
    url: "https://alphaa.app/pricing",
  })),
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: billingFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  )
}
