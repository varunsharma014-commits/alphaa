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
// "A Shopify skincare brand" -> "a Shopify skincare brand" (keeps proper nouns like Shopify, B2B, SaaS).
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export function generateStaticParams() {
  return [...caseStudies, ...playbooks].map((cs) => ({ slug: cs.slug }))
}

// Search titles/descriptions per example page: "how to" framing (these are playbooks, not customer results).
const META: Record<string, { title: string; description: string }> = {
  "personal-injury-law-firm": { title: "How Injury Lawyers Get Recommended by ChatGPT", description: "After a crash, people ask AI which lawyer to call. The exact questions, the pages to publish and a 90-day plan to show up in ChatGPT, Gemini, Claude and Perplexity." },
  "boutique-fitness-studio": { title: "Big on Instagram, Invisible in AI? A Fitness Studio Plan", description: "People ask ChatGPT for the best studio nearby. The questions they type, the pages and posts that answer them, and a week-by-week plan to get your studio named." },
  "shopify-skincare-brand": { title: "Get Your Skincare Brand Named When Shoppers Ask AI", description: "Shoppers ask ChatGPT which product to buy and get big brands. How a Shopify brand can show up instead: product questions, pages, posts and a 90-day plan." },
  "real-estate-team": { title: "Be the Agent AI Names for Your Town", description: "Buyers and sellers now ask AI which agent knows their area best. The questions, town pages, posts and fair-housing rules to follow, with a 90-day plan." },
  "med-spa": { title: "How Med Spas Show Up When People Ask AI Where to Go", description: "People ask ChatGPT where to get a treatment safely nearby. The questions, the pages to write, the health-claim rules to follow and a week-by-week plan." },
  "plumbing-company": { title: "Burst Pipe at 2 AM: Will AI Name Your Plumbing Company?", description: "Homeowners ask AI who can come today. The questions, service-area pages, Google posts and review replies that help a local plumber get named, with a 90-day plan." },
  "family-restaurant": { title: "Get Your Restaurant Named When Visitors Ask AI Where to Eat", description: "Tourists ask ChatGPT where to eat tonight. The questions, menu and hours fixes, posts and pages that help a family restaurant show up, step by step." },
  "b2b-saas-startup": { title: "How B2B SaaS Startups Get Into AI's Shortlist", description: "Buyers ask AI for software in your category and get the market leaders. The questions, comparison pages and content plan that help a startup get on the list." },
  "bright-smile-dental": { title: "When ChatGPT Names Three Other Dentists: A Plan for Your Practice", description: "Patients ask AI for a dentist nearby. The questions, pages, Google posts and review replies that help a family dental practice get named, week by week." },
  "torres-family-law": { title: "How Family Lawyers Get Named When Clients Ask Claude", description: "People ask AI for a family lawyer and get a competitor. The questions, practice-area pages and posts that help a family law firm show up, with a 90-day plan." },
  "coolair-pro": { title: "Beyond Summer Emergencies: Get Your HVAC Company Named by AI", description: "AI knows most HVAC companies only for AC repair. The questions, seasonal pages and posts that help you get named year round, with a week-by-week plan." },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pb = getPlaybook(slug)
  if (pb) {
    return pageMeta({
      title: META[pb.slug]?.title ?? `How ${lowerFirst(pb.business)} gets recommended by AI`,
      description: META[pb.slug]?.description ?? `The AI questions, pages, posts and weekly plan that help ${lowerFirst(pb.business)} show up in ChatGPT, Gemini, Claude and Perplexity.`,
      path: `/case-studies/${pb.slug}`,
      eyebrow: pb.industry,
    })
  }
  const cs = getCaseStudy(slug)
  if (!cs) return { title: "Case study not found" }

  return pageMeta({
    title: META[cs.slug]?.title ?? `How ${cs.business.toLowerCase()} gets recommended by AI`,
    description: META[cs.slug]?.description ?? `${cs.headline} A week-by-week plan for ${cs.business.toLowerCase()}.`,
    path: `/case-studies/${cs.slug}`,
    eyebrow: cs.industry,
  })
}

// The one note every example playbook page carries (its H1 marker links here).
const CASE_NOTE = "This page is an illustrative example, not a real customer. The business type, place and figures show how Alphaa works week by week; agency fees and ad spend are typical figures, not quotes. Results vary, and no one can guarantee what an AI will say."
const PLAYBOOK_NOTE = "This page is an illustrative example, not a real customer: there is no named business, owner, quote, rating or result here. It shows the work Alphaa does for this kind of business using features available today. Results vary, and no one can guarantee what an AI will say."

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pb = getPlaybook(slug)
  if (pb) {
    const more = [...playbooks.filter((p) => p.slug !== pb.slug), ...caseStudies].slice(0, 9)
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
            <div className="v3-grid v3-grid--3" style={{ marginTop: 0 }}>
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

  const others = caseStudies.filter((c) => c.slug !== cs.slug).slice(0, 9)

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
            <div className="v3-grid v3-grid--3" style={{ marginTop: 0 }}>
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
        <Notes items={[CASE_NOTE]} />
      </Frame>
    </V3Page>
  )
}
