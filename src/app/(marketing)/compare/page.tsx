import Link from "next/link"
import { COMPARES, COMPARE_GROUPS } from "@/content/compare"
import { pageMeta } from "@/lib/seo"
import { V3Page, Frame, Section, HeroShapes, FinalCta, type SvcKey } from "@/components/marketing/v3"

const TONES: SvcKey[] = ["ad", "se", "em", "ct", "mk"]

const BASE = "https://alphaa.app"

export const metadata = pageMeta({
  title: "Compare Alphaa: vs. Peec AI, Otterly, Semrush, Yext & Agencies",
  absolute: true,
  description:
    "Honest side-by-side comparisons of Alphaa, the AI agent that runs your marketing, vs. Peec AI, Otterly.AI, SEO agencies, freelancers, Semrush, Ahrefs, Yext, BrightLocal and Whitespark. Plus SEO vs. AEO and local SEO vs. GEO explained.",
  path: "/compare",
})

export default function CompareHub() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Alphaa comparisons",
    itemListElement: COMPARES.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, url: `${BASE}/compare/${c.slug}` })),
  }
  return (
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Frame top>
        <Section className="v3-hero">
          <div>
            <p className="v3-kicker">Compare</p>
            <h1 className="v3-h1 v3-h1--md">
              Compare.<br /><span className="v3-blue">Tools that tell you, or an AI Agent that runs your marketing.</span>
            </h1>
            <p className="v3-lede">
              How Alphaa stacks up against agencies, freelancers and SEO tools, and what SEO, AEO and GEO actually mean.
              Alphaa handles your SEO and AI search, content and reviews, with social media on Pro, and email on the Growth plan (early access). Ads are coming soon.
              We say where the other option is better, too.
            </p>
          </div>
          <HeroShapes cards={[]} tones={["ad", "se", "em", "ct"]} />
        </Section>
        {COMPARE_GROUPS.map((g, gi) => (
          <Section key={g.kind} center tone={TONES[gi % TONES.length]}>
            <h2 className="v3-h2">{g.title}.</h2>
            <p className="v3-lede">{g.blurb}</p>
            <div className="v3-grid">
              {COMPARES.filter((c) => c.kind === g.kind).map((c) => (
                <Link key={c.slug} href={`/compare/${c.slug}`} className="v3-card v3-card--tint">
                  <h3 className="v3-h3">{c.label}</h3>
                  <p>{c.h1Quiet}</p>
                  <span className="v3-link" style={{ marginTop: "auto", paddingTop: 14 }}>Compare →</span>
                </Link>
              ))}
            </div>
          </Section>
        ))}
        <FinalCta title="Let me run your marketing." sub="Start with a free check of your business. About a minute. Just your website.">
          <p>No credit card required.</p>
          <p style={{ marginTop: 6 }}>Peec AI and other names are trademarks of their owners; no affiliation.</p>
        </FinalCta>
      </Frame>
    </V3Page>
  )
}
