import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { arabic } from "@/fonts"
import { V3Page, Frame, Section, HeroShapes, Faq, type SvcKey } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/local.css"

const TONES: SvcKey[] = ["mk", "ad", "ct", "se", "em"]
import type { Market } from "@/content/markets/types"
import { MARKETS } from "@/content/locales"
import { tradeAlternates } from "@/content/markets/equivalents"
import { GUIDES } from "@/content/markets/guides"
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
  const fontVar = rtl ? ({ ["--v-font" as string]: `${arabic.style.fontFamily}, var(--font-apple)` } as CSSProperties) : undefined
  const cta = <div className="v3-btns lc3-cta"><Link className="ag-hero__big" href={`${l.path}#check`}>{m.extra.industryCta}</Link></div>
  return (
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div lang={l.lang} dir={rtl ? "rtl" : "ltr"} className="v3" style={fontVar}>
        <Frame top>
          <Section className="v3-hero">
            <div>
              <nav className="v3-crumbs" aria-label="Breadcrumb"><Link href={l.path}>{m.extra.backToMarket}</Link></nav>
              <h1 className="v3-h1 v3-h1--md">{ind.h1}</h1>
              <p className="v3-lede">{ind.sub}</p>
              {cta}
              <p className="lc3-promise"><span>{l.guarantee[0]} <b>{l.guarantee[1]}</b></span></p>
            </div>
            <HeroShapes tones={["se", "mk", "ad", "ct"]} note={null} />
          </Section>

          <Section center>
            <h2 className="v3-h2">{m.extra.questionsTitle}</h2>
            <div className="v3-grid">
              {ind.questions.map((q) => (
                <div key={q} className="v3-card"><p className="lc3-q">&ldquo;{q}&rdquo;</p></div>
              ))}
            </div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{l.whereTitle}</h2>
            <div className="v3-grid">
              {ind.where.map((w) => (
                <div key={w.name} className="v3-card"><h3 className="v3-h3">{w.name}</h3><p>{w.why}</p></div>
              ))}
            </div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{l.pillarsTitle}</h2>
            <div className="v3-grid">
              {ind.steps.map((st, i) => (
                <div key={st.title} className={`v3-card v3-card--tint v3-c-${TONES[i % TONES.length]}`}><h3 className="v3-h3">{st.title}</h3><p>{st.body}</p></div>
              ))}
            </div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{l.faqTitle}</h2>
            <Faq items={ind.faq} />
            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>{cta}</div>
            <div className="lc3-links">
              <h3>{GUIDES[l.key].label}</h3>
              {GUIDES[l.key].guides.map((g) => (
                <Link key={g.slug} href={`${l.path}/${GUIDES[l.key].base}/${g.slug}`}>{g.h1} ›</Link>
              ))}
            </div>
            <p className="lc3-foot"><Link href={l.path}>{m.extra.backToMarket}</Link></p>
          </Section>
        </Frame>
      </div>
    </V3Page>
  )
}

export { MARKETS }
