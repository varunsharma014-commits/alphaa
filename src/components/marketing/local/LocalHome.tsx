import Link from "next/link"
import type { CSSProperties } from "react"
import { HeroCta } from "@/components/marketing/hero/HeroCta"
import { StartAgent } from "@/components/agent/StartAgent"
import { pageMeta, ogImage } from "@/lib/seo"
import { GUIDES } from "@/content/markets/guides"
import { HREFLANG, type LocaleCopy } from "@/content/locales"
import type { Market } from "@/content/markets/types"
import { MARKET_CURRENCY, AMOUNTS, formatPrice, type MarketKey } from "@/content/markets/prices"
import { arabic } from "@/fonts"
import { V3Page, Frame, Section, HeroShapes, Points, Faq, FinalCta, type SvcKey } from "@/components/marketing/v3"
import { FollowTheme } from "@/components/marketing/v3/FollowTheme"
import "@/components/marketing/v3/pages/local.css"

const TONES: SvcKey[] = ["mk", "ad", "ct", "se", "em"]

const PER_MONTH: Record<string, string> = { en: "/mo", de: "/Monat", fr: "/mois", it: "/mese", ar: "/شهريًا" }

const SITE = "https://alphaa.app"

export function localMeta(l: LocaleCopy) {
  const base = pageMeta({ title: l.title, absolute: true, description: l.description, path: l.path, eyebrow: l.country })
  // The preview-card renderer has no Arabic font: Arabic pages share the English card.
  if (l.lang.startsWith("ar")) {
    const card = ogImage("AI Marketing Agent for UAE Businesses", "United Arab Emirates")
    base.openGraph = { ...base.openGraph, images: card }
    base.twitter = { ...base.twitter, images: card.map((c) => c.url) } as typeof base.twitter
  }
  return {
    ...base,
    alternates: { canonical: l.path, languages: HREFLANG },
    openGraph: { ...base.openGraph, locale: l.lang.replace("-", "_") },
  }
}

// One market page (alphaa.app/uk, /de, /fr, /it, /ae): the homepage hero
// ("run your entire marketing using an AI agent", localised) with the live
// check, in the market's language, plus where customers and AI look you up there.
export function LocalHome({ m }: { m: Market }) {
  const l = m.copy
  const x = m.extra
  const lang2 = l.lang.slice(0, 2)
  const rtl = lang2 === "ar"
  const currency = MARKET_CURRENCY[l.key as MarketKey]
  const price = formatPrice(currency, "starter", l.lang)
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: l.title,
      description: l.description,
      url: `${SITE}${l.path}`,
      inLanguage: l.lang,
      about: { "@type": "SoftwareApplication", name: "Alphaa", applicationCategory: "BusinessApplication", offers: { "@type": "Offer", price: String(AMOUNTS[currency].starter), priceCurrency: currency.toUpperCase() } },
      areaServed: { "@type": "Country", name: l.country },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: l.lang,
      mainEntity: l.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ]
  // Arabic: Noto Sans Arabic for every heading and line (v3 reads its font from --v-font).
  const fontVar = rtl ? ({ ["--v-font" as string]: `${arabic.style.fontFamily}, var(--font-apple)` } as CSSProperties) : undefined
  return (
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div lang={l.lang} dir={rtl ? "rtl" : "ltr"} className="v3" style={fontVar}>
        <Frame top>
          <Section className="v3-hero">
            <div>
              <h1 className="v3-h1">
                {l.h1a}
                <br />
                <span className="v3-blue">{l.h1b}</span>
              </h1>
              <p className="v3-lede">{l.sub}</p>
              <div className="v3-btns lc3-cta"><HeroCta label={l.cta} /></div>
              <p className="lc3-promise">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.9C8 19.4 5 15.6 5 11V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
                <span>{l.guarantee[0]} <b>{l.guarantee[1]}</b></span>
              </p>
              <p className="v3-fine">{l.fine}</p>
            </div>
            <HeroShapes tones={["mk", "ad", "se", "ct"]} note={null} />
          </Section>

          <Section center id="check">
            <div className="v3-prompt" style={{ marginTop: 0 }}><FollowTheme><StartAgent embedded greet={l.greet} /></FollowTheme></div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{l.pillarsTitle}</h2>
            <div className="v3-grid">
              {l.pillars.map((p, i) => (
                <div key={p.title} className={`v3-card v3-card--tint v3-c-${TONES[i % TONES.length]}`}>
                  <h3 className="v3-h3">{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{x.questionsTitle}</h2>
            <p className="v3-lede">{x.questionsIntro}</p>
            <div className="v3-grid">
              {x.questions.map((q) => (
                <div key={q.q} className="v3-card">
                  <p className="lc3-q">&ldquo;{q.q}&rdquo;</p>
                  <small className="lc3-who">{q.who}</small>
                </div>
              ))}
            </div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{x.industriesTitle}</h2>
            <p className="v3-lede">{x.industriesIntro}</p>
            <div className="v3-grid">
              {x.industries.map((ind, i) => (
                <Link key={ind.slug} href={`${l.path}/${ind.slug}`} className={`v3-card v3-card--tint v3-c-${TONES[i % TONES.length]}`}>
                  <h3 className="v3-h3">{ind.name}</h3>
                  <p>{ind.sub}</p>
                  <span className="v3-link" style={{ marginTop: "auto", paddingTop: 12 }}>{x.industryLinkPrefix} {ind.name} ›</span>
                </Link>
              ))}
            </div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{l.whereTitle}</h2>
            <p className="v3-lede">{l.whereIntro}</p>
            <div className="v3-grid">
              {l.where.map((w) => (
                <div key={w.name} className="v3-card">
                  <h3 className="v3-h3">{w.name}</h3>
                  <p>{w.why}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section>
            <div className="v3-chapter v3-c-se">
              <div>
                <h2 className="v3-h2">{l.priceTitle}</h2>
                <p className="v3-chapter__body">{l.priceSub}</p>
                <p className="lc3-price">{price}<small>{PER_MONTH[lang2] ?? "/mo"}</small></p>
                <div className="v3-btns"><Link className="v3-btn" href="#check">{l.priceCta}</Link></div>
                <p className="v3-note">{l.priceNote}</p>
              </div>
              <div className="v3-visual v3-visual--fit">
                <div className="v3-card v3-card--line"><Points items={l.priceItems} /></div>
              </div>
            </div>
          </Section>

          <Section center>
            <h2 className="v3-h2">{l.faqTitle}</h2>
            <Faq items={l.faq} />
            <div className="lc3-links">
              <h3>{GUIDES[l.key].label}</h3>
              {GUIDES[l.key].guides.map((g) => (
                <Link key={g.slug} href={`${l.path}/${GUIDES[l.key].base}/${g.slug}`}>{g.h1} ›</Link>
              ))}
            </div>
            {l.regNote && <p className="v3-fine v3-narrow" style={{ marginInline: "auto", marginTop: 24 }}>{l.regNote}</p>}
            <p className="lc3-foot">
              <Link href={l.key === "ar" ? "/ae" : "/"} hrefLang="en">{l.english} ›</Link>
              {l.key === "ae" && <> · <Link href="/ae/ar" hrefLang="ar">العربية ›</Link></>}
              {l.key === "de" && <> · <Link href="/impressum">Impressum</Link></>}
            </p>
          </Section>

          <FinalCta title={<>{l.h1a}<br /><span>{l.h1b}</span></>} sub={l.fine} href="#check" label={l.cta} arrow={rtl ? "←" : "→"} />
        </Frame>
      </div>
    </V3Page>
  )
}
