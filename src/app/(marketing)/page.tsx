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
        <h1>When someone asks ChatGPT,<br />it says your name.</h1>
        <p className="ag-hero__sub">
          An AI agent that works every day to get you recommended by ChatGPT, Gemini, Claude and Perplexity. You watch. It does the work.
        </p>
        <div className="ag-hero__cta">
          <Link className="ag-pill ag-pill--blue" href="/start">See what AI says about you</Link>
          <a className="ag-hero__more" href="#watch">Watch it work</a>
        </div>
        <div className="ag-fine">Takes 60 seconds. Just your website.</div>
        <div className="ag-trust">
          <div className="ag-trust__faces">
            {AVATARS.map((src) => (
              <Image key={src} src={src} width={36} height={36} alt="" aria-hidden="true" />
            ))}
          </div>
          <span><b>Trusted by local businesses</b> and online brands getting found on AI</span>
        </div>
        <div id="watch"><AgentHomeDemo /></div>
      </section>

      <section className="ag-section">
        <h2>It doesn’t give you a to-do list.<br /><span className="ag-quiet">It does the to-dos.</span></h2>
        <p className="ag-section__sub">Tools show you a dashboard and leave. {BRAND.agentName} reads, writes, fixes and publishes — then tells you what it did, in plain English.</p>
        <div className="ag-three">
          <div className="ag-tile">
            <div className="ag-tile__t">Every week</div>
            <h3>It asks the AIs about you.</h3>
            <p>The exact questions your customers ask. Then it tells you who got recommended — you or the shop down the road.</p>
            <div className="ag-tile__quote"><span className="ag-who">example</span>Asked ChatGPT “best dentist near Zilker”. It named 3 clinics. You weren’t one. Here’s why, and what I’m doing about it.</div>
          </div>
          <div className="ag-tile">
            <div className="ag-tile__t">All week</div>
            <h3>It writes what AI needs to read.</h3>
            <p>The answers, the facts, the pages AI checks before it recommends anyone. Written, placed, kept current.</p>
            <div className="ag-tile__quote"><span className="ag-who">example</span>Wrote a page answering “Do you take Delta Dental?” — the #2 question in your area. Ready for your site when you say go.</div>
          </div>
          <div className="ag-tile">
            <div className="ag-tile__t">Only when it matters</div>
            <h3>It asks before anything public.</h3>
            <p>Posts, replies, new pages — you get a one-tap approve. Nothing goes out in your name without you.</p>
            <div className="ag-tile__quote"><span className="ag-who">example</span>Drafted a reply to Maria’s 5-star review. Post it? <b>Approve</b> · Edit</div>
          </div>
        </div>
      </section>

      <AgencySection />

      <SocialProof />

      <section className="ag-section ag-section--grey">
        <h2>One agent. From $99 a month.</h2>
        <div className="ag-price">
          <div className="ag-price__amt">$99<small>/month</small></div>
          <p>Month to month. No contract. Cancel in two clicks.</p>
          <Link className="ag-pill ag-pill--blue" href="/start">Meet your agent</Link>
          <p style={{ marginTop: 14, fontSize: 14 }}><Link href="/pricing">Compare plans ›</Link></p>
        </div>
      </section>

      <FaqSection />
    </>
  )
}
