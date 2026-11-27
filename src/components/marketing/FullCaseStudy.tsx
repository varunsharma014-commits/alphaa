// One illustrative example (/case-studies/[slug]) in the v3 design. Words and figures come
// straight from case-studies/data.tsx; nothing here adds a claim.
import Link from "next/link"
import type { CaseStudy } from "@/app/(marketing)/case-studies/data"
import { Eyebrow, NoteRef } from "@/components/marketing/v3"
import { INDUSTRY_TONE } from "@/components/marketing/v3/pages/case-tone"

export function FullCaseStudy({ cs }: { cs: CaseStudy }) {
  const tone = INDUSTRY_TONE[cs.industry] ?? "ad"
  return (
    <article id={cs.id} className={`v3-c-${tone}`} style={{ scrollMarginTop: 96 }}>
      {/* Hero */}
      <div className="v3-chapter v3-chapter--solo">
        <div>
          <Eyebrow>{cs.industry}</Eyebrow>
          <h2 className="v3-h2">{cs.business}<NoteRef n={1} /></h2>
          <p className="v3-chapter__body" style={{ maxWidth: "60ch" }}>{cs.headline}</p>
          <div className="v3-proof"><span className="n" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>{cs.keyResult}</span><span>{cs.keyResultSub}</span></div>
          <div className="v3-mosaic" style={{ marginTop: 24 }}>
            {cs.metrics.map((m) => (
              <div key={m.label} className="v3-tile" style={{ background: "var(--v-card)" }}>
                <m.icon aria-hidden="true" style={{ width: 16, height: 16, color: "var(--cc)" }} />
                <span className="big" style={{ fontSize: 26 }}>{m.value}</span>
                <small style={{ color: "var(--v-fg)", fontWeight: 600 }}>{m.label}</small>
                <small>{m.sub}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="v3-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
        {/* Problem */}
        <div className="v3-card">
          <p className="v3-kicker">The Problem</p>
          <h3 className="v3-h3">{cs.problem.title}</h3>
          <p>{cs.problem.body}</p>
          <ul>{cs.problem.tried.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>

        {/* Solution + timeline */}
        <div className="v3-card v3-card--tint">
          <p className="v3-kicker" style={{ color: "var(--cc)" }}>The Solution</p>
          <h3 className="v3-h3">{cs.solution.title}</h3>
          <p>{cs.solution.body}</p>
          <ol className="v3-steps" style={{ gridTemplateColumns: "minmax(0, 1fr)", marginTop: 18, gap: 10 }}>
            {cs.solution.timeline.map((t, i) => (
              <li key={i} style={{ background: "var(--v-card)", padding: 18 }}>
                <p className="v3-kicker" style={{ color: "var(--cc)", margin: "0 0 4px" }}>{t.week}</p>
                <h3>{t.title}</h3>
                <p>{t.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Example disclosure (replaces the old pull quote: these are examples, not customers) */}
      <div className="v3-card" style={{ marginTop: 14 }}>
        <p className="v3-kicker">About this example</p>
        <p style={{ marginTop: 0 }}>{cs.note}</p>
      </div>

      {/* CTA */}
      <div className="v3-card v3-card--line" style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <p style={{ margin: 0, color: "var(--v-fg)", fontWeight: 700 }}>See what AI says about your business</p>
          <p style={{ marginTop: 4 }}>Free check: what ChatGPT, Gemini, Claude and Perplexity say about you, in about 60 seconds.</p>
        </div>
        <Link href="/start" className="v3-btn">Run the free check →</Link>
      </div>
    </article>
  )
}
