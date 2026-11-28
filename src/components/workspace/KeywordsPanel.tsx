"use client"

// Research → Keywords (lib/keywords/view.ts ← GET /api/workspace/keywords): every search the brand
// cares about, from its own data, with Google's numbers. Volume ranges are shown as Google gives
// them. "Draft it" = the DraftSheet (brief → page); "Add to topic plan" pins it for the next plan.
import { useEffect, useMemo, useState } from "react"
import type { KeywordRow, KeywordsView, KwSource } from "@/lib/keywords/view"
import type { MoveCard } from "@/lib/workspace/rivals"
import { toast } from "@/lib/workspace/events"
import { Empty, When } from "./ui"
import { DraftSheet } from "./DraftSheet"
import "./keywords.css"

const LABEL: Record<KwSource, string> = { gsc: "Your Google searches", ai: "AI question", plan: "Topic plan", gap: "Competitor page", pin: "You picked it", idea: "Related search" }
type Filter = "all" | KwSource

const title = (s: string) => { const t = s.trim(); return t.charAt(0).toUpperCase() + t.slice(1) }

export function KeywordsPanel({ autopilot, siteConnected }: { autopilot: boolean; siteConnected: boolean }) {
  const [v, setV] = useState<KeywordsView | null>(null)
  const [failed, setFailed] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [more, setMore] = useState(false)
  const [sheet, setSheet] = useState<MoveCard | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const r = await fetch("/api/workspace/keywords").catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: KeywordsView } | null
    if (!r?.ok || !d?.view) return setFailed(true)
    setV(d.view)
  }
  useEffect(() => { void load() }, [])
  // While numbers are being fetched in the background, look again in a bit.
  useEffect(() => {
    if (!v?.refreshing) return
    const t = window.setTimeout(() => void load(), 25_000)
    return () => window.clearTimeout(t)
  }, [v])

  const counts = useMemo(() => {
    const c = new Map<KwSource, number>()
    for (const r of v?.rows ?? []) for (const s of r.sources) c.set(s, (c.get(s) ?? 0) + 1)
    return c
  }, [v])
  const rows = (v?.rows ?? []).filter((r) => filter === "all" || r.sources.includes(filter))
  const shown = more ? rows : rows.slice(0, 25)

  async function post(body: object, key: string) {
    setBusy(key)
    const r = await fetch("/api/workspace/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: KeywordsView; started?: boolean; error?: string } | null
    setBusy(null)
    if (!r?.ok || !d?.view) { toast(d?.error ?? "That didn’t work. Try again."); return null }
    setV(d.view)
    return d
  }
  async function pin(r: KeywordRow) {
    const d = await post({ op: r.pinned ? "unpin" : "pin", keyword: r.text }, r.keyword)
    if (d) toast(r.pinned ? "Taken off your topic plan list." : "Added. My next topic plan gives it a page.")
  }
  async function refresh() {
    const d = await post({ op: "refresh" }, "refresh")
    if (d) toast(d.started ? "I’m getting fresh numbers from Google. They show up here in a minute." : "Your numbers are already fresh today.")
  }

  if (failed) return <div style={{ marginTop: 22 }}><Empty title="I couldn’t load your keywords" text="Try again in a minute." /></div>
  if (!v) return <p className="ax-note" style={{ marginTop: 22 }}>Loading your searches…</p>
  if (!v.rows.length) return <div style={{ marginTop: 22 }}><Empty title="No searches to measure yet" text={v.notes[0]} act={{ label: "Connect Search Console", href: "/dashboard/tracking", primary: true }} /></div>

  const filters: Filter[] = ["all", ...(["gsc", "pin", "plan", "ai", "gap", "idea"] as KwSource[]).filter((k) => counts.get(k))]
  return (
    <>
      <div className="ax-kw-head">
        <div className="ax-kw-filters" role="tablist">
          {filters.map((f) => (
            <button key={f} type="button" className={filter === f ? "on" : ""} onClick={() => { setFilter(f); setMore(false) }}>
              {f === "all" ? `All ${v.rows.length}` : `${LABEL[f]} ${counts.get(f)}`}
            </button>
          ))}
        </div>
        <button className="ax-btn s sm" type="button" disabled={!v.canRefresh || busy === "refresh"} onClick={() => void refresh()}>
          {v.refreshing ? "Getting numbers…" : busy === "refresh" ? "Starting…" : "Refresh numbers"}
        </button>
      </div>
      <p className="ax-note" style={{ marginTop: 8 }}>
        Searches a month from Google’s Keyword Planner{v.measuredAt ? <> · updated <When at={v.measuredAt} mode="ago" fallback="recently" /></> : null}. Difficulty is 0 to 100: how hard page one is. I rank them by searches and how likely your site can win them.
      </p>
      <section className="ax-card ax-kw-list">
        {shown.map((r) => (
          <div key={r.keyword} className="ax-kw-row">
            <div className="ax-kw-main">
              <div className="ax-kw-t">{r.text}</div>
              <div className="ax-kw-tags">
                <span className={`ax-pill ${r.volumeN > 0 ? "b" : "n"}`}>{r.volume}{r.trend === "up" ? " · rising" : r.trend === "down" ? " · falling" : ""}</span>
                {r.difficulty !== null && <span className={`ax-pill ${r.tone}`}>Difficulty {r.difficulty} · {r.difficultyLabel}</span>}
                {r.intent && <span className="ax-pill n">{r.intent}</span>}
                {r.position !== null && <span className="ax-pill g">#{Math.max(1, Math.round(r.position))} on Google</span>}
                {r.sources.slice(0, 2).map((s) => <span key={s} className="ax-kw-src">{LABEL[s]}</span>)}
              </div>
              {(r.bids || r.impressions) && (
                <div className="ax-kw-score">
                  {[r.impressions ? `${r.impressions.toLocaleString("en-US")} times your site showed in 90 days` : null, r.bids ? `ads cost ${r.bids} a click` : null].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <div className="ax-kw-act">
              <button className="ax-btn s sm" type="button" disabled={busy === r.keyword} onClick={() => void pin(r)}>{r.pinned ? "On my topic plan ✓" : "Add to topic plan"}</button>
              <button className="ax-btn p sm" type="button" onClick={() => setSheet({ id: "", title: title(r.text), topic: r.text, rival: "", rivalHost: "", signals: [], outline: [], score: 0, why: "" })}>Draft it</button>
            </div>
          </div>
        ))}
      </section>
      {rows.length > 25 && <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}><button className="ax-btn s" type="button" onClick={() => setMore(!more)}>{more ? "Show fewer" : `Show all ${rows.length}`}</button></div>}
      {v.notes.map((n, i) => <p key={i} className="ax-note">{n}</p>)}
      {sheet && <DraftSheet move={sheet} autopilot={autopilot} siteConnected={siteConnected} onClose={() => setSheet(null)} />}
    </>
  )
}
