import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { INTEGRATIONS, INTEGRATIONS_CHECKED, getIntegration } from "@/content/integrations"
import { PlatformIcon } from "@/components/brand/PlatformIcon"
import { clipDescription, ogImage } from "@/lib/seo"
import { V3Page, Frame, Section, FinalCta } from "@/components/marketing/v3"

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
    description: clipDescription(i.description),
    alternates: { canonical: `/integrations/${i.slug}` },
    openGraph: { title: i.metaTitle, description: clipDescription(i.description), type: "article", url: `${BASE}/integrations/${i.slug}`, images: ogImage(i.metaTitle) },
    twitter: { card: "summary_large_image", images: ogImage(i.metaTitle).map((x) => x.url) },
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
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Frame top>
        <Section center>
          <nav className="v3-crumbs" aria-label="Breadcrumb">
            <Link href="/integrations">Connections</Link> <span aria-hidden="true">›</span> <span>{i.name}</span>
          </nav>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><PlatformIcon platform={i.slug} size={64} /></div>
          <h1 className="v3-h1 v3-h1--md">
            {i.h1}<br /><span className="v3-blue">{i.h1Quiet}</span>
          </h1>
          <div className="v3-card v3-narrow" style={{ margin: "28px auto 0", textAlign: "left" }}>
            <p className="v3-kicker" style={{ marginBottom: 6 }}>{soon ? "Coming soon" : "In short"}</p>
            <p style={{ color: "var(--v-fg2)", marginTop: 0 }}>{i.tldr}</p>
          </div>
          <div className="v3-btns">
            <Link href="/start" className="v3-btn">Let me check your business</Link>
          </div>
          <p className="v3-fine">Free scan · No credit card required</p>
        </Section>

        <Section center>
          <h2 className="v3-h2">{soon ? `What I’ll do for Wix sites.` : `What I do on ${i.name}.`}</h2>
          <p className="v3-lede">You approve each change, or turn on auto-publish for blog posts on Pro. Every change has Undo.</p>
          <div className="v3-grid">
            {i.does.map(([t, d]) => (
              <div key={t} className="v3-card">
                <h3 className="v3-h3">{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
          {i.cant.length > 0 && (
            <div className="v3-card v3-card--line v3-narrow" style={{ margin: "28px auto 0", textAlign: "left" }}>
              <h2 className="v3-h3">{soon ? "Until then" : `What I can’t do on ${i.name}`}</h2>
              <ul>{i.cant.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
        </Section>

        <Section center>
          <h2 className="v3-h2">{soon ? "How I work on Wix today." : "Connect me in three steps."}</h2>
          <ol className="v3-steps">
            {i.steps.map((s) => (
              <li key={s}><p style={{ color: "var(--v-fg2)", marginTop: 0 }}>{s}</p></li>
            ))}
          </ol>
        </Section>

        <Section center>
          <h2 className="v3-h2">{soon ? "The access I ask for." : "The access I ask for, and why."}</h2>
          <div className="v3-table">
            <table>
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
          {i.permsNote && <p className="v3-fine">{i.permsNote}</p>}
        </Section>

        <Section center>
          <h2 className="v3-h2">Questions, answered.</h2>
          <div className="v3-faq">
            {i.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className="v3-fine">
            How Alphaa stores what it needs to connect: see our <Link href="/privacy">privacy policy</Link>. Other platforms: we email your web person the exact change.
          </p>
        </Section>

        <Section center tight>
          <h2 className="v3-h2 v3-h2--sm">Other connections.</h2>
          <div className="v3-chips">
            <Link className="v3-chip" href="/integrations" style={{ textDecoration: "none" }}>All connections</Link>
            {others.map((r) => (
              <Link key={r.slug} className="v3-chip" style={{ textDecoration: "none" }} href={`/integrations/${r.slug}`}>{r.name}{r.status === "soon" ? " (coming soon)" : ""}</Link>
            ))}
          </div>
        </Section>

        <FinalCta title="Let me check what AI says about you." sub="Free. About a minute. Just your website." label="Check my business — free">
          <p>No credit card required.</p>
        </FinalCta>
      </Frame>
    </V3Page>
  )
}
