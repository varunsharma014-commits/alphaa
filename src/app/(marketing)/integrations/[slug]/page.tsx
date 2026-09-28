import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ChevronDown } from "lucide-react"
import { INTEGRATIONS, INTEGRATIONS_CHECKED, getIntegration } from "@/content/integrations"
import { PlatformIcon } from "@/components/brand/PlatformIcon"

const BASE = "https://alphaa.app"

export function generateStaticParams() {
  return INTEGRATIONS.map((i) => ({ slug: i.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const i = getIntegration(slug)
  if (!i) return { title: "Not found" }
  return {
    title: { absolute: i.metaTitle },
    description: i.description,
    alternates: { canonical: `/integrations/${i.slug}` },
    openGraph: { title: i.metaTitle, description: i.description, type: "article", url: `${BASE}/integrations/${i.slug}` },
  }
}

export default async function IntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const i = getIntegration(slug)
  if (!i) notFound()

  const url = `${BASE}/integrations/${i.slug}`
  const others = INTEGRATIONS.filter((x) => x.slug !== i.slug)
  const soon = i.status === "soon"
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: i.metaTitle,
      description: i.description,
      url,
      dateModified: INTEGRATIONS_CHECKED,
      abstract: i.tldr,
      publisher: { "@type": "Organization", name: "Alphaa", url: BASE },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: i.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "Integrations", item: `${BASE}/integrations` },
        { "@type": "ListItem", position: 3, name: i.name, item: url },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="ap-sec cmp-hero">
        <nav className="cmp-crumbs" aria-label="Breadcrumb">
          <Link href="/integrations">Integrations</Link> <span aria-hidden="true">›</span> <span>{i.name}</span>
        </nav>
        <div className="int-hero__icon"><PlatformIcon platform={i.slug} size={64} /></div>
        <h1 className="ap-h2 ap-center cmp-h1">
          {i.h1}<br /><span className="ap-quiet">{i.h1Quiet}</span>
        </h1>
        <div className="cmp-answer">
          <div className="cmp-answer__k">{soon ? "Coming soon" : "In short"}</div>
          <p>{i.tldr}</p>
        </div>
        <div className="cmp-hero__cta">
          <Link href="/start" className="cmp-btn">See what AI says about you</Link>
          <span>Free scan · No credit card required</span>
        </div>
      </section>

      <section className="ap-sec ap-sec--grey">
        <h2 className="ap-h2 ap-center">{soon ? `What Alphaa does for Wix sites.` : `What Alphaa does on ${i.name}.`}</h2>
        <p className="ap-lead ap-center">You approve each change, or turn on auto-publish for blog posts on Pro. Every change has Undo.</p>
        <div className="int-grid">
          {i.does.map(([t, d]) => (
            <div key={t} className="cmp-card">
              <h3>{t}</h3>
              <p className="int-card__p">{d}</p>
            </div>
          ))}
        </div>
        {i.cant.length > 0 && (
          <div className="cmp-prose" style={{ marginTop: 48 }}>
            <h2>{soon ? "Until then" : `What it can’t do on ${i.name}`}</h2>
            <ul className="int-list">{i.cant.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        )}
      </section>

      <section className="ap-sec">
        <h2 className="ap-h2 ap-center">{soon ? "How to use Alphaa on Wix today." : "Connect it in three steps."}</h2>
        <ol className="int-steps">
          {i.steps.map((s, n) => (
            <li key={s}>
              <span className="int-steps__n">{n + 1}</span>
              <p>{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ap-sec ap-sec--grey">
        <h2 className="ap-h2 ap-center">{soon ? "Permissions." : "The permissions it asks for, and why."}</h2>
        <div className="cmp-table-wrap">
          <table className="cmp-table int-table">
            <caption className="sr-only">Permissions Alphaa asks for on {i.name}</caption>
            <thead>
              <tr>
                <th scope="col">Permission</th>
                <th scope="col">Why Alphaa needs it</th>
              </tr>
            </thead>
            <tbody>
              {i.perms.map((p) => (
                <tr key={p.scope}>
                  <th scope="row"><code>{p.scope}</code></th>
                  <td data-label="Why">{p.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {i.permsNote && <p className="cmp-note">{i.permsNote}</p>}
      </section>

      <section className="ap-sec">
        <h2 className="ap-h2 ap-center">Questions, answered.</h2>
        <div className="ap-faq" style={{ marginTop: 24 }}>
          {i.faq.map((f) => (
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
          <p>
            How Alphaa stores what it needs to connect: see our <Link href="/privacy">privacy policy</Link>. Other platforms: we email your web person the exact change.
          </p>
        </div>
      </section>

      <section className="ap-sec ap-sec--grey ap-cta">
        <h2 className="ap-h2">See what AI says about you.</h2>
        <p className="ap-lead">Free. About a minute. Just your website.</p>
        <Link href="/start" className="ap-btn">Scan Your Website – It’s Free</Link>
        <p className="ap-fine">No credit card required.</p>
      </section>

      <section className="ap-sec" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <h2 className="ap-h2 ap-center" style={{ fontSize: 28 }}>Other integrations.</h2>
        <div className="cmp-related">
          <Link href="/integrations">All integrations</Link>
          {others.map((r) => (
            <Link key={r.slug} href={`/integrations/${r.slug}`}>{r.name}{r.status === "soon" ? " (coming soon)" : ""}</Link>
          ))}
        </div>
      </section>
    </>
  )
}
