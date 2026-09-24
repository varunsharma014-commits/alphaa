import Link from "next/link"
import Image from "next/image"
import { RevenueSection, TodoAccordion, EasyRail, AgencyToggle } from "@/components/marketing/apple/Sections"
import { AVATARS } from "@/components/marketing/HeroSection"
import { AgentHomeDemo } from "@/components/marketing/AgentHomeDemo"
import { SocialProof } from "@/components/marketing/SocialProof"
import { FaqSection } from "@/components/marketing/FaqSection"
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
    "Automated AI Search Optimization (AEO) that gets your business discovered, cited, and recommended by ChatGPT, Claude, Gemini, and Perplexity — for $99/month instead of a $2,000/month SEO agency.",
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
      {/* Social proof and FAQ use data-reveal — invisible until this runs. */}
      <ScrollReveal />

      {/* Hero — the agent, not the dashboard, is the product. */}
      <section className="ag-hero">
        <div className="ag-hero__eyebrow">{BRAND.agentName}. An AI agent for your business.</div>
        <h1>Get Recommended by ChatGPT, Claude, Gemini and other AI.</h1>
        <p className="ag-hero__sub">
          Meet {BRAND.agentName}: the AI agent that works 24/7 to get your business recommended on ChatGPT, Gemini, Claude and Perplexity. You watch. It does the work.
        </p>
        <div className="ag-hero__cta">
          <Link className="ag-pill ag-pill--blue" href="/start">Scan Your Website – It’s Free</Link>
          <a className="ag-hero__more" href="#watch">Watch it work</a>
        </div>
        <div className="ag-fine">Takes 5 seconds. Just enter your URL.</div>
        <div className="ag-trust">
          <div className="ag-trust__faces">
            {AVATARS.map((src) => (
              <Image key={src} src={src} width={36} height={36} alt="" aria-hidden="true" />
            ))}
          </div>
          <span><b>Trusted by 1,200+ businesses</b> getting found on AI</span>
        </div>
        <div id="watch"><AgentHomeDemo /></div>
      </section>

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
          </ul>
          <Link className="ag-pill ag-pill--blue" href="/start">Hire Your Agent Now</Link>
          <p style={{ marginTop: 14, fontSize: 15.4 }}><Link href="/pricing">Compare Plans ›</Link></p>
        </div>
      </section>

      <FaqSection />
    </>
  )
}
