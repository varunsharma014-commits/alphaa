"use client"

import type { CitationsData, EngineCell, QuestionRow } from "@/lib/workspace/citations"
import { TONE_LABEL, type SourceKind } from "@/lib/ai-sources"
import { ShareOfVoiceChart } from "./ShareOfVoiceChart"
import { EmptyState, Glyph, List, ListRow, PageHeader, Pill, SectionHeader, StatRow, StatTile, When, useInspector, type InspRow } from "./ui"
import "./detail.css"

// "Where AI gets its answers": the pages each AI cites for the owner's customer questions, the top
// sites across the niche, how the answers talk about the owner, Google AI Overviews, and share of
// voice against competitors over time. Real stored rows only (lib/workspace/citations.ts).

const KIND_TONE: Record<SourceKind, "ok" | "warn" | "info" | "idle"> = { own: "ok", competitor: "warn", directory: "info", social: "idle", forum: "idle", media: "idle", reference: "idle", other: "idle" }

/** A cited page as a person reads it: its title (or the last part of its path), then the site. */
function pageName(url: string, title: string | null): { title: string; host: string } {
  let host = "", path = ""
  try { const u = new URL(url); host = u.hostname.replace(/^www\./, ""); path = u.pathname.replace(/\/$/, "") } catch { /* keep empty */ }
  const last = path.split("/").filter(Boolean).pop() ?? ""
  let slug = last
  try { slug = decodeURIComponent(last) } catch { /* keep raw */ }
  return { title: title?.trim() || slug.replace(/[-_]+/g, " ").replace(/\.[a-z]{2,4}$/i, "") || host, host }
}

