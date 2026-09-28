import { EngineRotator } from "@/components/marketing/hero/EngineRotator"
import { HeroBackdrop } from "@/components/marketing/hero/HeroBackdrop"
import Link from "next/link"
import Image from "next/image"
import { RevenueSection, TodoAccordion, EasyRail, AgencyToggle } from "@/components/marketing/apple/Sections"
import { AVATARS } from "@/components/marketing/HeroSection"
import { AgentHomeDemo } from "@/components/marketing/AgentHomeDemo"
import { SocialProof } from "@/components/marketing/SocialProof"
import { FaqSection } from "@/components/marketing/FaqSection"
import { faqs } from "@/components/marketing/faq-data"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { BRAND } from "@/lib/brand"

// SoftwareApplication structured data so AI engines / Google can state exactly
// what Alphaa is, its category, and its price. No aggregateRating (we won't
// publish unverifiable review counts).
export const metadata = { alternates: { canonical: "/" } }

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
        <h1>Get customers<br />from <EngineRotator /></h1>
        <p className="ag-hero__sub">
          Meet {BRAND.agentName}: the AI agent that works 24/7 to put your business at the top of AI search answers. You watch. It does the work.
        </p>
        <div className="ag-hero__cta ag-hero__cta--big">
          <Link className="ag-hero__big" href="/start">Scan your website free</Link>
          <span className="ag-hero__promise">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.9C8 19.4 5 15.6 5 11V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
            <span>If no AI names you within 90 days, <b>your next month is free.</b></span>
          </span>
          <a className="ag-hero__more" href="#watch">Watch it work</a>
        </div>
        <div className="ag-fine">No credit card required.</div>
        <div className="ag-trust ag-trust--small">
          <div className="ag-trust__faces">
            {AVATARS.map((src) => (
              <Image key={src} src={src} width={36} height={36} alt="" aria-hidden="true" />
            ))}
          </div>
          <span><b>Trusted by 1,200+ businesses</b> getting found on AI</span>
        </div>
        <div id="watch"><AgentHomeDemo /></div>
        </div>
      </section>
      </div>

      <RevenueSection />

      <TodoAccordion />

      <EasyRail />

      <AgencyToggle />

      <SocialProof />

      <section className="ag-section ag-section--grey">
        <h2>Hire your agent. Cancel your agency.</h2>
        <p className="ag-section__sub">Everything you need to dominate AI search, fully automated.</p>
        <div className="ag-price">
          <div className="ag-price__amt">$99<small>/month</small></div>
          <ul className="ag-price__list">
            <li>Full AI visibility tracking (ChatGPT, Claude, Gemini, Perplexity)</li>
            <li>Automated Google Business Profile optimization</li>
            <li>One-click content approval and publishing</li>
            <li>Month-to-month. No contracts. Cancel in two clicks.</li>
            <li>90-day AI Visibility Guarantee — if no AI names you, your next month is free.</li>
          </ul>
          <Link className="ag-pill ag-pill--blue" href="/start">Hire Your Agent Now</Link>
          <p style={{ marginTop: 14, fontSize: 14 }}><Link href="/pricing">Compare Plans ›</Link></p>
        </div>
      </section>

      <FaqSection />
    </>
  )
}
