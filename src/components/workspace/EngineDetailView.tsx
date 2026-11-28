"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import type { EngineDetail, EngineQuestion } from "@/lib/workspace/visibility"
import { EngineMark, answerExcerpt, verdictPill } from "./EngineCard"
import { Button, EmptyState, Glyph, List, ListRow, PageHeader, Pill, SectionHeader, Sheet, StatRow, StatTile, When } from "./ui"
import "./detail.css"

// One AI, question by question: did it name the owner, who it named instead, the pages it cited.
// Everything comes from the stored weekly checks; nothing here is a forecast.

function pageLabel(p: { title: string | null; url: string; site: string }): { title: string; host: string } {
  let path = ""
  try { const u = new URL(p.url); path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "") } catch { /* keep empty */ }
  return { title: p.title?.trim() || (path ? decodeURIComponent(path.split("/").pop() ?? "").replace(/[-_]+/g, " ") : p.site), host: p.site }
}

function QuestionRow({ q, name }: { q: EngineQuestion; name: string }) {
  return (
    <div className="xp-q">
      <div className="xp-q__top">
        <span className="xp-q__t">{q.q}</span>
        {q.state === "named" ? <Pill tone="ok" dot>{q.rank ? `Names you #${q.rank}` : "Names you"}</Pill> : q.state === "error" ? <Pill tone="idle">Didn’t answer</Pill> : <Pill tone="warn">Not yet</Pill>}
      </div>
      {q.state === "named" && q.quote && <p className="xp-eng__quote">{q.quote}</p>}
      {q.others.length > 0 && (
        <div>
          <div className="xp-eng__lbl">{q.state === "named" ? "Also named" : `${name} named instead`}</div>
          <div className="xp-chips">{q.others.map((n) => <span key={n} className="ax-chip">{n}</span>)}</div>
        </div>
      )}
      {q.cited.length > 0 && (
        <div>
          <div className="xp-eng__lbl">Pages it cited</div>
          <div className="xp-site__pages">
            {q.cited.map((p) => {
              const l = pageLabel(p)
              return <a key={p.url} className="xp-src" href={p.url} target="_blank" rel="noopener noreferrer"><span>{l.title}</span><span className="xp-host">{l.host}{p.kind === "own" ? " · your site" : ""} ↗</span></a>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function EngineDetailView({ data, action }: { data: EngineDetail; action: ReactNode }) {
  const [full, setFull] = useState(false)
  const c = data.card
  const asked = data.questions.filter((q) => q.state !== "error")
  const named = asked.filter((q) => q.state === "named").length
  const quote = answerExcerpt(c)

  return (
    <>
      <PageHeader
        title={<span className="xp-h1"><EngineMark engine={data.engine} size="lg" />{data.name}</span>}
        pill={verdictPill(c.state)}
        sub={`Every customer question I asked ${data.name}, what it answered and the pages it used.`}
        meta={<><Link className="ax-lnk" href="/dashboard/visibility">← All four AIs</Link>{c.at && <span><When at={c.at} mode="ago" prefix="Asked " fallback="" />{data.source ? ` · from ${data.source}` : ""}</span>}</>}
        actions={<>{action}<Button variant="primary" href="/dashboard/sandbox">Ask it yourself</Button></>}
      />

      {c.state === "unknown" && !asked.length ? (
        <EmptyState
          hero
          icon={<Glyph name="spark" size={26} />}
          title={`I haven’t asked ${data.name} yet`}
          text="My weekly check runs on Wednesday. You can also ask it a question right now."
          bullets={["Whether it names you", "Who it names instead", "The pages it cites"]}
        />
      ) : (
        <>
          <StatRow>
            <StatTile label={`Questions where ${data.name} names you`} value={asked.length ? `${named} of ${asked.length}` : null} hint={data.questionsAt ? <When at={data.questionsAt} mode="ago" prefix="Weekly questions, asked " fallback="Weekly questions" /> : "From my next weekly check"} />
            <StatTile label="Pages it cited" value={c.citedPages ?? null} hint={c.citedPages != null ? "Across my newest weekly questions" : "Saved from my next weekly check"} />
          </StatRow>

          {c.state !== "unknown" && (c.question || quote) && (
            <>
              <SectionHeader title="What it said last time" />
              <section className="xp-card xp-stack">
                {c.question && <div className="xp-eng__q">“{c.questionFull ?? c.question}”</div>}
                {quote && <p className="xp-eng__quote">{quote}</p>}
                {c.names.length > 0 && <div><div className="xp-eng__lbl">{c.state === "yes" ? "Also named" : "Named instead of you"}</div><div className="xp-chips">{c.names.map((n) => <span key={n} className="ax-chip">{n}</span>)}</div></div>}
                {c.answer && <div><Button size="sm" onClick={() => setFull(true)}>Read the full answer</Button></div>}
              </section>
            </>
          )}

          <SectionHeader title="Question by question" sub={asked.length ? "My newest weekly questions, as your customers would ask them." : undefined} />
          {data.questions.length ? (
            <section className="xp-card flush">{data.questions.map((q) => <QuestionRow key={q.q} q={q} name={data.name} />)}</section>
          ) : (
            <EmptyState title="No weekly questions saved for this AI yet" text="I save every question, answer and cited page from my next weekly check." />
          )}

          {data.sites.length > 0 && (
            <>
              <SectionHeader title="Sites it leans on" sub="The sites it cited most in my latest check." end={<Button size="sm" href={`/dashboard/citations#${data.engine}`}>Every source</Button>} />
              <List card label={`Sites ${data.name} cited`}>
                {data.sites.map((s) => <ListRow key={s.site} title={s.site} meta={s.kindLabel} chevron={false} end={<span className="xp-num">{s.count} {s.count === 1 ? "page" : "pages"}</span>} />)}
              </List>
            </>
          )}
        </>
      )}

      <Sheet open={full} onClose={() => setFull(false)} eyebrow={`${data.name} · ${c.state === "yes" ? "names you" : "doesn’t name you yet"}`} title={c.questionFull ?? "The answer"}>
        <p className="xp-eng__quote full">{c.answer}</p>
      </Sheet>
    </>
  )
}
