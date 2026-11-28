"use client"
// The ad plan, one thing at a time (Varun, 2026-11-25: "way too much cognitive load"), inside Ads
// (/dashboard/ads/plan, 2026-11-28). Top: three things to make first. Below: tabs that each hold
// one kind of thing. The budget tab is the same LimitCard as the Ads page. Fine print sits folded.
import { useState } from "react"
import type { AdStrategy, Script } from "@/lib/ad-strategy/types"
import { askAlphaa } from "@/lib/workspace/events"
import { Button, CopyButton, Glyph, List, ListRow, Pill, SectionHeader, Tabs } from "@/components/workspace/ui"
import { AdPreview } from "@/components/workspace/AdPreview"
import { LimitCard, type PlanInputs } from "@/components/workspace/LimitCard"
import "@/components/workspace/p3.css"

type Props = {
  s: AdStrategy
  images: Record<string, string>
  rules: { specs: [string, string][]; music: string[]; ai: string[]; legal: string[]; thresholds: { metric: string; kill: string; hold: string; scale: string }[]; testRules: string[] }
  page: string
  site: string | null
  budget: number | null
  inputs: PlanInputs
}
type Tab = "videos" | "lines" | "ads" | "budget"

const TYPE: Record<string, string> = { price_anchor: "Price next to the alternative", newness: "What’s new", confession: "Honest truth", curiosity: "Curiosity", bold_claim: "Plain, provable claim", reverse: "Reverse psychology", warning: "Warning", contrarian: "Against the grain" }

function Storyboard({ x }: { x: Script }) {
  return (
    <div className="x3-story">
      {x.scenes.map((c, i) => (
        <div key={i} className="x3-shot">
          <span className="x3-shot__t">{c.t}</span>
          <div>
            <div className="x3-shot__on">{c.onScreen}</div>
            <div className="ax-t11">{c.visual}</div>
            {c.vo && c.vo !== c.onScreen && <div className="ax-t11">Voice: “{c.vo}”</div>}
          </div>
        </div>
      ))}
      {x.hookSwaps.length > 0 && (
        <div className="x3-swaps">
          <div className="x3-k">Also test these openings</div>
          {x.hookSwaps.map((h) => <div key={h}>“{h}”</div>)}
        </div>
      )}
      {x.labels.length > 0 && <div className="ax-t11">Show “{x.labels.join("”, “")}” on screen where the scene is recreated.</div>}
    </div>
  )
}

