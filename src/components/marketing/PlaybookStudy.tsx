// One detailed example playbook (/case-studies/[slug], data in case-studies/playbooks.ts), v3 design.
// Illustrative only: the H1 carries a footnote marker to the page's single note, and the intro says
// it in plain words. Nothing here adds a claim beyond the data file.
import Link from "next/link"
import type { Playbook } from "@/app/(marketing)/case-studies/playbooks"
import { Eyebrow, NoteRef } from "@/components/marketing/v3"
import { INDUSTRY_TONE } from "@/components/marketing/v3/pages/case-tone"

function Block({ id, kicker, title, children }: { id: string; kicker?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="v3-card pb-block" aria-labelledby={`${id}-h`}>
      {kicker && <p className="v3-kicker" style={{ color: "var(--cc)" }}>{kicker}</p>}
      <h2 id={`${id}-h`} className="v3-h3">{title}</h2>
      {children}
    </section>
  )
}

export function PlaybookStudy({ pb, note }: { pb: Playbook; note: number }) {
  const tone = INDUSTRY_TONE[pb.industry] ?? "ad"
  return (
    <article id={pb.id} className={`v3-c-${tone} pb`} style={{ scrollMarginTop: 96 }}>
      <div className="v3-chapter v3-chapter--solo">
        <div>
          <Eyebrow small={pb.location}>{pb.industry}</Eyebrow>
          <h1 className="v3-h2">{pb.business}<NoteRef n={note} /></h1>
          <p className="v3-chapter__body" style={{ maxWidth: "62ch" }}>
            <b>This is an illustrative example, not a real customer.</b> {pb.headline}
          </p>
          <div className="v3-proof"><span className="n" style={{ fontSize: "clamp(24px, 3.6vw, 36px)" }}>{pb.keyResult}</span><span>{pb.keyResultSub}</span></div>
          <nav className="pb-toc" aria-label="On this page">
            <a href="#questions">AI questions</a><a href="#writes">What I write</a><a href="#timeline">Timeline</a><a href="#plan">Plan</a><a href="#measure">What to measure</a>
          </nav>
        </div>
      </div>

      <div className="pb-grid">
        <Block id="situation" kicker="The situation" title="Where a business like this usually starts">
          <p>{pb.situation}</p>
        </Block>

        <Block id="questions" kicker="Step 1" title="The questions I put to ChatGPT, Gemini, Claude and Perplexity">
          <ul className="pb-q">{pb.questions.map((q) => <li key={q}>“{q}”</li>)}</ul>
          <p className="v3-fine">Every week, in the customer’s words. Starter checks 10 questions, Pro 20.</p>
        </Block>

        <Block id="finds" kicker="Step 2" title="What I usually find">
          <ul>{pb.finds.map((f) => <li key={f}>{f}</li>)}</ul>
        </Block>

        <Block id="writes" kicker="Step 3" title="Pages and blog posts I write">
          <ul>{pb.pages.map((p) => <li key={p}>{p}</li>)}</ul>
          <p className="v3-fine">Example titles. Each one answers a question people ask AI, in the owner’s voice, and waits for approval.</p>
        </Block>

        {(pb.googlePosts || pb.social) && (
          <Block id="posts" kicker="Step 4" title="Google and social posts">
            {pb.googlePosts && (<>
              <h3 className="pb-h3">Google Business Profile posts (Pro, 4 a week)</h3>
              <ul>{pb.googlePosts.map((g) => <li key={g}>{g}</li>)}</ul>
            </>)}
            {pb.social && (<>
              <h3 className="pb-h3">Social post ideas (Pro, 3 a week, ready to publish in one tap)</h3>
              <ul>{pb.social.map((s) => <li key={s.headline}><b>{s.headline}</b>: {s.idea}</li>)}</ul>
            </>)}
          </Block>
        )}

        <Block id="reviews" kicker="Reviews" title="How I reply to reviews">
          <p>{pb.reviews}</p>
        </Block>

        <Block id="competitors" kicker="Competitor watch" title="What I watch every week">
          <p>{pb.competitors}</p>
        </Block>

        {pb.care && (
          <Block id="rules" kicker="Rules I follow" title="What I won’t write for this business">
            <p>{pb.care}</p>
          </Block>
        )}
      </div>

      <section id="timeline" className="pb-timeline" aria-labelledby="timeline-h">
        <h2 id="timeline-h" className="v3-h3">Week 1, month 1, month 3</h2>
        <ol className="pb-steps">
          {pb.timeline.map((t) => (
            <li key={t.when}>
              <h3>{t.when}</h3>
              <ul>{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </li>
          ))}
        </ol>
      </section>

      <div className="pb-grid">
        <Block id="owner" kicker="Your part" title="What the owner does">
          <ul>{pb.owner.map((o) => <li key={o}>{o}</li>)}</ul>
        </Block>

        <Block id="plan" kicker="Plan fit" title={`${pb.plan.name}, ${pb.plan.price}`}>
          <p>{pb.plan.why}</p>
          {pb.plan.alt && <p>{pb.plan.alt}</p>}
          <p><Link className="v3-link" href="/pricing">Compare all plans ›</Link></p>
        </Block>

        <Block id="measure" kicker="What to measure" title="How to tell if it’s working">
          <ul>{pb.measure.map((m) => <li key={m}>{m}</li>)}</ul>
          <p className="v3-fine">Things to watch, not promises. Results vary, and AI answers change on each assistant’s own schedule.</p>
        </Block>
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
