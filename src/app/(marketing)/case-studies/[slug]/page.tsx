import Link from "next/link"
import { notFound } from "next/navigation"
import { caseStudies, getCaseStudy } from "../data"
import { pageMeta } from "@/lib/seo"
import { FullCaseStudy } from "@/components/marketing/FullCaseStudy"
import { V3Page, Frame, Section } from "@/components/marketing/v3"
import { INDUSTRY_TONE } from "@/components/marketing/v3/pages/case-tone"

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

  return pageMeta({
    title: `${cs.industry} example: how an AI Agent gets you recommended by AI`,
    description: `${cs.headline} An illustrative, week-by-week walkthrough of what Alphaa does for ${cs.business.toLowerCase()}.`,
    path: `/case-studies/${cs.slug}`,
    eyebrow: "Example",
  })
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cs = getCaseStudy(slug)
  if (!cs) notFound()

  const others = caseStudies.filter((c) => c.slug !== cs.slug)

  return (
    <V3Page>
      <Frame top>
        <Section>
          <nav className="v3-crumbs" aria-label="Breadcrumb">
            <Link href="/case-studies">‹ All examples</Link>
          </nav>

          <FullCaseStudy cs={cs} />
        </Section>

        {others.length > 0 && (
          <Section>
            <p className="v3-kicker">More examples</p>
            <div className="v3-grid v3-grid--2" style={{ marginTop: 0 }}>
              {others.map((o) => (
                <Link key={o.slug} href={`/case-studies/${o.slug}`} className={`v3-card v3-card--tint v3-c-${INDUSTRY_TONE[o.industry] ?? "ad"}`}>
                  <span className="v3-pill" style={{ alignSelf: "flex-start" }}>{o.industry}</span>
                  <b className="v3-h3" style={{ marginTop: 12 }}>{o.business}</b>
                  <p>{o.headline}</p>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </Frame>
    </V3Page>
  )
}
