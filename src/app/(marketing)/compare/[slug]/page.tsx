import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { COMPARES, COMPARE_CHECKED, getCompare } from "@/content/compare"
import { V3Page, Frame, Section, Faq, FinalCta } from "@/components/marketing/v3"
import { AgencyVs } from "@/components/marketing/v3/pages/AgencyVs"
import "@/components/marketing/v3/pages/compare.css"
import { clipDescription, ogImage } from "@/lib/seo"

const BASE = "https://alphaa.app"
const CHECKED_LABEL = new Date(COMPARE_CHECKED + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

export function generateStaticParams() {
  return COMPARES.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = getCompare(slug)
  if (!c) return { title: "Not found" }
  return {
    title: { absolute: c.metaTitle },
    description: clipDescription(c.description),
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: { title: c.metaTitle, description: clipDescription(c.description), type: "article", url: `${BASE}/compare/${c.slug}`, images: ogImage(c.metaTitle) },
    twitter: { card: "summary_large_image", images: ogImage(c.metaTitle).map((x) => x.url) },
  }
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = getCompare(slug)
  if (!c) notFound()

  const url = `${BASE}/compare/${c.slug}`
  const related = COMPARES.filter((x) => x.slug !== c.slug)
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: c.metaTitle,
      description: c.description,
      url,
      dateModified: COMPARE_CHECKED,
      abstract: c.tldr,
      publisher: { "@type": "Organization", name: "Alphaa", url: BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "Compare", item: `${BASE}/compare` },
        { "@type": "ListItem", position: 3, name: c.label, item: url },
      ],
    },
  ]

  return (
    <V3Page tone="ad">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Frame top>
        <Section center>
          <nav className="v3-crumbs" aria-label="Breadcrumb">
            <Link href="/compare">Compare</Link> <span aria-hidden="true">›</span> <span>{c.label}</span>
          </nav>
          <h1 className="v3-h1 v3-h1--md">
            {c.h1}<br /><span className="v3-blue">{c.h1Quiet}</span>
          </h1>
          <div className="cmp3-answer">
            <div className="cmp3-answer__k">Short answer</div>
            <p>{c.tldr}</p>
          </div>
          <div className="v3-btns">
            <Link href="/start" className="v3-btn">Get started →</Link>
          </div>
          <p className="v3-fine">Free check first · No credit card required</p>
        </Section>

        <Section center>
          <h2 className="v3-h2">{c.left} vs. {c.right}, side by side.</h2>
          <div className="cmp3-table">
            <table>
              <caption className="sr-only">{c.left} compared with {c.right}</caption>
              <thead>
                <tr>
                  <th scope="col"><span className="sr-only">Feature</span></th>
                  <th scope="col">{c.left}</th>
                  <th scope="col" className="is-us">{c.right}</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map(([k, l, r]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td data-label={c.left}>{l}</td>
                    <td data-label={c.right} className="is-us">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="v3-fine">Competitor details from their public websites, checked {CHECKED_LABEL}. Sources below.</p>
        </Section>

        <Section center>
          <h2 className="v3-h2">Credit where it’s due.</h2>
          <div className="v3-grid v3-grid--2">
            <div className="v3-card cmp3-card">
              <h3>{c.leftGood.title}</h3>
              <ul>{c.leftGood.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
            <div className="v3-card v3-card--tint cmp3-card">
              <h3>{c.rightGood.title}</h3>
              <ul>{c.rightGood.points.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          </div>
        </Section>

        {c.priceBlock && <AgencyVs />}

        <Section center>
          <h2 className="v3-h2">Which should you choose?</h2>
          <div className="v3-grid v3-grid--2">
            <div className="v3-card cmp3-card">
              <h3>Choose {c.left} if…</h3>
              <ul>{c.chooseLeft.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
            <div className="v3-card v3-card--tint cmp3-card">
              <h3>Choose {c.right} if…</h3>
              <ul>{c.chooseRight.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          </div>
        </Section>

        <Section>
          <div className="cmp3-prose">
            {c.sections.map((s) => (
              <div key={s.q}>
                <h2>{s.q}</h2>
                {s.a.map((p) => <p key={p}>{p}</p>)}
              </div>
            ))}
            {c.deepDive && (
              <p>
                Want the long version? <Link href={`/blog/${c.deepDive}`}>Read the full guide →</Link>
              </p>
            )}
          </div>
        </Section>

        <Section center>
          <h2 className="v3-h2">Questions, answered.</h2>
          <Faq items={c.faq} />
          <div className="cmp3-sources">
            <h3>Sources</h3>
            <ul>
              {c.sources.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
              ))}
            </ul>
            <p>Checked {CHECKED_LABEL}. Prices and features change — check each vendor’s site for the latest.</p>
            <p>Peec AI and other names are trademarks of their owners; no affiliation.</p>
          </div>
        </Section>

        <Section center tight>
          <h2 className="v3-h2 v3-h2--sm">More comparisons.</h2>
          <div className="cmp3-related">
            {related.map((r) => (
              <Link key={r.slug} href={`/compare/${r.slug}`}>{r.label}</Link>
            ))}
          </div>
        </Section>

        <FinalCta title="Let me run your marketing." sub="Start with a free check of your business. About a minute. Just your website.">
          <p>No credit card required.</p>
        </FinalCta>
      </Frame>
    </V3Page>
  )
}
