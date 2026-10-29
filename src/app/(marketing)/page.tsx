import { EngineRotator } from "@/components/marketing/hero/EngineRotator"
import { HeroBackdrop } from "@/components/marketing/hero/HeroBackdrop"
import Link from "next/link"
import { RevenueSection, TodoAccordion, EasyRail, AgencyToggle } from "@/components/marketing/apple/Sections"
import { StartAgent } from "@/components/agent/StartAgent"
import { HeroCta } from "@/components/marketing/hero/HeroCta"
import { HeroArrows } from "@/components/marketing/hero/HeroArrows"
import { FaqSection } from "@/components/marketing/FaqSection"
import { faqs } from "@/components/marketing/faq-data"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { BRAND } from "@/lib/brand"
import { pageMeta } from "@/lib/seo"

// SoftwareApplication structured data so AI engines / Google can state exactly
// what Alphaa is, its category, and its price. No aggregateRating (we won't
// publish unverifiable review counts).
export const metadata = pageMeta({
  title: "Get Recommended by ChatGPT, Gemini, Claude & Perplexity | Alphaa",
  absolute: true,
  description:
    "Alphaa is an AI Agent that gets your business recommended by ChatGPT, Gemini, Claude and Perplexity. It does the work, you tap approve. $99/month, month to month.",
  path: "/",
})

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

      {/* Hero — the agent, not the dashboard, is the product. */}
      <div className="hx-wrap">
      <HeroBackdrop />
      <section className="ag-hero">
        <div className="ag-hero__in">
        <h1><span className="hx-l1">Get customers from <EngineRotator /></span><br /><span className="ap-quiet">Your AI agent does the work.</span></h1>
        <p className="ag-hero__sub">
          Meet {BRAND.agentName}: it works around the clock to get your business named when people ask AI for a recommendation, then tells you exactly what it did.
        </p>
        <div className="ag-hero__cta ag-hero__cta--big">
          <HeroCta />
          <span className="ag-hero__promise">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.9C8 19.4 5 15.6 5 11V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
            <span>If no AI names you within 90 days, <b>your next month is free. Guaranteed!</b></span>
          </span>
        </div>
        <div className="ag-fine">No credit card required. Checks <b>ChatGPT, Gemini, Claude and Perplexity</b>.</div>
        {/* The real /start conversation, right in the hero. */}
        <div id="check" className="hx-check"><HeroArrows /><StartAgent embedded /></div>
        </div>
      </section>
      </div>

      <RevenueSection />

      <TodoAccordion />

      <EasyRail />

      <AgencyToggle />

      <section className="ag-section ag-section--grey">
        <h2>Hire your agent. Cancel your agency.</h2>
        <p className="ag-section__sub">Everything it takes to get named by AI, done for you.</p>
        <div className="ag-price">
          <div className="ag-price__amt">$99<small>/month</small></div>
          <ul className="ag-price__list">
            <li>Weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about you</li>
            <li>Your Google listing kept fresh: posts and review replies written for you</li>
            <li>Nothing goes live until you tap approve</li>
            <li>Month-to-month. No contracts. Cancel in two clicks.</li>
            <li>90-day guarantee: if no AI names you, your next month is free.</li>
          </ul>
          <Link className="ag-pill ag-pill--blue" href="/start">Hire Your Agent Now</Link>
          <p style={{ marginTop: 14, fontSize: 14 }}><Link href="/pricing">Compare Plans ›</Link></p>
        </div>
      </section>

      <FaqSection />
    </>
  )
}