export function AdPlanView({ s, images, rules, page, site, budget, inputs }: Props) {
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

  const byType = new Map<string, string[]>()
  for (const h of s.hooks ?? []) byType.set(h.type, [...(byType.get(h.type) ?? []), h.line])

  return (
    <div className="x3-col">
      <section className="ax-card x3-planhero">
        <div className="x3-k">Written {when}</div>
        <h2>{scripts.length + staticsCount} ads, ready to make</h2>
        <p className="ax-p">Start with these three this week. Everything else is below when you want more.</p>
        {(s.angles ?? []).length > 0 && <div className="x3-presets">{(s.angles ?? []).map((a) => <Pill key={a.name} tone="info" title={a.why}>{a.name}</Pill>)}</div>}
      </section>

      <div className="x3-start">
        {short && (
          <section className="ax-card x3-pad">
            <div className="x3-step"><span>1</span>Film this</div>
            <div className="x3-big">“{short.scenes[0]?.onScreen}”</div>
            <div className="ax-t11">{short.title} · {short.seconds}s · {short.format}</div>
            <div><Button size="sm" variant="undo" onClick={() => setHeroOpen(!heroOpen)}>{heroOpen ? "Hide the shots" : "See the shots"}</Button></div>
            {heroOpen && <Storyboard x={short} />}
          </section>
        )}
        {hero && (
          <section className="ax-card x3-pad">
            <div className="x3-step"><span>2</span>Post this ad</div>
            <AdPreview frame="meta" page={page} headline={hero.headline} primary={hero.primary} image={hero.imageId ? images[hero.imageId] : null} />
            <div><CopyButton text={`${hero.primary}\n\n${hero.headline}`} /></div>
          </section>
        )}
        {firstLines.length > 0 && (
          <section className="ax-card x3-pad">
            <div className="x3-step"><span>3</span>Test these openings</div>
            {firstLines.map((h) => <div key={h.line} className="x3-lineitem"><span>{h.line}</span><CopyButton text={h.line} /></div>)}
            <div className="ax-t11">Run 3 at a time. Swap the weakest every week or two.</div>
          </section>
        )}
      </div>

      <Tabs<Tab> label="Plan sections" value={tab} onChange={setTab} tabs={[
        { key: "videos", label: "Videos", count: scripts.length },
        { key: "lines", label: "Opening lines", count: s.hooks?.length ?? 0 },
        { key: "ads", label: "Static ads", count: staticsCount },
        { key: "budget", label: "Budget" },
      ]} />

      {tab === "videos" && (
        <div className="ax-card x3-vids">
          {scripts.map((x, i) => (
            <div key={i} className={`x3-vid${open === i ? " open" : ""}`}>
              <button type="button" className="x3-vid__h" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span className="x3-vid__len">{x.seconds}s</span>
                <span className="x3-vid__main"><b>{x.title}</b><small>“{x.scenes[0]?.onScreen ?? ""}”</small></span>
                <span className="x3-vid__chev" aria-hidden="true"><Glyph name="down" size={16} /></span>
              </button>
              {open === i && <Storyboard x={x} />}
            </div>
          ))}
        </div>
      )}

      {tab === "lines" && (
        <div className="x3-col">
          {Array.from(byType.entries()).slice(0, allLines ? undefined : 3).map(([type, lines]) => (
            <section key={type} className="ax-card x3-pad">
              <div className="x3-k">{TYPE[type] ?? "Opening lines"}</div>
              {lines.map((l) => <div key={l} className="x3-lineitem"><span>{l}</span><CopyButton text={l} /></div>)}
            </section>
          ))}
          {!allLines && byType.size > 3 && <div><Button onClick={() => setAllLines(true)}>Show all {s.hooks?.length} lines</Button></div>}
        </div>
      )}

      {tab === "ads" && (
        <div className="x3-col">
          <div className="x3-adlist">
            {(s.statics?.meta ?? []).map((m, i) => (
              <article key={i} className="ax-card x3-adcard">
                <AdPreview frame="meta" page={page} headline={m.headline} primary={m.primary} image={m.imageId ? images[m.imageId] : null} footer={<CopyButton text={`${m.primary}\n\n${m.headline}`} />} />
              </article>
            ))}
            {(s.statics?.google.headlines.length ?? 0) > 0 && (
              <article className="ax-card x3-adcard">
                <AdPreview frame="google" page={page} site={site} headline={s.statics!.google.headlines.slice(0, 3).join(" | ")} primary={s.statics!.google.descriptions[0] ?? ""} footer={<CopyButton text={[...s.statics!.google.headlines, "", ...s.statics!.google.descriptions].join("\n")} />} />
                <div className="ax-t11">{s.statics!.google.headlines.length} headlines and {s.statics!.google.descriptions.length} descriptions. Google mixes them.</div>
              </article>
            )}
            {(s.statics?.linkedin ?? []).map((l, i) => (
              <article key={`li${i}`} className="ax-card x3-adcard">
                <AdPreview frame="linkedin" page={page} headline={l.headline} primary={l.intro} footer={<CopyButton text={`${l.intro}\n\n${l.headline}`} />} />
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "budget" && (
        <div className="x3-col">
          <LimitCard budget={budget} inputs={inputs} sticky={false} />
          <details className="ax-card x3-guard">
            <summary>When to pause, keep or scale an ad</summary>
            <ul className="x3-plain">{rules.testRules.map((r) => <li key={r}>{r}</li>)}</ul>
            <div className="ax-tblwrap">
              <table className="ax-tbl">
                <thead><tr><th>Measure</th><th>Pause</th><th>Keep testing</th><th>Scale</th></tr></thead>
                <tbody>{rules.thresholds.map((r) => <tr key={r.metric}><td>{r.metric}</td><td>{r.kill}</td><td>{r.hold}</td><td>{r.scale}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      <section>
        <SectionHeader title="Before you film" />
        <div className="ax-card x3-folds">
          <details className="x3-fold"><summary>Sizes, captions and pacing</summary><ul>{rules.specs.map(([k, v]) => <li key={k}><b>{k}:</b> {v}</li>)}</ul></details>
          <details className="x3-fold"><summary>Music you can use</summary><ul>{rules.music.map((r) => <li key={r}>{r}</li>)}</ul></details>
          <details className="x3-fold"><summary>Using AI safely</summary><ul>{rules.ai.map((r) => <li key={r}>{r}</li>)}</ul></details>
          <details className="x3-fold"><summary>Rules every ad follows</summary><ul>{[...rules.legal, ...(s.guardrails?.vertical ?? [])].map((r) => <li key={r}>{r}</li>)}</ul></details>
          {((s.competitors?.ads.length ?? 0) > 0 || s.competitors?.note) && (
            <details className="x3-fold"><summary>What your competitors run</summary>
              <ul>
                {(s.competitors?.ads.length ?? 0) > 0 && s.competitors!.ads[0].platform === "google" && <li>{s.competitors!.ads.length} Google search ads running now, from Google’s public ad library.</li>}
                {s.competitors!.cliches.map((c) => <li key={c}>They all: {c}</li>)}
                {s.competitors!.gaps.map((g) => <li key={g}>Nobody: {g}</li>)}
                {s.competitors?.note && <li>{s.competitors.note}</li>}
              </ul>
            </details>
          )}
        </div>
      </section>

      <List card label="Plan actions">
        <ListRow lead={<span className="xd-row__ic"><Glyph name="copy" size={16} /></span>} title="Save the full plan as a PDF" meta="Opens a print view in a new tab" end={<Button size="sm" href="/dashboard/ads/plan?print=1" external>Open</Button>} />
        <ListRow lead={<span className="xd-row__ic"><Glyph name="spark" size={16} /></span>} title="Write a fresh plan" meta="I read your competitors’ ads again and start over" onClick={() => askAlphaa({ topic: "adplan", label: "Write a fresh ad plan" })} />
      </List>
    </div>
  )
}
