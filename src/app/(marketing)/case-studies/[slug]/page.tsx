import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { caseStudies, getCaseStudy } from "../data"
import { FullCaseStudy } from "@/components/marketing/FullCaseStudy"

// The listing page has always linked to /case-studies/<slug>, but this route
// didn't exist, so every "Read full case study" link 404'd. Each case study now
// has its own indexable URL instead of being an anchor on the listing page.
export function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cs = getCaseStudy(slug)
  if (!cs) return { title: "Case study not found" }

  return {
    title: `${cs.business} — ${cs.keyResult}`,
    description: `${cs.headline} How ${cs.business} (${cs.location}) went from invisible on AI search to being recommended by ChatGPT, Claude, Gemini and Perplexity.`,
    alternates: { canonical: `/case-studies/${cs.slug}` },
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cs = getCaseStudy(slug)
  if (!cs) notFound()

  const others = caseStudies.filter((c) => c.slug !== cs.slug)

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/case-studies"
          className="inline-flex items-center gap-2 text-muted hover:text-fg text-sm font-medium mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          All case studies
        </Link>

        <FullCaseStudy cs={cs} />

        {others.length > 0 && (
          <div className="mt-16 pt-10 border-t border-line/[0.08]">
            <p className="text-muted text-xs font-semibold tracking-widest uppercase mb-6">
              More case studies
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {others.map((o) => (
                <Link
                  key={o.slug}
                  href={`/case-studies/${o.slug}`}
                  className="rounded-2xl border border-line/[0.08] bg-white p-6 hover:border-brand-orange/30 transition-colors duration-200"
                >
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mb-3 ${o.badge}`}
                  >
                    {o.industry}
                  </span>
                  <p className="text-fg font-semibold mb-1">{o.business}</p>
                  <p className="text-muted text-sm leading-relaxed">{o.headline}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
