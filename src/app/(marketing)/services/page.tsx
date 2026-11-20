import Link from "next/link"
import "@/components/marketing/home/home-v2.css"
import { SERVICES } from "@/content/services"
import { pageMeta } from "@/lib/seo"
import { GROWTH_ON_SALE } from "@/lib/growth"
import { V3Page, Frame, Section, ServicePills, HeroShapes, ServiceChapter, FinalCta, SVC_ORDER } from "@/components/marketing/v3"

export const metadata = pageMeta({
  title: "AI Marketing Services for Small Businesses",
  description: "One AI agent runs your whole marketing: social media, Google and Meta ads, SEO and AI search, blog posts and email. Month to month, from $99.",
  path: "/services",
})

const SITE = "https://alphaa.app"

export default function ServicesIndex() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Alphaa marketing services",
    itemListElement: SERVICES.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/services/${s.slug}`, name: s.kicker })),
  }
  return (
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Frame top>
        <Section className="v3-hero">
          <div>
            <p className="v3-kicker">Services</p>
            <ServicePills />
            <h1 className="v3-h1">Your whole marketing. <span className="v3-blue">One AI agent.</span></h1>
            <p className="v3-lede">Stop juggling an agency, a freelancer and five apps. Your AI agent does all of it every week, in your voice, and shows you what’s bringing customers in.</p>
            <div className="v3-btns"><Link className="v3-btn" href="/start">Get started →</Link><Link className="v3-btn v3-btn--ghost" href="/pricing">See pricing</Link></div>
            <p className="v3-fine">Month to month. Cancel online in a minute.</p>
          </div>
          <HeroShapes cards={["3 posts ready for this week", "Ads paused for your OK", "ChatGPT named you"]} tones={["mk", "ad", "se", "em"]} />
        </Section>
        <Section>
          <div className="v3-chapters">
            {SVC_ORDER.map((slug) => (
              <ServiceChapter key={slug} slug={slug} growthNote={GROWTH_ON_SALE ? "Growth plan" : "Growth plan · early access"} />
            ))}
          </div>
        </Section>
        <FinalCta title={<>Run the business.<br /><span>I’ll run the marketing.</span></>} sub="Month to month. Cancel online in a minute." />
      </Frame>
    </V3Page>
  )
}
