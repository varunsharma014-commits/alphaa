import { plans, billingFaqs } from "./pricing-data"
import { pageMeta } from "@/lib/seo"

// page.tsx is a client component (the monthly/annual toggle needs state), and
// client components can't export metadata — hence this layout.
export const metadata = pageMeta({
  title: "Pricing: AI Marketing Agent from $99/month, no contracts",
  description:
    "Alphaa is an AI Agent that runs your marketing: AI search from $99/month, everything except ads on Pro at $499 (social, Google posts, reviews, email, lead tracking), and Google and Meta ads on Growth at $799 (early access). Month to month or 15% off yearly, instead of agency retainers that often run $1,000+ a month.",
  path: "/pricing",
})

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Alphaa",
  description: "An AI agent that runs a small business’s marketing: AI search (ChatGPT, Gemini, Claude, Perplexity) on every plan; social media, Google Business Profile posts, review replies, email and lead tracking on the Pro plan; Google and Meta ads on the Growth plan (early access). Month to month, no contract, or 15% off billed yearly.",
  brand: { "@type": "Brand", name: "Alphaa" },
  url: "https://alphaa.app/pricing",
  offers: plans.map((p) => ({
    "@type": "Offer",
    name: p.name,
    description: p.description,
    price: String(p.monthly),
    priceCurrency: "USD",
    priceSpecification: { "@type": "UnitPriceSpecification", price: String(p.monthly), priceCurrency: "USD", unitText: "MONTH" },
    availability: p.href ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
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
