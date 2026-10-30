import Link from "next/link"
import { EngineRotator } from "@/components/marketing/hero/EngineRotator"
import { HeroBackdrop } from "@/components/marketing/hero/HeroBackdrop"
import { HeroCta } from "@/components/marketing/hero/HeroCta"
import { HeroArrows } from "@/components/marketing/hero/HeroArrows"
import { StartAgent } from "@/components/agent/StartAgent"
import { pageMeta } from "@/lib/seo"
import { HREFLANG, type LocaleCopy } from "@/content/locales"

const SITE = "https://alphaa.app"

export function localMeta(l: LocaleCopy) {
  const base = pageMeta({ title: l.title, absolute: true, description: l.description, path: l.path, eyebrow: l.country })
  return {
    ...base,
    alternates: { canonical: l.path, languages: HREFLANG },
    openGraph: { ...base.openGraph, locale: l.lang.replace("-", "_") },
  }
}

// One market page (alphaa.app/uk, /de, /fr, /it, /ae): the homepage hero with
// the live check, in the market's language, plus where AI looks you up there.
export function LocalHome({ l }: { l: LocaleCopy }) {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: l.title,
      description: l.description,
      url: `${SITE}${l.path}`,
      inLanguage: l.lang,
      about: { "@type": "SoftwareApplication", name: "Alphaa", applicationCategory: "BusinessApplication", offers: { "@type": "Offer", price: "99", priceCurrency: "USD" } },
      areaServed: { "@type": "Country", name: l.country },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: l.lang,
      mainEntity: l.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ]
  return (
    <div lang={l.lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="hx-wrap">
        <HeroBackdrop />
        <section className="ag-hero">
          <div className="ag-hero__in">
            <h1>
              <span className="hx-l1">{l.h1a} <EngineRotator /></span>
              <br />
              <span className="ap-quiet">{l.h1b}</span>
            </h1>
            <p className="ag-hero__sub">{l.sub}</p>
            <div className="ag-hero__cta ag-hero__cta--big">
              <HeroCta label={l.cta} />
              <span className="ag-hero__promise">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.9C8 19.4 5 15.6 5 11V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
                <span>{l.guarantee[0]} <b>{l.guarantee[1]}</b></span>
              </span>
            </div>
            <div className="ag-fine">{l.fine}</div>
            <div id="check" className="hx-check">
              <HeroArrows notes={l.arrows} />
              <StartAgent embedded greet={l.greet} />
            </div>
          </div>
        </section>
      </div>

      <section className="ag-section">
        <h2>{l.pillarsTitle}</h2>
        <div className="lc-grid">
          {l.pillars.map((p) => (
            <div key={p.title} className="lc-card">
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ag-section ag-section--grey">
        <h2>{l.whereTitle}</h2>
        <p className="ag-section__sub">{l.whereIntro}</p>
        <div className="lc-grid lc-grid--4">
          {l.where.map((w) => (
            <div key={w.name} className="lc-card">
              <h3>{w.name}</h3>
              <p>{w.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ag-section">
        <h2>{l.priceTitle}</h2>
        <p className="ag-section__sub">{l.priceSub}</p>
        <div className="ag-price">
          <div className="ag-price__amt">$99<small>/mo</small></div>
          <ul className="ag-price__list">
            {l.priceItems.map((i) => <li key={i}>{i}</li>)}
          </ul>
          <Link className="ag-pill ag-pill--blue" href="#check">{l.priceCta}</Link>
          <p style={{ marginTop: 14, fontSize: 13 }}>{l.priceNote}</p>
        </div>
      </section>

      <section className="ag-section ag-section--grey">
        <h2>{l.faqTitle}</h2>
        <div className="lc-faq">
          {l.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <p className="lc-en"><Link href="/" hrefLang="en">{l.english} ›</Link></p>
      </section>
    </div>
  )
}
