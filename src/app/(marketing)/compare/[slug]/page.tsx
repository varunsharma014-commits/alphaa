import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ChevronDown } from "lucide-react"
import { COMPARES, COMPARE_CHECKED, getCompare } from "@/content/compare"
import { AgencyToggle } from "@/components/marketing/apple/Sections"

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
    description: c.description,
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: { title: c.metaTitle, description: c.description, type: "article", url: `${BASE}/compare/${c.slug}` },
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="ap-sec cmp-hero">
        <nav className="cmp-crumbs" aria-label="Breadcrumb">
          <Link href="/compare">Compare</Link> <span aria-hidden="true">›</span> <span>{c.label}</span>
        </nav>
        <h1 className="ap-h2 ap-center cmp-h1">
          {c.h1}<br /><span className="ap-quiet">{c.h1Quiet}</span>
        </h1>
        <div className="cmp-answer">
          <div className="cmp-answer__k">Short answer</div>
          <p>{c.tldr}</p>
        </div>
        <div className="cmp-hero__cta">
          <Link href="/start" className="cmp-btn">See what AI says about you</Link>
          <span>Free scan · No credit card required</span>
        </div>
      </section>

      <section className="ap-sec ap-sec--grey">
        <h2 className="ap-h2 ap-center">{c.left} vs. {c.right}, side by side.</h2>
        <div className="cmp-table-wrap">
          <table className="cmp-table">
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
        <p className="cmp-note">Competitor details from their public websites, checked {CHECKED_LABEL}. Sources below.</p>
      </section>

      <section className="ap-sec">
        <h2 className="ap-h2 ap-center">Credit where it’s due.</h2>
        <div className="cmp-cards">
          <div className="cmp-card">
            <h3>{c.leftGood.title}</h3>
            <ul>{c.leftGood.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className="cmp-card is-us">
            <h3>{c.rightGood.title}</h3>
            <ul>{c.rightGood.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </section>

      {c.priceBlock && <AgencyToggle />}

      <section className="ap-sec ap-sec--grey">
        <h2 className="ap-h2 ap-center">Which should you choose?</h2>
        <div className="cmp-cards">
          <div className="cmp-card">
            <h3>Choose {c.left} if…</h3>
            <ul>{c.chooseLeft.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className="cmp-card is-us">
            <h3>Choose {c.right} if…</h3>
            <ul>{c.chooseRight.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="ap-sec">
        <div className="cmp-prose">
          {c.sections.map((s) => (
            <div key={s.q}>
              <h2>{s.q}</h2>
              {s.a.map((p) => <p key={p}>{p}</p>)}
            </div>
          ))}
          {c.deepDive && (
            <p className="cmp-more">
              Want the long version? <Link href={`/blog/${c.deepDive}`}>Read the full guide →</Link>
            </p>
          )}
        </div>
      </section>

      <section className="ap-sec ap-sec--grey">
        <h2 className="ap-h2 ap-center">Questions, answered.</h2>
        <div className="ap-faq" style={{ marginTop: 24 }}>
          {c.faq.map((f) => (
            <details key={f.q} className="cmp-faq">
              <summary>
                <span>{f.q}</span>
                <ChevronDown className="ap-faq__chev" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="cmp-sources">
          <h3>Sources</h3>
          <ul>
            {c.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
            ))}
          </ul>
          <p>Checked {CHECKED_LABEL}. Prices and features change — check each vendor’s site for the latest.</p>
        </div>
      </section>

      <section className="ap-sec ap-cta">
        <h2 className="ap-h2">See what AI says about you.</h2>
        <p className="ap-lead">Free. About a minute. Just your website.</p>
        <Link href="/start" className="ap-btn">Scan Your Website – It’s Free</Link>
        <p className="ap-fine">No credit card required.</p>
      </section>

      <section className="ap-sec ap-sec--grey" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <h2 className="ap-h2 ap-center" style={{ fontSize: 28 }}>More comparisons.</h2>
        <div className="cmp-related">
          {related.map((r) => (
            <Link key={r.slug} href={`/compare/${r.slug}`}>{r.label}</Link>
          ))}
        </div>
      </section>
    </>
  )
}
