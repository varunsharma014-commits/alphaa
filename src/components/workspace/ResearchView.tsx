"use client"

import { useState } from "react"
import type { ResearchData } from "@/lib/workspace/research"
import { askAlphaa } from "@/lib/workspace/events"
import { CopyButton, Empty, Tabs, useInspector } from "./ui"

type Tab = "w" | "i" | "g" | "c"

export function ResearchView({ data }: { data: ResearchData }) {
  const { node, open } = useInspector()
  const [tab, setTab] = useState<Tab>("w")
  const [all, setAll] = useState(false)
  const working = all ? data.working : data.working.slice(0, 4)

  return (
    <>
      <h1 className="ax-h1">Research & Ideas</h1>
      <p className="ax-sub">{data.summary}</p>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ key: "w", label: "What’s working nearby" }, { key: "i", label: "Ideas & hooks" }, { key: "g", label: "Blog & page gaps" }, { key: "c", label: "Competitors" }]} />

      {tab === "w" && (
        <>
          {working.length ? (
            <div className="ax-g2">
              {working.map((w) => (
                <article key={w.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="ax-art" style={{ height: 160, background: w.art }}>
                    <span className="ax-pill w" style={{ alignSelf: "flex-start" }}>{w.where}</span>
                    <b style={{ fontSize: 18, lineHeight: 1.3 }}>{w.title}</b>
                  </div>
                  <div className="ax-cb">
                    {w.stats.length > 0 && (
                      <div className="ax-stats" style={{ gridTemplateColumns: `repeat(${w.stats.length}, minmax(0,1fr))` }}>
                        {w.stats.map((s) => <div key={s.k}><div className="ax-t11">{s.k}</div><b>{s.v}</b></div>)}
                      </div>
                    )}
                    <p className="ax-p"><b style={{ color: "var(--x-ink)", fontWeight: 600 }}>My version: </b>{w.use}</p>
                    <div className="ax-ft">
                      <a className="ax-src" href={w.url} target="_blank" rel="noopener noreferrer">Source ↗</a>
                      <span style={{ display: "flex", gap: 8 }}>
                        <button className="ax-btn s sm" type="button" onClick={() => open({ eb: `X-Ray · ${w.where}`, title: w.title, rows: w.rows.map(([k, v]) => (k === "Source" ? { k, v, href: v } : { k, v, box: k === "Why it works" || k === "My version" })), cta: { label: "Make my version", chip: w.makeChip } })}>X-Ray</button>
                        <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ chip: w.makeChip })}>Make my version</button>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 22 }}>
              <Empty
                title={data.nicheOn ? "I haven’t looked at your niche yet" : "Niche research isn’t switched on yet"}
                text={data.nicheOn ? "I read what businesses like yours post on Instagram, TikTok and Facebook, and what rivals advertise, then show you what works with a link to each post." : "It needs our research service, which isn’t set up on this account yet. Your ideas, page gaps and competitors below still work."}
                act={data.nicheOn ? { label: "Look now", topic: "niche", primary: true } : null}
              />
            </div>
          )}
          {data.working.length > 4 && <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}><button className="ax-btn s" type="button" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${data.working.length}`}</button></div>}
          {data.trends.length > 0 && (
            <>
              <div className="ax-h2"><div><h2>Timely this week</h2><p>From a live web search. Each one links to where I found it.</p></div></div>
              <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
                {data.trends.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}><b style={{ fontSize: 15 }}>{t.title}</b><div className="ax-p" style={{ marginTop: 3 }}>{t.why}</div></div>
                    {t.when && <span className="ax-pill n">{t.when}</span>}
                    <a className="ax-src" href={t.url} target="_blank" rel="noopener noreferrer">Source ↗</a>
                  </div>
                ))}
              </section>
            </>
          )}
        </>
      )}

      {tab === "i" && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 22 }}>
          {data.ideas.length ? (
            <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
              {data.ideas.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}><span className="ax-pill n">{h.kind}</span>{h.src && <span className="ax-t11" style={{ alignSelf: "center" }}>{h.src}</span>}</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{h.text}</div>
                    {h.why && <div className="ax-p" style={{ marginTop: 4 }}>{h.why}</div>}
                  </div>
                  {h.chip && <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ chip: h.chip })}>Write it</button>}
                </div>
              ))}
            </section>
          ) : (
            <Empty title="No ideas from your numbers yet" text="Once a week I compare your Google searches, visits and AI answers with your competitors, and suggest what to make next." act={{ label: "Look at my numbers", topic: "insights", primary: true }} />
          )}
          <div>
            <div className="ax-h2" style={{ marginTop: 8 }}><div><h2>Hooks for your ads</h2><p>Opening lines from your ad plan, checked for claims I can back up.</p></div>{data.strategyAt && <a className="ax-src" href="/dashboard/ad-strategy">Open the full plan</a>}</div>
            {data.hooks.length ? (
              <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>
                {data.hooks.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 0" }}>
                    <div style={{ flex: 1, minWidth: 0 }}><span className="ax-pill n" style={{ marginBottom: 6 }}>{h.kind}</span><div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 6 }}>“{h.text}”</div></div>
                    <CopyButton text={h.text} />
                  </div>
                ))}
              </section>
            ) : (
              <Empty title="No ad plan yet" text="Your ad plan has the hooks, scripts and budget split, built from what your competitors run." act={{ label: "Make my ad plan", topic: "adplan", primary: true }} />
            )}
          </div>
        </div>
      )}

      {tab === "g" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
          {data.gaps.length ? data.gaps.map((g, i) => (
            <article key={i} className="ax-card hv" style={{ padding: "20px 22px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}><span className={`ax-pill ${g.priority.startsWith("High") ? "b" : "n"}`}>{g.priority}</span><span className="ax-pill n">{g.where}</span></div>
                <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-.015em" }}>{g.title}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>{g.links.map((k) => <a key={k.url} className="ax-src" href={k.url} target="_blank" rel="noopener noreferrer">{k.label} ↗</a>)}</div>
              </div>
              <span style={{ display: "flex", gap: 8 }}>
                {g.outline.length > 0 && <button className="ax-btn s sm" type="button" onClick={() => open({ eb: "Page outline", title: g.title, rows: [...g.outline.map((x, n) => ({ k: `Section ${n + 1}`, v: x, box: true })), { k: "Why", v: `${g.where}. You don’t have a page on it yet.` }], cta: { label: "Draft it for me", chip: g.chip } })}>Outline</button>}
                <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ chip: g.chip })}>Draft it</button>
              </span>
            </article>
          )) : (
            <Empty title="No page gaps found yet" text="I compare your site with a competitor’s and list the topics they answer that you don’t." act={{ label: "Find them", href: "/dashboard/content-gaps", primary: true }} />
          )}
        </div>
      )}

      {tab === "c" && data.compGaps.length > 0 && (
        <section style={{ marginTop: 22, background: "rgba(0,113,227,.07)", border: "1px solid rgba(0,113,227,.18)", borderRadius: 18, padding: "16px 18px" }}>
          <div className="ax-eb" style={{ color: "var(--x-blue)", marginBottom: 6 }}>The gaps I’m taking, from what they advertise</div>
          {data.compGaps.map((g, i) => <div key={i} style={{ fontSize: 14, padding: "3px 0" }}>{g}</div>)}
        </section>
      )}
      {tab === "c" && (
        data.comps.length ? (
          <div className="ax-g3" style={{ marginTop: 22 }}>
            {data.comps.map((c, i) => (
              <article key={i} className="ax-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><b style={{ fontSize: 16, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</b>{c.ads > 0 && <span className="ax-pill n">{c.ads} ad{c.ads === 1 ? "" : "s"} seen</span>}</div>
                {c.topAd && <div><div className="ax-eb" style={{ marginBottom: 4 }}>One of their ads</div><div style={{ fontSize: 14 }}>{c.topAd}</div></div>}
                {c.summary && <div className="ax-p">{c.summary}</div>}
                <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
                  {c.adUrl && <a className="ax-src" href={c.adUrl} target="_blank" rel="noopener noreferrer">Their ad ↗</a>}
                  {c.site && <a className="ax-src" href={c.site} target="_blank" rel="noopener noreferrer">Their site ↗</a>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 22 }}><Empty title="I’m not watching any competitors yet" text="I pick them up from the businesses the AIs name instead of you, or you can add them." act={{ label: "Add competitors", href: "/dashboard/competitors", primary: true }} /></div>
        )
      )}
      {node}
    </>
  )
}
