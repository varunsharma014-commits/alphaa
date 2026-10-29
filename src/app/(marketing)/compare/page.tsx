import Link from "next/link"
import { COMPARES, COMPARE_GROUPS } from "@/content/compare"
import { pageMeta } from "@/lib/seo"

const BASE = "https://alphaa.app"

export const metadata = pageMeta({
  title: "Compare Alphaa: vs. Peec AI, Otterly, Semrush, Yext & Agencies",
  absolute: true,
  description:
    "Honest side-by-side comparisons: Alphaa vs. Peec AI, Otterly.AI, SEO agencies, freelancers, Semrush, Ahrefs, Yext, BrightLocal and Whitespark — plus SEO vs. AEO and local SEO vs. GEO explained.",
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="ap-sec cmp-hero">
        <h1 className="ap-h2 ap-center cmp-h1">
          Compare.<br /><span className="ap-quiet">Tools that tell you, or an AI Agent that does it.</span>
        </h1>
        <p className="ap-lead ap-center">
          How Alphaa stacks up against agencies, freelancers and SEO tools — and what SEO, AEO and GEO actually mean.
          We say where the other option is better, too.
        </p>
      </section>
      {COMPARE_GROUPS.map((g, gi) => (
        <section key={g.kind} className={`ap-sec${gi % 2 === 0 ? " ap-sec--grey" : ""}`} style={{ paddingTop: 72, paddingBottom: 72 }}>
          <h2 className="ap-h2 ap-center">{g.title}.</h2>
          <p className="ap-lead ap-center">{g.blurb}</p>
          <div className="cmp-grid">
            {COMPARES.filter((c) => c.kind === g.kind).map((c) => (
              <Link key={c.slug} href={`/compare/${c.slug}`} className="cmp-tile">
                <h3>{c.label}</h3>
                <p>{c.h1Quiet}</p>
                <span>Compare →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <section className="ap-sec ap-cta">
        <h2 className="ap-h2">Let me check what AI says about you.</h2>
        <p className="ap-lead">Free. About a minute. Just your website.</p>
        <Link href="/start" className="ap-btn">Check my business — free</Link>
        <p className="ap-fine">No credit card required.</p>
      </section>
    </>
  )
}
