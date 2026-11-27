"use client"

import { useState } from "react"
import Link from "next/link"
import { caseStudies } from "./data"
import { playbooks } from "./playbooks"
import { V3Page, Frame, Section, ProofMosaic, FinalCta, NoteRef, Notes } from "@/components/marketing/v3"
import { INDUSTRY_TONE } from "@/components/marketing/v3/pages/case-tone"

// Detailed playbooks first, then the original three walkthroughs. Both share the card fields.
const ALL = [...playbooks, ...caseStudies]
type Card = Pick<(typeof caseStudies)[number], "slug" | "industry" | "business" | "location" | "headline" | "keyResult" | "keyResultSub"> & { metrics: { label: string; value: string }[] }
const filters = ["All", ...Array.from(new Set(ALL.map((c) => c.industry)))]

// One disclosure for every card (2026-11-26): a marker next to each example business, one note in
// the Notes block at the bottom of the page, and the plain-words line in the intro.
const NOTES = [
  "Every business on this page is an illustrative example, not a real customer. The business types, places and figures show how Alphaa works week by week; agency fees and ad spend are typical figures, not quotes. Results vary, and no one can guarantee what an AI will say.",
]
type Filter = string


function CaseStudyCard({ cs }: { cs: Card }) {
  const tone = INDUSTRY_TONE[cs.industry] ?? "ad"
  return (
    <div className={`v3-card v3-card--tint v3-c-${tone}`} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <span className="v3-pill" style={{ alignSelf: "flex-start" }}>{cs.industry}</span>
      <h3 className="v3-h3" style={{ marginTop: 16 }}>{cs.business}<NoteRef n={1} /></h3>
      <p className="v3-fine" style={{ marginTop: 4 }}>{cs.location}</p>
      <p>{cs.headline}</p>
      <div style={{ marginTop: 16, background: "var(--v-card)", borderRadius: 16, padding: 16 }}>
        <p style={{ margin: 0, color: "var(--cc)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{cs.keyResult}</p>
        <p className="v3-fine" style={{ marginTop: 6 }}>{cs.keyResultSub}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        {cs.metrics.slice(0, 2).map((m) => (
          <div key={m.label} style={{ background: "var(--v-card)", borderRadius: 14, padding: 12, minWidth: 0 }}>
            <p style={{ margin: 0, color: "var(--v-fg)", fontWeight: 700, fontSize: 17 }}>{m.value}</p>
            <p className="v3-fine" style={{ marginTop: 2 }}>{m.label}</p>
          </div>
        ))}
      </div>
      <Link href={`/case-studies/${cs.slug}`} className="v3-more" style={{ marginTop: 18, alignSelf: "flex-start" }}>
        Read the example ›
      </Link>
    </div>
  )
}

export default function CaseStudiesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All")

  const filtered: Card[] = activeFilter === "All"
    ? ALL
    : ALL.filter((cs) => cs.industry === activeFilter)

  return (
    <V3Page>
      <Frame top>
        {/* Hero */}
        <Section center>
          <p className="v3-kicker">Examples</p>
          <h1 className="v3-h1 v3-h1--md">
            What your AI Agent does.{" "}
            <br />
            <span className="v3-blue">Industry by industry.</span>
          </h1>
          <p className="v3-lede">
            These are illustrative examples, not real customers. Each one shows what Alphaa's AI Agent does, week by week, to run a local business's marketing: Google posts, blogs, review replies, and getting named when ChatGPT, Gemini, Claude and Perplexity pick a competitor instead of you.
          </p>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <ProofMosaic tiles={[
              { big: "4 AIs", small: "checked every week" },
              { big: "$99/mo", small: "month to month" },
              { big: "90 days", small: "named by AI, or next month free", wide: true },
            ]} />
          </div>
        </Section>

        {/* Filter + cards */}
        <Section>
          <div className="v3-chips" role="group" aria-label="Filter by industry" style={{ justifyContent: "flex-start", marginTop: 0 }}>
            {filters.map((f) => (
              <button key={f} type="button" className="v3-chip" aria-pressed={activeFilter === f} onClick={() => setActiveFilter(f)}>
                {f}
              </button>
            ))}
          </div>

          <div className="v3-grid">
            {filtered.map((cs) => (
              <CaseStudyCard key={cs.slug} cs={cs} />
            ))}
          </div>

          {/* The full write-ups used to be inlined here as anchors. They now
              live at /case-studies/<slug> so each one is its own indexable
              page, which is also where the cards above have always linked. */}
        </Section>

        {/* Bottom CTA */}
        <FinalCta
          title={<>Let an AI agent<br />run your marketing.</>}
          sub="Get your time back. Start with a free check of what Google and the AIs say about you, then I take it from there."
        >
          <p className="v3-kicker" style={{ color: "inherit", marginBottom: 8 }}>Ready to be next?</p>
          <p>$99/mo · Month to month · Cancel online in a minute. If none of ChatGPT, Gemini, Claude or Perplexity names your business within your first 90 days, your next month is free.</p>
        </FinalCta>

        {/* The page's small print: the marker on each example links here. */}
        <Notes items={NOTES} />
      </Frame>
    </V3Page>
  )
}
