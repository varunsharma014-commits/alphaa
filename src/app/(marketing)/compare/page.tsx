import Link from "next/link"
import type { Metadata } from "next"
import { COMPARES, COMPARE_GROUPS } from "@/content/compare"

const BASE = "https://alphaa.app"

export const metadata: Metadata = {
  title: { absolute: "Compare Alphaa — vs. SEO Agencies, Semrush, Ahrefs, Yext, BrightLocal & Whitespark" },
  description:
    "Honest side-by-side comparisons: Alphaa vs. SEO agencies, freelancers, Semrush, Ahrefs, Yext, BrightLocal and Whitespark — plus SEO vs. AEO and local SEO vs. GEO explained.",
  alternates: { canonical: "/compare" },
}

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
          Compare.<br /><span className="ap-quiet">Honestly.</span>
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
        <h2 className="ap-h2">See what AI says about you.</h2>
        <p className="ap-lead">Free. About a minute. Just your website.</p>
        <Link href="/start" className="ap-btn">Scan Your Website – It’s Free</Link>
        <p className="ap-fine">No credit card required.</p>
      </section>
    </>
  )
}
