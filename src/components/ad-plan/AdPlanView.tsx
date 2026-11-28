"use client"
// The ad plan, one thing at a time (Varun, 2026-11-25: "way too much cognitive load").
// Top: three things to make first. Below: tabs that each hold one kind of thing.
// The fine print (specs, music, AI, legal) sits folded at the very bottom.
import { useState } from "react"
import Link from "next/link"
import type { AdStrategy, Script } from "@/lib/ad-strategy/types"

type Props = { s: AdStrategy; images: Record<string, string>; rules: { specs: [string, string][]; music: string[]; ai: string[]; legal: string[]; thresholds: { metric: string; kill: string; hold: string; scale: string }[]; testRules: string[] } }
type Tab = "videos" | "lines" | "ads" | "budget"

const TYPE: Record<string, string> = { price_anchor: "Price next to the alternative", newness: "What’s new", confession: "Honest truth", curiosity: "Curiosity", bold_claim: "Plain, provable claim", reverse: "Reverse psychology", warning: "Warning", contrarian: "Against the grain" }
const money = (n: number, cur: string) => `${cur === "CAD" ? "CA$" : "$"}${n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 })}`

function Copy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className="apv-copy" onClick={() => { void navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400) }}>
      {done ? "Copied" : label}
    </button>
  )
}

function Storyboard({ x }: { x: Script }) {
  return (
    <div className="apv-story">
      {x.scenes.map((c, i) => (
        <div key={i} className="apv-shot">
          <span className="apv-t">{c.t}</span>
          <div>
            <p className="apv-shot__text">{c.onScreen}</p>
            <p className="apv-shot__meta">{c.visual}</p>
            {c.vo && c.vo !== c.onScreen && <p className="apv-shot__meta">Voice: “{c.vo}”</p>}
          </div>
        </div>
      ))}
      {x.hookSwaps.length > 0 && (
        <div className="apv-swaps">
          <p className="apv-label">Also test these openings</p>
          {x.hookSwaps.map((h) => <p key={h}>“{h}”</p>)}
        </div>
      )}
      {x.labels.length > 0 && <p className="apv-note">Show “{x.labels.join("”, “")}” on screen where the scene is recreated.</p>}
    </div>
  )
}

function VideoRow({ x, open, onToggle }: { x: Script; open: boolean; onToggle: () => void }) {
  return (
    <div className={`apv-row ${open ? "apv-row--open" : ""}`}>
      <button type="button" className="apv-row__head" onClick={onToggle} aria-expanded={open}>
        <span className="apv-len">{x.seconds}s</span>
        <span className="apv-row__main">
          <span className="apv-row__title">{x.title}</span>
          <span className="apv-row__sub">“{x.scenes[0]?.onScreen ?? ""}”</span>
        </span>
        <span className="apv-chev" aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && <Storyboard x={x} />}
    </div>
  )
}

