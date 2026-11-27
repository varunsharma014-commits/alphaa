// One detailed example playbook (/case-studies/[slug], data in case-studies/playbooks.ts), v3 design.
// Illustrative only: the H1 carries a footnote marker to the page's single note (page bottom). Nothing here adds a claim beyond the data file.
import Link from "next/link"
import type { Playbook } from "@/app/(marketing)/case-studies/playbooks"
import { Eyebrow, NoteRef } from "@/components/marketing/v3"
import { INDUSTRY_TONE } from "@/components/marketing/v3/pages/case-tone"


function Part({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="pb-part" aria-labelledby={`${id}-h`}>
      <p className="pb-part__n">{n}</p>
      <h2 id={`${id}-h`} className="v3-h2 pb-part__h">{title}</h2>
      {children}
    </section>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="pb-step">
      <span className="pb-step__n" aria-hidden="true">{n}</span>
      <div className="pb-step__body">
        <h3>{title}</h3>
        {children}
      </div>
    </li>
  )
}

export function PlaybookStudy({ pb, note }: { pb: Playbook; note: number }) {
  const tone = INDUSTRY_TONE[pb.industry] ?? "ad"
  let n = 0
  return (
    <article id={pb.id} className={`v3-c-${tone} pb`} style={{ scrollMarginTop: 96 }}>
      <div className="v3-chapter v3-chapter--solo">
        <div>
          <Eyebrow>{pb.industry}</Eyebrow>
          <h1 className="v3-h2">{pb.business}<NoteRef n={note} /></h1>
          <p className="v3-chapter__body" style={{ maxWidth: "62ch" }}>{pb.headline}</p>
          <div className="v3-proof"><span className="n" style={{ fontSize: "clamp(24px, 3.6vw, 36px)" }}>{pb.keyResult}</span><span>{pb.keyResultSub}</span></div>
          <nav className="pb-toc" aria-label="On this page">
            <a href="#problem">Problem</a><a href="#solution">Solution</a><a href="#timeline">Timeline</a><a href="#results">Results</a>
          </nav>
        </div>
      </div>

      <div className="pb-flow">
        <Part id="problem" n="01" title="The problem">
          <p className="pb-lead">{pb.situation}</p>
          <h3 className="pb-sub">What I usually find</h3>
          <ul className="pb-list">{pb.finds.map((f) => <li key={f}>{f}</li>)}</ul>
        </Part>

        <Part id="solution" n="02" title="The solution">
          <ol className="pb-steplist">
            <Step n={++n} title="I ask ChatGPT, Gemini, Claude and Perplexity what customers ask">
              <ul className="pb-list pb-q">{pb.questions.map((q) => <li key={q}>“{q}”</li>)}</ul>
              <p className="v3-fine">Every week, in the customer’s words. Starter checks 10 questions, Pro 20.</p>
            </Step>
            <Step n={++n} title="I write the pages and blog posts that answer them">
              <ul className="pb-list">{pb.pages.map((p) => <li key={p}>{p}</li>)}</ul>
            </Step>
            {pb.googlePosts && (
              <Step n={++n} title="I post on Google every week">
                <ul className="pb-list">{pb.googlePosts.map((g) => <li key={g}>{g}</li>)}</ul>
              </Step>
            )}
            {pb.social && (
              <Step n={++n} title="I write social posts, ready to publish in one tap">
                <ul className="pb-list">{pb.social.map((s) => <li key={s.headline}><b>{s.headline}</b>: {s.idea}</li>)}</ul>
              </Step>
            )}
            <Step n={++n} title="I reply to reviews">
              <p>{pb.reviews}</p>
            </Step>
            <Step n={++n} title="I watch competitors">
              <p>{pb.competitors}</p>
            </Step>
          </ol>
          {pb.care && <p className="pb-callout"><b>Rules I follow:</b> {pb.care}</p>}
          <h3 className="pb-sub">What you do</h3>
          <ul className="pb-list">{pb.owner.map((o) => <li key={o}>{o}</li>)}</ul>
        </Part>

        <Part id="timeline" n="03" title="The timeline">
          <ol className="pb-steps">
            {pb.timeline.map((t) => (
              <li key={t.when}>
                <h3>{t.when}</h3>
                <ul>{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </li>
            ))}
          </ol>
        </Part>

        <Part id="results" n="04" title="The results to watch">
          <ul className="pb-list pb-results">{pb.measure.map((m) => <li key={m}>{m}</li>)}</ul>
          <div className="pb-plan">
            <p className="pb-plan__name">{pb.plan.name}, {pb.plan.price}</p>
            <p>{pb.plan.why}</p>
            {pb.plan.alt && <p className="v3-fine">{pb.plan.alt}</p>}
            <Link className="v3-link" href="/pricing">Compare all plans ›</Link>
          </div>
        </Part>
      </div>

      <div className="v3-card v3-card--line" style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <p style={{ margin: 0, color: "var(--v-fg)", fontWeight: 700 }}>See what AI says about your business</p>
          <p style={{ marginTop: 4 }}>Free check: what ChatGPT, Gemini, Claude and Perplexity say about you.</p>
        </div>
        <Link href="/start" className="v3-btn">Run the free check →</Link>
      </div>
    </article>
  )
}
