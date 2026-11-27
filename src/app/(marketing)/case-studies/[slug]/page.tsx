import Link from "next/link"
import { notFound } from "next/navigation"
import { caseStudies, getCaseStudy } from "../data"
import { playbooks, getPlaybook } from "../playbooks"
import { PlaybookStudy } from "@/components/marketing/PlaybookStudy"
import { pageMeta } from "@/lib/seo"
import { FullCaseStudy } from "@/components/marketing/FullCaseStudy"
import { V3Page, Frame, Section, Notes } from "@/components/marketing/v3"
import { INDUSTRY_TONE } from "@/components/marketing/v3/pages/case-tone"

// The listing page has always linked to /case-studies/<slug>, but this route
// didn't exist, so every "Read full case study" link 404'd. Each case study now
// has its own indexable URL instead of being an anchor on the listing page.
export function generateStaticParams() {
  return [...caseStudies, ...playbooks].map((cs) => ({ slug: cs.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pb = getPlaybook(slug)
  if (pb) {
    return pageMeta({
      title: `${pb.industry} example: what an AI marketing agent does for ${pb.business.toLowerCase().replace(/^an? /, "a ")}`,
      description: `An illustrative, step-by-step example (not a real customer): the AI questions, pages, posts and weekly work Alphaa does for ${pb.business.toLowerCase()}, and what to measure.`,
      path: `/case-studies/${pb.slug}`,
      eyebrow: "Example",
    })
  }
  const cs = getCaseStudy(slug)
  if (!cs) return { title: "Case study not found" }

  return pageMeta({
    title: `${cs.industry} example: how an AI Agent gets you recommended by AI`,
    description: `${cs.headline} An illustrative, week-by-week walkthrough of what Alphaa does for ${cs.business.toLowerCase()}.`,
    path: `/case-studies/${cs.slug}`,
    eyebrow: "Example",
  })
}

// The one note every example playbook page carries (its H1 marker links here).
const PLAYBOOK_NOTE = "This page is an illustrative example, not a real customer: there is no named business, owner, quote, rating or result here. It shows the work Alphaa does for this kind of business using features available today. Results vary, and no one can guarantee what an AI will say."

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pb = getPlaybook(slug)
  if (pb) {
    const more = [...playbooks.filter((p) => p.slug !== pb.slug), ...caseStudies]
    return (
      <V3Page>
        <Frame top>
          <Section>
            <nav className="v3-crumbs" aria-label="Breadcrumb">
              <Link href="/case-studies">‹ All examples</Link>
            </nav>
            <PlaybookStudy pb={pb} note={1} />
          </Section>
          <Section>
            <p className="v3-kicker">More examples</p>
            <div className="v3-grid" style={{ marginTop: 0 }}>
              {more.map((o) => (
                <Link key={o.slug} href={`/case-studies/${o.slug}`} className={`v3-card v3-card--tint v3-c-${INDUSTRY_TONE[o.industry] ?? "ad"}`}>
                  <span className="v3-pill" style={{ alignSelf: "flex-start" }}>{o.industry}</span>
                  <b className="v3-h3" style={{ marginTop: 12 }}>{o.business}</b>
                  <p>{o.headline}</p>
                </Link>
              ))}
            </div>
          </Section>
          <Notes items={[PLAYBOOK_NOTE]} />
        </Frame>
      </V3Page>
    )
  }
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
