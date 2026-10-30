import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Noto_Sans_Arabic } from "next/font/google"
import { MARKETS, type LocaleKey } from "@/content/locales"
import { GUIDES } from "@/content/markets/guides"
import { AUTHOR, AUTHOR_SCHEMA } from "@/lib/author"
import { clipDescription } from "@/lib/seo"

const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], display: "swap" })
const SITE = "https://alphaa.app"

const BY: Record<string, string> = { en: "By", de: "Von", fr: "Par", it: "Di", ar: "بقلم" }

export function guideParams(key: LocaleKey) {
  return GUIDES[key].guides.map((g) => ({ slug: g.slug }))
}

function guidePath(key: LocaleKey, slug?: string) {
  const g = GUIDES[key]
  return `${MARKETS[key].copy.path}/${g.base}${slug ? `/${slug}` : ""}`
}

export function guideMeta(key: LocaleKey, slug: string): Metadata {
  const g = GUIDES[key].guides.find((x) => x.slug === slug)
  if (!g) return { title: "Not found" }
  const l = MARKETS[key].copy
  const og = `${SITE}/og?title=${encodeURIComponent(l.lang.startsWith("ar") ? "Alphaa" : g.h1)}&eyebrow=${encodeURIComponent(GUIDES[key].label)}`
  return {
    title: { absolute: `${g.title} | Alphaa` },
    description: g.description,
    alternates: { canonical: guidePath(key, slug) },
    authors: [{ name: AUTHOR.name, url: `${SITE}${AUTHOR.path}` }],
    openGraph: { type: "article", title: g.title, description: g.description, url: `${SITE}${guidePath(key, slug)}`, locale: l.lang.replace("-", "_"), publishedTime: g.date, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: g.title, description: g.description, images: [og] },
  }
}

export function guideIndexMeta(key: LocaleKey): Metadata {
  const l = MARKETS[key].copy
  const label = GUIDES[key].label
  return {
    title: { absolute: `${label} · ${l.country} | Alphaa` },
    description: clipDescription(`${label}: ${GUIDES[key].guides.map((g) => g.h1).join(" · ")}`),
    alternates: { canonical: guidePath(key) },
  }
}

function Shell({ lang, children }: { lang: string; children: React.ReactNode }) {
  const rtl = lang.startsWith("ar")
  return (
    <div lang={lang} dir={rtl ? "rtl" : "ltr"} className={rtl ? `lc-rtl ${arabic.className}` : undefined}>
      {children}
    </div>
  )
}

/** /de/ratgeber, /fr/guide, … : the list of local guides. */
export function LocalGuideIndex({ k }: { k: LocaleKey }) {
  const m = MARKETS[k]
  const G = GUIDES[k]
  return (
    <Shell lang={m.copy.lang}>
      <section className="ag-section">
        <p className="lc-crumb"><Link href={m.copy.path}>{m.extra.backToMarket}</Link></p>
        <h1 className="lc-h1">{G.label}</h1>
        <div className="lc-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {G.guides.map((g) => (
            <Link key={g.slug} href={guidePath(k, g.slug)} className="lc-card lc-card--link">
              <h3>{g.h1}</h3>
              <p>{g.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  )
}

/** One long-form local guide, e.g. /de/ratgeber/<slug>. Human voice, Varun Sharma. */
export function LocalGuide({ k, slug }: { k: LocaleKey; slug: string }) {
  const m = MARKETS[k]
  const G = GUIDES[k]
  const g = G.guides.find((x) => x.slug === slug)
  if (!g) notFound()
  const l = m.copy
  const url = `${SITE}${guidePath(k, slug)}`
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.h1,
      description: g.description,
      inLanguage: l.lang,
      datePublished: g.date,
      dateModified: g.date,
      author: AUTHOR_SCHEMA,
      publisher: { "@type": "Organization", name: "Alphaa", url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
      mainEntityOfPage: url,
      abstract: g.answer,
    },
    { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: l.lang, mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: l.country, item: `${SITE}${l.path}` },
        { "@type": "ListItem", position: 2, name: G.label, item: `${SITE}${guidePath(k)}` },
        { "@type": "ListItem", position: 3, name: g.h1, item: url },
      ],
    },
  ]
  const by = BY[l.lang.slice(0, 2)] ?? "By"
  return (
    <Shell lang={l.lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <article className="lg">
        <p className="lc-crumb"><Link href={l.path}>{l.country}</Link> › <Link href={guidePath(k)}>{G.label}</Link></p>
        <h1 className="lc-h1">{g.h1}</h1>
        <p className="lg__by">{by} <Link href={AUTHOR.path} rel="author">{AUTHOR.name}</Link> · <time dateTime={g.date}>{g.date}</time></p>
        <p className="lg__answer">{g.answer}</p>
        <ul className="lg__take">{g.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
        {g.sections.map((s) => (
          <section key={s.h2}>
            <h2>{s.h2}</h2>
            {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
          </section>
        ))}
        <section>
          <h2>{l.faqTitle}</h2>
          {g.faq.map((f) => (
            <div key={f.q} className="lg__faq"><h3>{f.q}</h3><p>{f.a}</p></div>
          ))}
        </section>
        <div className="lg__cta">
          <Link className="ag-hero__big" href={`${l.path}#check`}>{l.cta}</Link>
        </div>
      </article>
    </Shell>
  )
}
