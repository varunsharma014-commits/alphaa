import Link from "next/link"
import Image from "next/image"
import { AgencySection } from "@/components/marketing/AgencySection"
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

      <section className="ag-section">
        <h2>Most tools give you a to-do list.<br /><span className="ag-quiet">{BRAND.agentName} just does the to-dos.</span></h2>
        <p className="ag-section__sub">Marketing tools show you a complicated dashboard and leave you to figure it out. {BRAND.agentName} reads, writes, fixes and publishes — then tells you exactly what it did in plain English.</p>
        <div className="ag-three">
          <div className="ag-tile">
            <div className="ag-tile__t">Every week</div>
            <h3>It tracks your AI visibility.</h3>
            <p>Every week, {BRAND.agentName} asks the major AI engines the exact questions your customers are asking. Then it tells you who got recommended — you, or the shop down the street.</p>
            <div className="ag-tile__quote"><span className="ag-who">{BRAND.agentName} says</span>Good morning. I asked ChatGPT for the “best dentist near Zilker” today. It named 3 clinics. You weren’t one. Here’s why, and what I’m doing to fix it.</div>
          </div>
          <div className="ag-tile">
            <div className="ag-tile__t">All week</div>
            <h3>It writes what the AI needs to read.</h3>
            <p>{BRAND.agentName} builds the answers, facts and pages that AI bots check before they recommend anyone. It writes it, places it, and keeps it current.</p>
            <div className="ag-tile__quote"><span className="ag-who">{BRAND.agentName} says</span>I wrote a page answering “Do you take Delta Dental?” — the #2 question in your area. Ready for your site when you say go.</div>
          </div>
          <div className="ag-tile">
            <div className="ag-tile__t">Only when it matters</div>
            <h3>You stay in total control.</h3>
            <p>Posts, replies and new pages are queued up for your review. You get a one-tap approve. Nothing goes public in your name without your green light.</p>
            <div className="ag-tile__quote"><span className="ag-who">{BRAND.agentName} says</span>I drafted a reply to Maria’s 5-star review. Post it? <b>Approve</b> · Edit</div>
          </div>
        </div>
      </section>

      <AgencySection />

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
          <p style={{ marginTop: 14, fontSize: 14 }}><Link href="/pricing">Compare Plans ›</Link></p>
        </div>
      </section>

      <FaqSection />
    </>
  )
}