function cellRows(c: EngineCell): InspRow[] {
  const rows: InspRow[] = [{ k: "Verdict", v: c.state === "named" ? `Names you${c.rank ? ` · #${c.rank} of the businesses it named` : ""}` : c.state === "error" ? "Didn’t answer this time" : "Doesn’t name you yet" }]
  if (c.tone) rows.push({ k: `How it talks about you · ${TONE_LABEL[c.tone]}`, v: c.quote ? `“${c.quote}”` : TONE_LABEL[c.tone], box: true })
  if (c.ranks.length) rows.push({ k: c.state === "named" ? "Also named" : "Named instead of you", v: c.ranks.map((r) => `#${r.rank} ${r.name}`).join(" · ") })
  const cited = c.pages.filter((p) => p.cited)
  const read = c.pages.filter((p) => !p.cited)
  cited.forEach((p, i) => rows.push({ k: i === 0 ? `Pages it cited (${cited.length})` : " ", v: `${p.title ? `${p.title} · ` : ""}${p.site}${p.kind === "own" ? " (your site)" : p.kind === "competitor" ? " (competitor)" : ""}`, href: p.url }))
  read.slice(0, 4).forEach((p, i) => rows.push({ k: i === 0 ? "Also read, not cited" : " ", v: `${p.title ? `${p.title} · ` : ""}${p.site}`, href: p.url }))
  if (!c.pages.length) rows.push({ k: "Pages it cited", v: c.engine === "gemini" ? "Gemini didn’t return any sources for this answer (Google Search grounding is off or wasn’t used)." : "No sources came back with this answer." })
  return rows
}

export function CitationsView({ data }: { data: CitationsData }) {
  const { node, open } = useInspector()
  const own = data.sov?.series[0]
  const lastShare = own?.points[own.points.length - 1]?.share ?? null
  const named = data.tones.positive + data.tones.neutral + data.tones.negative + data.tones.mixed
  const ov = data.overviews?.checks.filter((c) => c.shown !== null) ?? []
  const ovShown = ov.filter((c) => c.shown)
  const totalKinds = Math.max(1, data.kinds.reduce((a, k) => a + k.count, 0))

  const openQuestion = (q: QuestionRow) => {
    const rows: InspRow[] = []
    for (const c of q.engines) {
      rows.push({ k: c.name, v: c.state === "named" ? `Names you${c.tone ? ` · ${TONE_LABEL[c.tone].toLowerCase()}` : ""}${c.rank ? ` · #${c.rank}` : ""}` : c.state === "error" ? "Didn’t answer" : "Doesn’t name you yet", box: true })
      rows.push(...cellRows(c).slice(1))
    }
    open({ eb: "Pages AI cites", title: q.q, rows, cta: { label: "See every answer", topic: "answers" } })
  }

  const header = (
    <PageHeader
      title="Where AI gets its answers"
      sub={`The pages each AI cites when your customers ask, and who it names instead of ${data.business}.`}
      meta={data.at ? <When at={data.at} mode="ago" prefix="Checked " fallback="" /> : undefined}
    />
  )

  if (!data.scanned) {
    return (
      <>
        {header}
        <EmptyState
          hero
          icon={<Glyph name="link" size={26} />}
          title="I haven’t asked the AIs your customer questions yet"
          text="Every week I ask ChatGPT, Claude, Perplexity and Gemini the questions your customers ask."
          bullets={["Which pages each AI cites", "Who it names instead of you", "How often you’re named, week by week"]}
        />
        {node}
      </>
    )
  }

  return (
    <>
      {header}

      <StatRow>
        <StatTile label="Answers that name you" value={lastShare != null ? `${lastShare}%` : null} hint={own ? `Latest week, ${data.sov!.weeks[data.sov!.weeks.length - 1].answers} answers` : "Shown after two weekly checks"} />
        <StatTile label="Your site as a source" value={data.at ? `${data.ownCited} of ${data.totalCitations}` : null} hint={data.at ? "Pages cited in my latest check" : "Saved from my next weekly check"} />
        <StatTile label="How they talk about you" value={named ? `${data.tones.positive} positive` : null} empty="No mentions yet" hint={named ? `${data.tones.neutral} neutral, ${data.tones.mixed} mixed, ${data.tones.negative} negative` : "Once an AI names you"} />
        <StatTile label="Google AI Overviews" value={ov.length ? `${ovShown.length} of ${ov.length}` : null} empty={data.overviewsOn ? "Not measured yet" : "Not checked"} hint={ov.length ? `questions show one, ${ov.filter((c) => c.cited).length} cite your site` : data.overviewsOn ? "Checked with my next weekly pass" : undefined} />
      </StatRow>

      <SectionHeader title="Share of voice" sub="Out of every answer to your customer questions, how many named you and each top competitor." />
      {data.sov ? (
        <section className="xp-card">
          <ShareOfVoiceChart data={data.sov} />
          {lastShare === 0 && <p className="xp-note">No answer named you yet, so your line sits at 0%. It moves as soon as one AI names you.</p>}
        </section>
      ) : (
        <EmptyState title="Your trend starts after two weekly checks" text={`I have ${data.sovWeeks} week${data.sovWeeks === 1 ? "" : "s"} of answers so far. I ask again every week.`} />
      )}

      <SectionHeader title="Top sources in your niche" sub="The sites the AIs cited most when answering your customer questions." />
      {!data.at ? (
        <EmptyState title="I start saving cited pages with my next weekly check" text="Older checks saved who the AIs named, not which pages they used." />
      ) : !data.topSites.length ? (
        <EmptyState title="No sources came back in my latest check" text="The AIs answered from what they already know, without citing pages." />
      ) : (
        <section className="xp-card">
          {data.kinds.length > 0 && (
            <>
              <div className="xp-kindbar" role="img" aria-label={data.kinds.map((k) => `${k.label} ${Math.round((k.count / totalKinds) * 100)}%`).join(", ")}>
                {data.kinds.map((k) => <i key={k.kind} className={`k-${k.kind}`} style={{ width: `${(k.count / totalKinds) * 100}%` }} />)}
              </div>
              <div className="xp-kindkey">{data.kinds.map((k) => <span key={k.kind}><i className={`xp-sw k-${k.kind}`} />{k.label} <b>{Math.round((k.count / totalKinds) * 100)}%</b></span>)}</div>
            </>
          )}
          {data.topSites.map((s) => (
            <div key={s.site} className="xp-site">
              <div className="xp-site__b">
                <div className="xp-site__n">{s.site}<Pill tone={KIND_TONE[s.kind]}>{s.kindLabel}</Pill></div>
                <div className="xp-site__pages">
                  {s.pages.map((p) => { const n = pageName(p.url, p.title); return <a key={p.url} className="xp-src" href={p.url} target="_blank" rel="noopener noreferrer"><span>{n.title}</span><span className="xp-host">↗</span></a> })}
                </div>
              </div>
              <div className="xp-site__end"><b>{s.answers} answer{s.answers === 1 ? "" : "s"}</b><span className="ax-t11">{s.engines.join(", ")}</span></div>
            </div>
          ))}
        </section>
      )}

      {data.at && (
        <>
          <SectionHeader title="By AI" sub="The sites each assistant cited most in my latest check." />
          <div className="xp-byai">
            {data.byEngine.filter((e) => e.answers > 0).map((e) => (
              <section key={e.engine} id={e.engine} className="xp-card">
                <b>{e.name}</b><div className="ax-t11">{e.pages} page{e.pages === 1 ? "" : "s"} cited in {e.answers} answers</div>
                {e.sites.length ? (
                  <ul>{e.sites.map((s) => <li key={s.site}><span>{s.site}<span className="ax-t11"> · {s.kindLabel}</span></span><span className="xp-num">{s.count}</span></li>)}</ul>
                ) : <p className="ax-p xp-gap">{e.engine === "gemini" ? "No sources came back. Gemini only cites pages when it searches Google." : e.engine === "chatgpt" ? "No sources came back. ChatGPT only cites pages when it decides to search." : "No sources came back this time."}</p>}
              </section>
            ))}
          </div>
        </>
      )}

      {data.overviews && (
        <>
          <SectionHeader title="Google AI Overviews" sub={<>The summary Google shows above the results for your top questions · <When at={data.overviews.at} mode="ago" prefix="checked " fallback="" /></>} />
          <List card label="Google AI Overviews">
            {data.overviews.checks.map((c) => (
              <ListRow
                key={c.q}
                title={c.q}
                meta={c.shown === null ? <Pill tone="idle">Couldn’t check</Pill> : c.shown ? <><Pill tone="info">AI Overview shown</Pill>{c.cited ? <Pill tone="ok">Cites your site</Pill> : c.named ? <Pill tone="ok">Names you</Pill> : <Pill tone="warn">Doesn’t cite you</Pill>}</> : <Pill tone="idle">No AI Overview</Pill>}
                onClick={c.shown ? () => open({ eb: "Google AI Overview", title: c.q, rows: [...(c.excerpt ? [{ k: "What Google’s AI Overview said", v: c.excerpt, box: true }] : []), ...c.sources.map((s, i) => ({ k: i === 0 ? `Sources it cited (${c.sources.length})` : " ", v: s.title ?? pageName(s.url, null).title, href: s.url }))] }) : undefined}
                chevron={!!c.shown}
              />
            ))}
          </List>
        </>
      )}

      {data.questions.length > 0 && (
        <>
          <SectionHeader title="Question by question" sub="Tap a question to see each AI’s sources and who it names first." />
          <List card label="Customer questions">
            {data.questions.map((q) => {
              const namedBy = q.engines.filter((c) => c.state === "named")
              const pages = q.engines.reduce((a, c) => a + c.pages.filter((p) => p.cited).length, 0)
              return (
                <ListRow
                  key={q.q}
                  title={q.q}
                  onClick={() => openQuestion(q)}
                  meta={<>
                    <span className="xp-dots" role="img" aria-label={`${namedBy.length} of ${q.engines.length} AIs name you`}>{q.engines.map((c) => <i key={c.engine} className={c.state === "named" ? "on" : c.state === "error" ? "err" : ""} title={`${c.name}: ${c.state === "named" ? "names you" : c.state === "error" ? "didn’t answer" : "doesn’t name you yet"}`} />)}</span>
                    <span>{namedBy.length ? `Named by ${namedBy.map((c) => c.name).join(", ")}` : "No AI names you yet"}</span>
                    <span>· {pages} page{pages === 1 ? "" : "s"} cited</span>
                  </>}
                />
              )
            })}
          </List>
        </>
      )}
      {node}
    </>
  )
}
