import { tradeAlternates } from "@/content/markets/equivalents"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { VERTICALS, getVertical } from "@/content/verticals"
import { getPost } from "@/content/blog"
import { V3Page, Frame, Section, HeroShapes, Faq, FinalCta, Tick } from "@/components/marketing/v3"
import { ScanInputV3 } from "@/components/marketing/v3/pages/ScanInputV3"
import "@/components/marketing/v3/pages/vertical.css"
import { StickyScanCta } from "@/components/marketing/StickyScanCta"
import { clipDescription, ogImage } from "@/lib/seo"
import { GUARANTEE_LINE } from "@/lib/offer-copy"

const ALPHAA_ANNUAL = 1188 // $99/mo × 12

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }))
}

// "med spas" → "Med Spas", but leave existing caps alone ("HVAC companies", "SaaS companies")
function displayPlural(plural: string): string {
  return plural
    .split(" ")
    .map((w) => (w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>
}): Promise<Metadata> {
  const { vertical } = await params
  const v = getVertical(vertical)
  if (!v) return { title: "Not found" }
  // Layout applies a "%s | Alphaa" title template — don't append the brand here.
  // Layout appends " | Alphaa"; keep the whole thing inside Google's ~65 chars.
  const long = `AI Marketing for ${displayPlural(v.plural)}: An AI Agent That Runs It`
  const title = long.length + 9 <= 65 ? long : `AI Marketing for ${displayPlural(v.plural)}`
  const description = clipDescription(`An AI agent that runs your ${v.noun}'s marketing: Google posts, blogs, review replies, SEO and AI search from $99/mo. Social, ads and email on Growth. No ${v.agencyCostLabel} agency retainer.`)
  return {
    title,
    description,
    alternates: { canonical: `/for/${v.slug}`, ...(tradeAlternates("us", v.slug) ? { languages: tradeAlternates("us", v.slug) } : {}) },
    openGraph: { title, description, type: "website", url: `https://alphaa.app/for/${v.slug}`, images: ogImage(title, "For " + displayPlural(v.plural)) },
    twitter: { card: "summary_large_image", images: ogImage(title).map((x) => x.url) },
  }
}

export default async function VerticalPage({
  params,
}: {
  params: Promise<{ vertical: string }>
}) {
  const { vertical } = await params
  const v = getVertical(vertical)
  if (!v) notFound()

  const relatedPost = getPost(v.relatedPostSlug)
  const agencyAnnual = v.agencyCostMonthly * 12
  const savings = agencyAnnual - ALPHAA_ANNUAL

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: v.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://alphaa.app" },
      {
        "@type": "ListItem",
        position: 2,
        name: `AI Marketing for ${displayPlural(v.plural)}`,
        item: `https://alphaa.app/for/${v.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <V3Page>
      <Frame top>
        {/* 1. Hero */}
        <Section className="v3-hero">
          <div>
            <p className="v3-kicker">AI marketing for {v.plural}</p>
            <h1 className="v3-h1 v3-h1--md">
              Run your {v.noun} marketing{" "}
              <span className="v3-blue">using an AI agent.</span>
            </h1>
            <p className="v3-lede">
              Alphaa writes your Google posts and blogs, replies to reviews and gets you found on
              Google and AI search. You approve with one tap. From $99/mo, no agency retainer.
            </p>
            <div id="scan-input" style={{ scrollMarginTop: 112 }}>
              <ScanInputV3 source={`vertical_${v.slug}`} ctaLabel="Get started →" />
            </div>
            <p className="v3-fine">2 minutes · no credit card · results emailed to you</p>
            <p className="v3-fine" style={{ marginTop: 6 }}>
              <Link href="/scan">No website? Start the scan with just your business name →</Link>
            </p>
          </div>
          <HeroShapes cards={["Google post ready", "Replied to a new review", "Blog post drafted"]} tones={["se", "ct", "mk", "ad"]} />
        </Section>

        {/* 2. Pain section */}
        <Section center>
          <p className="v3-kicker">The problem</p>
          <h2 className="v3-h2">
            Marketing is a second full-time job.{" "}
            <span className="v3-muted">You already have one.</span>
          </h2>
          <div className="v3-prose v3-narrow" style={{ margin: "28px auto 0", textAlign: "left" }}>
            <p>
              Posts, blogs, review replies, your Google profile, SEO, and now AI search on ChatGPT,
              Claude and Gemini. Each one is small. Together they eat your week, or an agency
              retainer.
            </p>
            <p>{v.painLine}</p>
            <p>
              The worst part: you never see the loss. There&apos;s no missed call, just a customer
              who picked someone else. Alphaa is an AI agent that does this work every week, so you
              get customers and your time back.
            </p>
          </div>
        </Section>

        {/* 3. Playbook */}
        <Section center tone="se">
          <p className="v3-kicker">The playbook</p>
          <h2 className="v3-h2">What I do for {v.plural}</h2>
          <div className="v3-grid v3-grid--3">
            {v.playbook.map((item) => (
              <div key={item.title} className="v3-card v3-card--tint">
                <Tick />
                <h3 className="v3-h3" style={{ marginTop: 12 }}>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. Savings math */}
        <Section center>
          <p className="v3-kicker">Do the math</p>
          <div className="vt3-save">
            <div>
              <p className="k">Typical agency for {v.plural}</p>
              <span className="big"><s>${agencyAnnual.toLocaleString()}<small>/yr</small></s></span>
              <p className="sub">{v.agencyCostLabel} · usually with a contract</p>
            </div>
            <div className="is-us">
              <p className="k">Alphaa</p>
              <span className="big">${ALPHAA_ANNUAL.toLocaleString()}<small>/yr</small></span>
              <p className="sub">Starter $99/mo · Google posts, blogs, reviews, SEO &amp; AI search. {GUARANTEE_LINE}</p>
            </div>
          </div>
          <p className="vt3-keep">
            Keep <span className="v3-blue">${savings.toLocaleString()}/year</span> in your{" "}
            {v.noun}
          </p>
          <p className="v3-lede">…and still get your marketing done every week.</p>
        </Section>

        {/* 5. FAQ */}
        <Section center>
          <p className="v3-kicker">FAQ</p>
          <h2 className="v3-h2">Questions from {v.plural}</h2>
          <Faq items={v.faq} />
        </Section>

        {/* 6. Related reading */}
        <Section tight>
          <div className="v3-card v3-narrow" style={{ margin: "0 auto" }}>
            <p className="v3-kicker">Related reading</p>
            {relatedPost && (
              <Link href={`/blog/${relatedPost.meta.slug}`} style={{ display: "block", textDecoration: "none", marginBottom: 16 }}>
                <h3 className="v3-h3">{relatedPost.meta.title} →</h3>
                <p>{relatedPost.meta.description}</p>
              </Link>
            )}
            <Link href="/blog" className="v3-link">Browse all marketing articles →</Link>
          </div>
        </Section>

        {/* 7. Final CTA */}
        <FinalCta
          title={<>Start with a free check{" "}<span>of your {v.noun}.</span></>}
          sub={<>I’ll look at your website, Google profile and reviews, and ask ChatGPT, Gemini,
              Claude and Perplexity &quot;{v.examplePrompt}&quot; to show you who they name. Then I
              get to work on your marketing.</>}
        >
          <p>2 minutes · no credit card · results emailed to you</p>
        </FinalCta>
      </Frame>

      {/* Sticky mobile CTA — jumps back to the embedded scan input */}
      <StickyScanCta />
      </V3Page>
    </>
  )
}
