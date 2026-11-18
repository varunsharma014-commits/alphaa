import { tradeAlternates } from "@/content/markets/equivalents"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { VERTICALS, getVertical } from "@/content/verticals"
import { getPost } from "@/content/blog"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { HeroScanInput } from "@/components/marketing/HeroScanInput"
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

      {/* 1. Hero */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[760px] h-[520px] pointer-events-none"
          style={{
            background: "transparent",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-xs font-medium tracking-[-0.01em] text-brand-orange mb-6">
            AI marketing for {v.plural}
          </p>
          <h1 className="text-[41.8px] sm:text-[61.6px] lg:text-[70.4px] font-semibold leading-[1.05] tracking-[-0.02em] text-fg mb-6 text-balance">
            Run your {v.noun} marketing{" "}
            <span className="text-[#86868b]">using an AI agent.</span>
          </h1>
          <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-9">
            Alphaa writes your Google posts and blogs, replies to reviews and gets you found on
            Google and AI search. You approve with one tap. From $99/mo, no agency retainer.
          </p>
          <div id="scan-input" className="scroll-mt-28">
            <HeroScanInput
              compact
              source={`vertical_${v.slug}`}
              ctaLabel="Get started →"
            />
          </div>
          <p className="mt-5 text-fg/40 text-xs">2 minutes · no credit card · results emailed to you</p>
          <p className="mt-2 text-xs">
            <Link
              href="/scan"
              className="text-fg/40 hover:text-fg/70 underline underline-offset-4 transition-colors duration-200"
            >
              No website? Start the scan with just your business name →
            </Link>
          </p>
        </div>
      </section>

      {/* 2. Pain section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-muted text-xs font-semibold tracking-[-0.01em] mb-6 text-center">
            The problem
          </p>
          <h2 className="text-[28px] sm:text-[36px] font-semibold text-fg leading-[1.15] tracking-tight text-center mb-10 text-balance">
            Marketing is a second full-time job.{" "}
            <span className="text-[#86868b]">You already have one.</span>
          </h2>
          <div className="space-y-5 text-muted text-lg leading-relaxed">
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
        </div>
      </section>

      {/* 3. Playbook */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-medium tracking-[-0.01em] text-brand-orange mb-3 block">
              The playbook
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-semibold text-fg tracking-tight text-balance">
              What I do for {v.plural}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {v.playbook.map((item) => (
              <div
                key={item.title}
                className="glass-card rounded-2xl p-7 hover:border-brand-orange/30 transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-xl border border-brand-orange/20 bg-brand-orange/10 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-5 h-5 text-brand-orange" />
                </div>
                <h3 className="text-fg font-semibold text-base mb-2.5">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Savings math */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.06] p-8 sm:p-10">
            <p className="text-center text-fg/40 text-xs tracking-[-0.01em] font-semibold mb-8">
              Do the math
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <p className="text-muted text-xs font-semibold tracking-[-0.01em] mb-3">
                  Typical agency for {v.plural}
                </p>
                <p className="text-fg/40 text-4xl sm:text-5xl font-bold leading-none line-through decoration-fg/25 decoration-2">
                  ${agencyAnnual.toLocaleString()}
                  <span className="text-xl">/yr</span>
                </p>
                <p className="text-fg/30 text-xs mt-3">{v.agencyCostLabel} · usually with a contract</p>
              </div>
              <div className="flex items-center justify-center text-brand-orange/60 text-3xl rotate-90 sm:rotate-0">
                →
              </div>
              <div className="text-center">
                <p className="text-brand-orange text-xs font-semibold tracking-[-0.01em] mb-3">
                  Alphaa
                </p>
                <p className="text-fg text-4xl sm:text-5xl font-bold leading-none">
                  ${ALPHAA_ANNUAL.toLocaleString()}
                  <span className="text-xl text-fg/50">/yr</span>
                </p>
                <p className="text-muted text-xs mt-3">Starter $99/mo · Google posts, blogs, reviews, SEO &amp; AI search. {GUARANTEE_LINE}</p>
              </div>
            </div>
            <div className="text-center mt-9 pt-9 border-t border-line/[0.08]">
              <p className="text-fg text-[28px] sm:text-[40px] font-semibold leading-tight">
                Keep <span className="text-brand-orange">${savings.toLocaleString()}/year</span> in your{" "}
                {v.noun}
              </p>
              <p className="text-muted text-base sm:text-lg mt-2">
                …and still get your marketing done every week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-medium tracking-[-0.01em] text-brand-orange mb-3 block">
              FAQ
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-semibold text-fg tracking-tight">
              Questions from {v.plural}
            </h2>
          </div>
          <div className="space-y-2">
            {v.faq.map((f) => (
              <div key={f.q} className="glass-card rounded-xl p-5">
                <h3 className="text-fg font-medium text-sm mb-2.5">{f.q}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Related reading */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-2xl p-7 sm:p-8">
            <span className="text-xs font-medium tracking-[-0.01em] text-brand-orange mb-4 block">
              Related reading
            </span>
            {relatedPost && (
              <Link
                href={`/blog/${relatedPost.meta.slug}`}
                className="group flex items-start justify-between gap-4 mb-5"
              >
                <div>
                  <h3 className="text-fg font-semibold text-lg group-hover:text-brand-orange transition-colors duration-200">
                    {relatedPost.meta.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed mt-1.5">
                    {relatedPost.meta.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-brand-orange shrink-0 mt-1.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            )}
            <Link
              href="/blog"
              className="text-sm font-medium text-muted hover:text-fg transition-colors duration-200"
            >
              Browse all marketing articles →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl border border-brand-orange/20 p-12 sm:p-16 text-center relative overflow-hidden"
            style={{
              background: "transparent",
            }}
          >
            <h2 className="text-[32px] sm:text-[44px] font-semibold text-fg leading-[1.1] tracking-tight mb-6 text-balance">
              Start with a free check{" "}
              <span className="text-[#86868b]">of your {v.noun}.</span>
            </h2>
            <p className="text-muted text-lg sm:text-xl mb-9 max-w-xl mx-auto">
              I’ll look at your website, Google profile and reviews, and ask ChatGPT, Gemini,
              Claude and Perplexity &quot;{v.examplePrompt}&quot; to show you who they name. Then I
              get to work on your marketing.
            </p>
            <OrangePillButton href="/start" size="lg">
              Get started →
            </OrangePillButton>
            <p className="mt-6 text-fg/25 text-sm">2 minutes · no credit card · results emailed to you</p>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA — jumps back to the embedded scan input */}
      <StickyScanCta />
    </>
  )
}
