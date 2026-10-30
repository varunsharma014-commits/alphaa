import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Noto_Sans_Arabic } from "next/font/google"
import type { Market } from "@/content/markets/types"
import { MARKETS } from "@/content/locales"
import { tradeAlternates } from "@/content/markets/equivalents"
import { GUIDES } from "@/content/markets/guides"

const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], display: "swap" })
const SITE = "https://alphaa.app"

function find(m: Market, slug: string) {
  return m.extra.industries.find((i) => i.slug === slug)
}

// The same trade in other markets and languages (src/content/markets/equivalents.ts).
function languages(m: Market, slug: string): Record<string, string> | undefined {
  return tradeAlternates(m.copy.key, slug)
}

export function industryParams(m: Market) {
  return m.extra.industries.map((i) => ({ industry: i.slug }))
}

export function industryMeta(m: Market, slug: string): Metadata {
  const ind = find(m, slug)
  if (!ind) return { title: "Not found" }
  const path = `${m.copy.path}/${ind.slug}`
  // The preview-card renderer has no Arabic font, so Arabic pages get the English card.
  const card = m.copy.lang.startsWith("ar") ? MARKETS.ae.extra.industries.find((i) => i.slug === slug) ?? ind : ind
  const og = `${SITE}/og?title=${encodeURIComponent(card.h1)}&eyebrow=${encodeURIComponent(m.copy.lang.startsWith("ar") ? "United Arab Emirates" : m.copy.country)}`
  return {
    title: { absolute: `${ind.title} | Alphaa` },
    description: ind.description,
    alternates: { canonical: path, ...(languages(m, slug) ? { languages: languages(m, slug) } : {}) },
    openGraph: { title: ind.title, description: ind.description, url: `${SITE}${path}`, locale: m.copy.lang.replace("-", "_"), images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: ind.title, description: ind.description, images: [og] },
  }
}

// One trade in one market, e.g. alphaa.app/de/zahnarzt.
export function LocalIndustry({ m, slug }: { m: Market; slug: string }) {
  const ind = find(m, slug)
  if (!ind) notFound()
  const l = m.copy
  const rtl = l.lang.startsWith("ar")
  const url = `${SITE}${l.path}/${ind.slug}`
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: ind.title,
      description: ind.description,
      url,
      inLanguage: l.lang,
      provider: { "@type": "Organization", name: "Alphaa", url: SITE },
      areaServed: { "@type": "Country", name: l.country },
      audience: { "@type": "BusinessAudience", name: ind.name },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: l.lang,
      mainEntity: ind.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: l.country, item: `${SITE}${l.path}` },
        { "@type": "ListItem", position: 2, name: ind.name, item: url },
      ],
    },
  ]
  return (
    <div lang={l.lang} dir={rtl ? "rtl" : "ltr"} className={rtl ? `lc-rtl ${arabic.className}` : undefined}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="ag-hero">
        <div className="ag-hero__in">
          <p className="lc-crumb"><Link href={l.path}>{m.extra.backToMarket}</Link></p>
          <h1 className="lc-h1">{ind.h1}</h1>
          <p className="ag-hero__sub">{ind.sub}</p>
          <div className="ag-hero__cta ag-hero__cta--big">
            <Link className="ag-hero__big" href={`${l.path}#check`}>{m.extra.industryCta}</Link>
            <span className="ag-hero__promise"><span>{l.guarantee[0]} <b>{l.guarantee[1]}</b></span></span>
          </div>
        </div>
      </section>

      <section className="ag-section ag-section--grey">
        <h2>{m.extra.questionsTitle}</h2>
        <div className="lc-qs">
          {ind.questions.map((q) => (
            <div key={q} className="lc-q"><p>&ldquo;{q}&rdquo;</p></div>
          ))}
        </div>
      </section>

      <section className="ag-section">
        <h2>{l.whereTitle}</h2>
        <div className="lc-grid lc-grid--4">
          {ind.where.map((w) => (
            <div key={w.name} className="lc-card"><h3>{w.name}</h3><p>{w.why}</p></div>
          ))}
        </div>
      </section>

      <section className="ag-section ag-section--grey">
        <h2>{l.pillarsTitle}</h2>
        <div className="lc-grid">
          {ind.steps.map((s) => (
            <div key={s.title} className="lc-card"><h3>{s.title}</h3><p>{s.body}</p></div>
          ))}
        </div>
      </section>

      <section className="ag-section">
        <h2>{l.faqTitle}</h2>
        <div className="lc-faq">
          {ind.faq.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
        <div className="ag-hero__cta" style={{ marginTop: 36 }}>
          <Link className="ag-hero__big" href={`${l.path}#check`}>{m.extra.industryCta}</Link>
        </div>
        <div className="lc-guides">
          <h3>{GUIDES[l.key].label}</h3>
          {GUIDES[l.key].guides.map((g) => (
            <Link key={g.slug} href={`${l.path}/${GUIDES[l.key].base}/${g.slug}`}>{g.h1} ›</Link>
          ))}
        </div>
        <p className="lc-en"><Link href={l.path}>{m.extra.backToMarket}</Link></p>
      </section>
    </div>
  )
}

export { MARKETS }
