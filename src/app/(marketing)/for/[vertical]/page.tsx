import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { VERTICALS, getVertical } from "@/content/verticals"
import { getPost } from "@/content/blog"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { HeroScanInput } from "@/components/marketing/HeroScanInput"
import { StickyScanCta } from "@/components/marketing/StickyScanCta"

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
  const title = `AI Search Optimization for ${displayPlural(v.plural)} — Get Recommended by ChatGPT`
  const description = `Get your ${v.noun} recommended by ChatGPT, Gemini & Google AI automatically. $99/mo instead of a ${v.agencyCostLabel} agency retainer. Free 60-second scan.`
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: `https://alphaa.app/for/${v.slug}` },
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
        name: `AI Search for ${displayPlural(v.plural)}`,
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
            background: "radial-gradient(ellipse at center, rgba(255,107,26,0.16) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-brand-orange mb-6">
            AI search for {v.plural}
          </p>
          <h1 className="text-[38px] sm:text-[56px] lg:text-[64px] font-semibold leading-[1.05] tracking-[-0.02em] text-white mb-6 text-balance">
            When someone asks ChatGPT{" "}
            <span className="serif-italic text-brand-orange">&quot;{v.examplePrompt}&quot;</span>
            <br className="hidden sm:block" /> — are you the answer?
          </h1>
          <p className="text-white/55 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-9">
            Alphaa gets your {v.noun} recommended by ChatGPT, Gemini &amp; Google AI automatically —
            $99/mo, no agency retainer.
          </p>
          <div id="scan-input" className="scroll-mt-28">
            <HeroScanInput
              compact
              source={`vertical_${v.slug}`}
              ctaLabel="Run my free AI scan →"
            />
          </div>
          <p className="mt-5 text-white/40 text-xs">60 seconds · no signup · no credit card</p>
          <p className="mt-2 text-xs">
            <Link
              href="/scan"
              className="text-white/40 hover:text-white/70 underline underline-offset-4 transition-colors duration-200"
            >
              No website? Start the scan with just your business name →
            </Link>
          </p>
        </div>
      </section>

      {/* 2. Pain section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-red-400 text-xs font-semibold tracking-widest uppercase mb-6 text-center">
            The problem
          </p>
          <h2 className="text-[28px] sm:text-[36px] font-semibold text-white leading-[1.15] tracking-tight text-center mb-10 text-balance">
            Your next customer just asked AI —{" "}
            <span className="serif-italic text-brand-orange">and got someone else&apos;s name.</span>
          </h2>
          <div className="space-y-5 text-white/55 text-lg leading-relaxed">
            <p>
              Search has changed. People don&apos;t sift through pages of results anymore — they ask
              ChatGPT, Gemini, or Google AI a question and get a short, confident answer with two or
              three names in it. Those names get the business. Everyone else is invisible.
            </p>
            <p>{v.painLine}</p>
            <p>
              The worst part: you never see the loss. There&apos;s no missed call, no bounced visit —
              just a customer who was told about someone else and never knew you existed. Alphaa
              exists to make sure you&apos;re in the answer.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Playbook */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-medium tracking-[0.18em] uppercase text-brand-orange mb-3 block">
              The playbook
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-semibold text-white tracking-tight text-balance">
              What alphaa does for {v.plural}
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
                <h3 className="text-white font-semibold text-base mb-2.5">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Savings math */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.06] p-8 sm:p-10">
            <p className="text-center text-white/40 text-xs uppercase tracking-widest font-semibold mb-8">
              Do the math
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <p className="text-red-400/70 text-xs font-semibold uppercase tracking-widest mb-3">
                  Typical agency for {v.plural}
                </p>
                <p className="text-white/40 text-4xl sm:text-5xl font-bold leading-none line-through decoration-red-500/50 decoration-2">
                  ${agencyAnnual.toLocaleString()}
                  <span className="text-xl">/yr</span>
                </p>
                <p className="text-white/30 text-xs mt-3">{v.agencyCostLabel} · and still invisible on AI</p>
              </div>
              <div className="flex items-center justify-center text-brand-orange/60 text-3xl rotate-90 sm:rotate-0">
                →
              </div>
              <div className="text-center">
                <p className="text-brand-orange text-xs font-semibold uppercase tracking-widest mb-3">
                  Alphaa
                </p>
                <p className="text-white text-4xl sm:text-5xl font-bold leading-none">
                  ${ALPHAA_ANNUAL.toLocaleString()}
                  <span className="text-xl text-white/50">/yr</span>
                </p>
                <p className="text-white/30 text-xs mt-3">$99/mo · built for AI search</p>
              </div>
            </div>
            <div className="text-center mt-9 pt-9 border-t border-white/[0.08]">
              <p className="text-white text-[28px] sm:text-[40px] font-semibold leading-tight">
                Keep <span className="text-brand-orange">${savings.toLocaleString()}/year</span> in your{" "}
                {v.noun}
              </p>
              <p className="text-white/50 text-base sm:text-lg mt-2">
                …and actually show up where your customers now search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-medium tracking-[0.18em] uppercase text-brand-orange mb-3 block">
              FAQ
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-semibold text-white tracking-tight">
              Questions from {v.plural}
            </h2>
          </div>
          <div className="space-y-2">
            {v.faq.map((f) => (
              <div key={f.q} className="glass-card rounded-xl p-5">
                <h3 className="text-white font-medium text-sm mb-2.5">{f.q}</h3>
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
            <span className="text-xs font-medium tracking-[0.18em] uppercase text-brand-orange mb-4 block">
              Related reading
            </span>
            {relatedPost && (
              <Link
                href={`/blog/${relatedPost.meta.slug}`}
                className="group flex items-start justify-between gap-4 mb-5"
              >
                <div>
                  <h3 className="text-white font-semibold text-lg group-hover:text-brand-orange transition-colors duration-200">
                    {relatedPost.meta.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mt-1.5">
                    {relatedPost.meta.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-brand-orange shrink-0 mt-1.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            )}
            <Link
              href="/blog"
              className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200"
            >
              Browse all articles on AI search →
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
              background: "radial-gradient(ellipse at 50% 120%, rgba(255,107,26,0.18) 0%, transparent 65%)",
            }}
          >
            <h2 className="text-[32px] sm:text-[44px] font-semibold text-white leading-[1.1] tracking-tight mb-6 text-balance">
              Find out if AI recommends your {v.noun} —{" "}
              <span className="serif-italic text-brand-orange">or your competitor.</span>
            </h2>
            <p className="text-white/50 text-lg sm:text-xl mb-9 max-w-xl mx-auto">
              Run a free scan and see exactly what ChatGPT, Gemini, and Google AI say when customers
              ask about {v.plural} like you.
            </p>
            <OrangePillButton href="/scan" size="lg">
              Run my free AI scan →
            </OrangePillButton>
            <p className="mt-6 text-white/25 text-sm">60 seconds · no signup · no credit card</p>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA — jumps back to the embedded scan input */}
      <StickyScanCta />
    </>
  )
}
