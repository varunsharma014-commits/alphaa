"use client"

import type { CitationsData, EngineCell, QuestionRow } from "@/lib/workspace/citations"
import { TONE_LABEL, type SourceKind, type Tone } from "@/lib/ai-sources"
import { ShareOfVoiceChart } from "./ShareOfVoiceChart"
import { Empty, When, useInspector, type InspRow } from "./ui"

// "Where AI gets its answers": the pages each AI cites for the owner's customer questions, the top
// sites across the niche, how the answers talk about the owner, Google AI Overviews, and share of
// voice against competitors over time. Real stored rows only (lib/workspace/citations.ts).

const KIND_PILL: Record<SourceKind, string> = { own: "g", competitor: "a", directory: "b", social: "n", forum: "n", media: "n", reference: "n", other: "n" }
const TONE_PILL: Record<Tone, string> = { positive: "g", neutral: "n", negative: "a", mixed: "b" }

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

  const openQuestion = (q: QuestionRow) => {
    const rows: InspRow[] = []
    for (const c of q.engines) {
      rows.push({ k: c.name, v: c.state === "named" ? `Names you${c.tone ? ` · ${TONE_LABEL[c.tone].toLowerCase()}` : ""}${c.rank ? ` · #${c.rank}` : ""}` : c.state === "error" ? "Didn’t answer" : "Doesn’t name you yet", box: true })
      rows.push(...cellRows(c).slice(1))
    }
    open({ eb: "Pages AI cites", title: q.q, rows, cta: { label: "See every answer", topic: "answers" } })
  }

  if (!data.scanned) {
    return (
      <>
        <Header data={data} />
        <Empty title="I haven’t asked the AIs your customer questions yet" text="Every week I ask ChatGPT, Claude, Perplexity and Gemini the questions your customers ask, and save which pages they cite and who they name." act={{ label: "Ask them now", topic: "answers", primary: true }} />
        {node}
      </>
    )
  }

  return (
    <>
      <Header data={data} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 22 }}>
        <div className="ax-tile"><div className="k">Answers that name you</div><div className="v"><b>{lastShare != null ? `${lastShare}%` : "—"}</b></div><div className="e">{own ? `Latest week, across ${data.sov!.weeks[data.sov!.weeks.length - 1].answers} answers` : "Shown after two weekly checks"}</div></div>
        <div className="ax-tile"><div className="k">Your site as a source</div><div className="v"><b>{data.at ? `${data.ownCited} of ${data.totalCitations}` : "—"}</b></div><div className="e">{data.at ? "Pages AI cited in my latest check" : "Saved from my next weekly check"}</div></div>
        <div className="ax-tile"><div className="k">How they talk about you</div><div className="v"><b>{named ? `${data.tones.positive} positive` : "—"}</b></div><div className="e">{named ? `${data.tones.neutral} neutral · ${data.tones.mixed} mixed · ${data.tones.negative} negative` : "Once an AI names you"}</div></div>
        <div className="ax-tile"><div className="k">Google AI Overviews</div><div className="v"><b>{ov.length ? `${ovShown.length} of ${ov.length}` : "—"}</b></div><div className="e">{ov.length ? `questions show one · ${ov.filter((c) => c.cited).length} cite your site` : data.overviewsOn ? "Checked with my next weekly pass" : "Not checked"}</div></div>
      </div>

      <div className="ax-h2"><div><h2>Share of voice</h2><p>Out of every answer the four AIs gave to your customer questions, how many named you and how many named each top competitor.</p></div></div>
      {data.sov ? (
        <section className="ax-card" style={{ padding: 20 }}><ShareOfVoiceChart data={data.sov} /></section>
      ) : (
        <Empty title="Your trend starts after two weekly checks" text={`I have ${data.sovWeeks} week${data.sovWeeks === 1 ? "" : "s"} of answers so far. I ask again every week.`} />
      )}

      <div className="ax-h2"><div><h2>Top sources AI uses in your niche</h2><p>The sites the AIs cited most when answering your customer questions{data.at ? <> · <When at={data.at} mode="ago" prefix="checked " fallback="" /></> : null}.</p></div></div>
      {!data.at ? (
        <Empty title="I start saving cited pages with my next weekly check" text="Older checks recorded who the AIs named, not which pages they used. From the next check you’ll see every page each AI cites, and whose site it is." />
      ) : !data.topSites.length ? (
        <Empty title="No sources came back in my latest check" text="The AIs answered from what they already know, without citing pages." />
      ) : (
        <section className="ax-card" style={{ padding: "6px 20px" }}>
          {data.kinds.length > 0 && <p className="ax-t13" style={{ color: "var(--x-mut)", margin: "12px 0 4px" }}>{data.kinds.map((k) => `${k.label} ${Math.round((k.count / Math.max(1, data.totalCitations)) * 100)}%`).join(" · ")}</p>}
          {data.topSites.map((s) => (
            <div key={s.site} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderTop: "1px solid var(--x-line)", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontSize: 14.5 }}>{s.site}</b><span className={`ax-pill ${KIND_PILL[s.kind]}`}>{s.kindLabel}</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                  {s.pages.map((p) => <a key={p.url} className="ax-src" href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{p.title || p.url} ↗</a>)}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 120 }}>
                <b style={{ fontSize: 14 }}>{s.answers} answer{s.answers === 1 ? "" : "s"}</b>
                <div className="ax-t11">{s.engines.join(", ")}</div>
              </div>
            </div>
          ))}
        </section>
      )}

      {data.at && (
        <>
          <div className="ax-h2"><div><h2>By AI</h2><p>The sites each assistant cited most in my latest check.</p></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            {data.byEngine.filter((e) => e.answers > 0).map((e) => (
              <section key={e.engine} id={e.engine} className="ax-card" style={{ padding: 16, scrollMarginTop: 90 }}>
                <b style={{ fontSize: 14.5 }}>{e.name}</b><div className="ax-t11" style={{ marginTop: 2 }}>{e.pages} page{e.pages === 1 ? "" : "s"} cited · {e.answers} answers</div>
                {e.sites.length ? (
                  <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 6 }}>
                    {e.sites.map((s) => <li key={s.site} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}><span style={{ minWidth: 0 }}><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.site}</span><span className="ax-t11">{s.kindLabel}</span></span><span style={{ color: "var(--x-mut)", fontVariantNumeric: "tabular-nums" }}>{s.count}</span></li>)}
                  </ul>
                ) : <p className="ax-p" style={{ marginTop: 8, fontSize: 13 }}>{e.engine === "gemini" ? "No sources returned. Gemini cites pages only when Google Search grounding is on." : e.engine === "chatgpt" ? "No sources returned. ChatGPT only cites pages when it decides to search." : "No sources returned this time."}</p>}
              </section>
            ))}
          </div>
        </>
      )}

      {data.overviews && (
        <>
          <div className="ax-h2"><div><h2>Google AI Overviews</h2><p>The summary Google shows above the results, for your top questions · <When at={data.overviews.at} mode="ago" prefix="checked " fallback="" /></p></div></div>
          <section className="ax-card" style={{ padding: "6px 20px" }}>
            {data.overviews.checks.map((c) => (
              <div key={c.q} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--x-line)", flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 220, fontSize: 14 }}>{c.q}</span>
                {c.shown === null ? <span className="ax-pill n">Couldn’t check</span> : c.shown ? <span className="ax-pill b">AI Overview shown</span> : <span className="ax-pill n">No AI Overview</span>}
                {c.shown && (c.cited ? <span className="ax-pill g">Cites your site</span> : c.named ? <span className="ax-pill g">Names you</span> : <span className="ax-pill a">Doesn’t cite you</span>)}
                {c.shown && <button className="ax-lnk" type="button" onClick={() => open({ eb: "Google AI Overview", title: c.q, rows: [...(c.excerpt ? [{ k: "What Google’s AI Overview said", v: c.excerpt, box: true }] : []), ...c.sources.map((s, i) => ({ k: i === 0 ? `Sources it cited (${c.sources.length})` : " ", v: s.title ?? s.url, href: s.url }))] })}>Sources</button>}
              </div>
            ))}
          </section>
        </>
      )}

      {data.questions.length > 0 && (
        <>
          <div className="ax-h2"><div><h2>Pages AI cites, question by question</h2><p>Tap a question to see each AI’s sources, how it talks about you and who it ranks first.</p></div></div>
          <section className="ax-card" style={{ padding: "6px 20px" }}>
            {data.questions.map((q) => (
              <div key={q.q} className="hv" role="button" tabIndex={0} onClick={() => openQuestion(q)} onKeyDown={(e) => { if (e.key === "Enter") openQuestion(q) }} style={{ padding: "12px 0", borderTop: "1px solid var(--x-line)", cursor: "pointer" }}>
                <div style={{ fontSize: 14, fontWeight: 550 }}>{q.q}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {q.engines.map((c) => (
                    <span key={c.engine} className="ax-chip" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 99, background: c.state === "named" ? "#34c759" : "#c7c7cc" }} />
                      {c.name}{c.state === "named" ? " names you" : ""}
                      {c.tone && <span className={`ax-pill ${TONE_PILL[c.tone]}`} style={{ padding: "0 7px", fontSize: 11 }}>{TONE_LABEL[c.tone]}</span>}
                      <span style={{ color: "var(--x-mut)" }}>· {c.pages.filter((p) => p.cited).length} page{c.pages.filter((p) => p.cited).length === 1 ? "" : "s"}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
      <p className="ax-note" style={{ marginTop: 16 }}>Sources are the pages each AI returned with its answer: ChatGPT and Perplexity from their web search, Claude from its web search, Gemini from Google Search grounding when it’s on. Google AI Overviews come from a Google search for the same question.</p>
      {node}
    </>
  )
}

function Header({ data }: { data: CitationsData }) {
  return (
    <div className="ax-hdr">
      <div>
        <h1 className="ax-h1">Where AI gets its answers</h1>
        <p className="ax-sub">Which pages ChatGPT, Claude, Perplexity and Gemini cite when your customers ask, who they name instead of {data.business}, and how that changes week to week.</p>
      </div>
    </div>
  )
}
