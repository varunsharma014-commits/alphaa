"use client"

import type { ContentBrief } from "@/lib/content-brief"

// The plan a page was written from (lib/content-brief.ts), folded under one line so the page
// itself stays the focus. Everything here is real data: their page, my own pages, the facts.

const INTENT: Record<ContentBrief["intent"], string> = { informational: "Learning", commercial: "Comparing options", transactional: "Ready to buy or book", local: "Looking nearby" }
const FAQ_SRC: Record<ContentBrief["faq"][number]["source"], string> = { ai_question: "AI question I track", search_console: "your Google searches", competitor: "their page", writer: "suggested" }

export function BriefView({ brief, open = false }: { brief: ContentBrief; open?: boolean }) {
  const c = brief.competitor
  const row = (k: string, v: React.ReactNode) => (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, padding: "6px 0", fontSize: 13.5, borderTop: "1px solid rgba(0,0,0,.06)" }}>
      <span style={{ color: "var(--x-mut)" }}>{k}</span>
      <div style={{ minWidth: 0 }}>{v}</div>
    </div>
  )
  return (
    <details className="box" open={open} style={{ padding: "10px 14px" }}>
      <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, listStyle: "revert" }}>
        The brief I wrote it from{c?.read && c.words ? ` · beats a ${c.words.toLocaleString("en-US")}-word page` : ""}
      </summary>
      <div style={{ marginTop: 8 }}>
        {row("Answers", <b>{brief.question}</b>)}
        {row("Search phrase", brief.keyword)}
        {row("Reader", <>{brief.audience} <span className="ax-pill n" style={{ marginLeft: 4 }}>{INTENT[brief.intent]}</span></>)}
        {row("Outline", (
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {brief.outline.map((s, i) => <li key={i}>{s.h2}{s.h3.length > 0 && <ul style={{ margin: "2px 0", paddingLeft: 16, color: "var(--x-mut)" }}>{s.h3.map((h, j) => <li key={j}>{h}</li>)}</ul>}</li>)}
          </ol>
        ))}
        {brief.internalLinks.length > 0 && row("Links to your pages", (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {brief.internalLinks.map((l, i) => <li key={i}><a className="ax-src" href={l.url} target="_blank" rel="noopener noreferrer">{l.anchor}</a> <span style={{ color: "var(--x-mut)" }}>in “{l.section}”</span></li>)}
          </ul>
        ))}
        {brief.facts.length > 0 && row("Facts it uses", (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {brief.facts.map((f, i) => <li key={i}>{f.text} <span style={{ color: "var(--x-mut)", fontSize: 12 }}>({f.source})</span></li>)}
          </ul>
        ))}
        {c && row("Their page", (
          <>
            <a className="ax-src" href={c.url} target="_blank" rel="noopener noreferrer">{c.title || c.host} ↗</a>
            <div style={{ color: "var(--x-mut)", fontSize: 12.5 }}>{c.read ? `${c.words ? `${c.words.toLocaleString("en-US")} words · ` : ""}${c.headings.length} headings I read` : "Listed on their site; I couldn’t read it"}</div>
            {c.headings.length > 0 && <div style={{ color: "var(--x-mut)", fontSize: 12.5, marginTop: 2 }}>{c.headings.slice(0, 8).join(" · ")}{c.headings.length > 8 ? " …" : ""}</div>}
          </>
        ))}
        {brief.faq.length > 0 && row("FAQ", (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {brief.faq.map((f, i) => <li key={i}>{f.q} <span style={{ color: "var(--x-mut)", fontSize: 12 }}>({FAQ_SRC[f.source]})</span></li>)}
          </ul>
        ))}
        {row("Length", `About ${brief.wordTarget.toLocaleString("en-US")} words`)}
      </div>
    </details>
  )
}