export function AdPlanView({ s, images, rules }: Props) {
  const scripts = s.scripts ?? []
  const short = scripts.find((x) => x.seconds <= 10) ?? scripts[0]
  const hero = s.statics?.meta.find((m) => m.imageId && images[m.imageId]) ?? s.statics?.meta[0]
  const firstLines = (s.hooks ?? []).slice(0, 3)
  const [tab, setTab] = useState<Tab>("videos")
  const [open, setOpen] = useState<number | null>(null)
  const [heroOpen, setHeroOpen] = useState(false)
  const [allLines, setAllLines] = useState(false)
  const staticsCount = (s.statics?.meta.length ?? 0) + (s.statics?.linkedin.length ?? 0) + (s.statics?.google.headlines.length ? 1 : 0)
  const when = new Date(s.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const t = s.testing

  const byType = new Map<string, string[]>()
  for (const h of s.hooks ?? []) byType.set(h.type, [...(byType.get(h.type) ?? []), h.line])

  return (
    <div className="apv">
      <style>{CSS}</style>

      <header className="apv-head">
        <p className="apv-eyebrow">Your ad plan · {when}</p>
        <h1>{scripts.length + staticsCount} ads, ready to make.</h1>
        <p className="apv-lede">Start with these three this week. Everything else is below when you want more.</p>
        <div className="apv-angles">
          {(s.angles ?? []).map((a) => <span key={a.name} className="apv-pill" title={a.why}>{a.name}</span>)}
        </div>
      </header>

      <section className="apv-start">
        {short && (
          <div className="apv-card">
            <p className="apv-step">1 · Film this</p>
            <p className="apv-big">“{short.scenes[0]?.onScreen}”</p>
            <p className="apv-muted">{short.title} · {short.seconds}s · {short.format}</p>
            <button type="button" className="apv-link" onClick={() => setHeroOpen(!heroOpen)}>{heroOpen ? "Hide the shots" : "See the shots"}</button>
            {heroOpen && <Storyboard x={short} />}
          </div>
        )}
        {hero && (
          <div className="apv-card">
            <p className="apv-step">2 · Post this ad</p>
            {hero.imageId && images[hero.imageId] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[hero.imageId]} alt={hero.imageHeadline} className="apv-img" />
            )}
            <p>{hero.primary}</p>
            <p className="apv-muted">{hero.headline}</p>
            <Copy text={`${hero.primary}\n\n${hero.headline}`} label="Copy the text" />
          </div>
        )}
        {firstLines.length > 0 && (
          <div className="apv-card">
            <p className="apv-step">3 · Test these openings</p>
            {firstLines.map((h) => (
              <div key={h.line} className="apv-line"><p>{h.line}</p><Copy text={h.line} /></div>
            ))}
            <p className="apv-muted">Run 3 at a time. Swap the weakest every 1–2 weeks.</p>
          </div>
        )}
      </section>

      <nav className="apv-tabs" role="tablist">
        {([["videos", `Videos · ${scripts.length}`], ["lines", `Opening lines · ${s.hooks?.length ?? 0}`], ["ads", `Static ads · ${staticsCount}`], ["budget", "Budget"]] as [Tab, string][]).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label}</button>
        ))}
      </nav>

      {tab === "videos" && (
        <section className="apv-list">
          {scripts.map((x, i) => <VideoRow key={i} x={x} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />)}
        </section>
      )}

      {tab === "lines" && (
        <section>
          {Array.from(byType.entries()).slice(0, allLines ? undefined : 3).map(([type, lines]) => (
            <div key={type} className="apv-group">
              <p className="apv-label">{TYPE[type] ?? type}</p>
              {lines.map((l) => <div key={l} className="apv-line"><p>{l}</p><Copy text={l} /></div>)}
            </div>
          ))}
          {!allLines && byType.size > 3 && <button type="button" className="apv-link" onClick={() => setAllLines(true)}>Show all {s.hooks?.length} lines</button>}
        </section>
      )}

      {tab === "ads" && (
        <section>
          <div className="apv-grid">
            {(s.statics?.meta ?? []).map((m, i) => (
              <div key={i} className="apv-ad">
                <p className="apv-ad__text">{m.primary}</p>
                {m.imageId && images[m.imageId] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[m.imageId]} alt={m.imageHeadline} className="apv-img apv-img--flat" />
                )}
                <div className="apv-ad__bar"><span>{m.headline}</span><Copy text={`${m.primary}\n\n${m.headline}`} /></div>
              </div>
            ))}
          </div>
          {(s.statics?.google.headlines.length ?? 0) > 0 && (
            <div className="apv-block">
              <p className="apv-label">Google search ad</p>
              <div className="apv-serp">
                <p className="apv-serp__ad">Sponsored</p>
                <p className="apv-serp__title">{s.statics!.google.headlines.slice(0, 3).join(" | ")}</p>
                <p>{s.statics!.google.descriptions[0]}</p>
              </div>
              <Copy text={[...s.statics!.google.headlines, "", ...s.statics!.google.descriptions].join("\n")} label={`Copy all ${s.statics!.google.headlines.length} headlines and ${s.statics!.google.descriptions.length} descriptions`} />
            </div>
          )}
          {(s.statics?.linkedin.length ?? 0) > 0 && (
            <div className="apv-block">
              <p className="apv-label">LinkedIn</p>
              {s.statics!.linkedin.map((l, i) => (
                <div key={i} className="apv-line"><p>{l.intro}<br /><span className="apv-muted">{l.headline}</span></p><Copy text={`${l.intro}\n\n${l.headline}`} /></div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "budget" && t && (
        <section>
          {t.monthly === null && (
            <div className="apv-card apv-card--wide">
              <p className="apv-big">Set your monthly ad budget.</p>
              <p className="apv-muted">I’ll split it across platforms and tell you how many ads it can test.</p>
              <Link href="/dashboard?ask=autopilot" className="apv-btn">Set my budget</Link>
            </div>
          )}
          <div className="apv-grid">
            {t.platforms.map((p) => (
              <div key={p.platform} className="apv-card">
                <p className="apv-step">{p.platform}</p>
                {p.monthly !== null && <p className="apv-big">{money(p.monthly, t.currency)}<span className="apv-muted"> /month</span></p>}
                {p.judge !== null && <p className="apv-muted">Enough to judge {p.judge} ad{p.judge === 1 ? "" : "s"} a month</p>}
                <p>{p.launch}</p>
              </div>
            ))}
          </div>
          <details className="apv-fold">
            <summary>When to pause, keep or scale an ad</summary>
            <ul>{rules.testRules.map((r) => <li key={r}>{r}</li>)}</ul>
            <div className="apv-scroll">
              <table>
                <thead><tr><th>Measure</th><th>Pause</th><th>Keep testing</th><th>Scale</th></tr></thead>
                <tbody>{rules.thresholds.map((r) => <tr key={r.metric}><td>{r.metric}</td><td>{r.kill}</td><td>{r.hold}</td><td>{r.scale}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </section>
      )}

      <section className="apv-fine">
        <p className="apv-label">Before you film</p>
        <details className="apv-fold"><summary>Sizes, captions and pacing</summary><ul>{rules.specs.map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}</ul></details>
        <details className="apv-fold"><summary>Music you can use</summary><ul>{rules.music.map((r) => <li key={r}>{r}</li>)}</ul></details>
        <details className="apv-fold"><summary>Using AI safely</summary><ul>{rules.ai.map((r) => <li key={r}>{r}</li>)}</ul></details>
        <details className="apv-fold"><summary>Rules every ad follows</summary><ul>{[...rules.legal, ...(s.guardrails?.vertical ?? [])].map((r) => <li key={r}>{r}</li>)}</ul></details>
        {((s.competitors?.ads.length ?? 0) > 0 || s.competitors?.note) && (
          <details className="apv-fold"><summary>What your competitors run</summary>
            <ul>
              {(s.competitors?.ads.length ?? 0) > 0 && s.competitors!.ads[0].platform === "google" && <li>{s.competitors!.ads.length} Google search ads running now, from Google’s Ads Transparency Center.</li>}
              {s.competitors!.cliches.map((c) => <li key={c}>They all: {c}</li>)}
              {s.competitors!.gaps.map((g) => <li key={g}>Nobody: {g}</li>)}
              {s.competitors?.note && <li>{s.competitors.note}</li>}
            </ul>
          </details>
        )}
      </section>

      <footer className="apv-foot">
        <a href="/dashboard/ad-strategy?print=1" target="_blank" rel="noopener" className="apv-link">Save the full plan as a PDF</a>
        <Link href="/dashboard?ask=adplan" className="apv-link">Write a fresh plan</Link>
      </footer>
    </div>
  )
}

const CSS = `
.apv{max-width:880px;margin:0 auto;padding:40px 16px 80px;color:var(--ag-fg,#1d1d1f)}
.apv p{margin:0}
.apv-head{margin-bottom:28px}
.apv-eyebrow{font-size:13px;color:var(--ag-muted,#6e6e73);margin-bottom:6px!important}
.apv h1{font-size:34px;line-height:1.1;font-weight:600;letter-spacing:-.02em;margin:0 0 8px}
.apv-lede{font-size:17px;color:var(--ag-muted,#6e6e73)}
.apv-angles{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.apv-pill{font-size:13px;padding:5px 12px;border-radius:999px;background:var(--ag-bg2,#f5f5f7);cursor:help}
.apv-start{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:40px}
@media (max-width:760px){.apv-start{grid-template-columns:1fr}}
.apv-card{background:var(--ag-card,#fff);border:1px solid var(--ag-line,#d2d2d7);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:10px}
.apv-card--wide{margin-bottom:12px}
.apv-step{font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ag-muted,#6e6e73)}
.apv-big{font-size:20px;line-height:1.25;font-weight:600;letter-spacing:-.01em}
.apv-muted{font-size:14px;color:var(--ag-muted,#6e6e73)}
.apv-label{font-size:13px;font-weight:600;color:var(--ag-muted,#6e6e73);margin-bottom:6px!important}
.apv-link{align-self:flex-start;background:none;border:0;padding:0;font:inherit;font-size:15px;text-decoration:underline;cursor:pointer;color:inherit}
.apv-btn{align-self:flex-start;background:var(--ag-btn,#000);color:var(--ag-btn-fg,#fff);border-radius:999px;padding:9px 18px;font-size:15px}
.apv-copy{flex:none;font-size:13px;border:1px solid var(--ag-line,#d2d2d7);background:var(--ag-card,#fff);color:inherit;border-radius:999px;padding:4px 12px;cursor:pointer;align-self:flex-start}
.apv-copy:hover{border-color:var(--ag-fg,#1d1d1f)}
.apv-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;border:1px solid var(--ag-line,#d2d2d7)}
.apv-img--flat{border-radius:0;border:0;border-top:1px solid var(--ag-line,#d2d2d7);border-bottom:1px solid var(--ag-line,#d2d2d7)}
.apv-line{display:flex;gap:12px;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--ag-line,#d2d2d7)}
.apv-line:last-child{border-bottom:0}
.apv-tabs{display:flex;gap:6px;overflow-x:auto;border-bottom:1px solid var(--ag-line,#d2d2d7);margin-bottom:20px}
.apv-tabs button{flex:none;background:none;border:0;font:inherit;font-size:15px;padding:10px 12px;color:var(--ag-muted,#6e6e73);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer}
.apv-tabs button.on{color:var(--ag-fg,#1d1d1f);border-bottom-color:var(--ag-fg,#1d1d1f);font-weight:600}
.apv-list{border-top:1px solid var(--ag-line,#d2d2d7)}
.apv-row{border-bottom:1px solid var(--ag-line,#d2d2d7)}
.apv-row__head{width:100%;display:flex;align-items:center;gap:14px;background:none;border:0;padding:14px 4px;text-align:left;font:inherit;color:inherit;cursor:pointer}
.apv-len{flex:none;width:44px;font-size:13px;font-weight:600;text-align:center;padding:4px 0;border-radius:8px;background:var(--ag-bg2,#f5f5f7)}
.apv-row__main{flex:1;min-width:0;display:flex;flex-direction:column}
.apv-row__title{font-weight:600}
.apv-row__sub{font-size:14px;color:var(--ag-muted,#6e6e73);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.apv-chev{flex:none;font-size:20px;color:var(--ag-muted,#6e6e73);width:20px;text-align:center}
.apv-story{display:flex;flex-direction:column;gap:12px;padding:4px 4px 18px 62px}
@media (max-width:600px){.apv-story{padding-left:4px}}
.apv-shot{display:flex;gap:12px}
.apv-t{flex:none;font-size:12px;color:var(--ag-muted,#6e6e73);width:54px;padding-top:3px}
.apv-shot__text{font-weight:600}
.apv-shot__meta{font-size:14px;color:var(--ag-muted,#6e6e73);margin-top:2px!important}
.apv-swaps{background:var(--ag-bg2,#f5f5f7);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
.apv-note{font-size:13px;color:var(--ag-muted,#6e6e73)}
.apv-group{margin-bottom:22px}
.apv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.apv-ad{border:1px solid var(--ag-line,#d2d2d7);border-radius:16px;overflow:hidden;background:var(--ag-card,#fff);display:flex;flex-direction:column}
.apv-ad__text{padding:12px 14px;font-size:15px}
.apv-ad__bar{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px;background:var(--ag-bg2,#f5f5f7);font-size:14px;font-weight:600;margin-top:auto}
.apv-block{margin-top:28px;display:flex;flex-direction:column;gap:10px}
.apv-serp{border:1px solid var(--ag-line,#d2d2d7);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;font-size:15px}
.apv-serp__ad{font-size:12px;font-weight:600}
.apv-serp__title{font-size:18px;text-decoration:underline}
.apv-fold{border-top:1px solid var(--ag-line,#d2d2d7);padding:14px 0}
.apv-fold summary{cursor:pointer;font-weight:600;list-style:none}
.apv-fold summary::after{content:"+";float:right;color:var(--ag-muted,#6e6e73)}
.apv-fold[open] summary::after{content:"−"}
.apv-fold ul{margin:12px 0 0;padding-left:20px;list-style:disc;display:flex;flex-direction:column;gap:6px;font-size:15px}
.apv-scroll{overflow-x:auto;margin-top:12px}
.apv-scroll table{width:100%;border-collapse:collapse;font-size:13px}
.apv-scroll th,.apv-scroll td{border-bottom:1px solid var(--ag-line,#d2d2d7);padding:8px 6px;text-align:left;vertical-align:top}
.apv-fine{margin-top:48px}
.apv-foot{display:flex;flex-wrap:wrap;gap:20px;margin-top:32px}
`
