"use client"

// Research → Keywords (lib/keywords/view.ts ← GET /api/workspace/keywords): every search the brand
// cares about, from its own data, with Google's numbers, as one sortable table (cards on phones).
// Volume ranges are shown as Google gives them. Rank colour by band (top 3 / page one / pages 2-3 /
// further). Searches for the business's own name sit folded under the table. "Draft it" = the
// DraftSheet (brief → page); "Add to topic plan" (row menu) pins it for the next plan.
import { useEffect, useMemo, useRef, useState } from "react"
import type { KeywordRow, KeywordsView, KwSource } from "@/lib/keywords/view"
import type { MoveCard } from "@/lib/workspace/rivals"
import { toast } from "@/lib/workspace/events"
import { Button, DataTable, EmptyState, FilterPills, Glyph, Pill, Skeleton, When, type Column, type MenuItem, type Tone } from "./ui"
import { DraftSheet } from "./DraftSheet"
import "./keywords.css"

const LABEL: Record<KwSource, string> = { gsc: "Your Google searches", ai: "AI question", plan: "Topic plan", gap: "Competitor page", pin: "You picked it", idea: "Related search" }
type Filter = "all" | KwSource
const DIFF_TONE: Record<KeywordRow["tone"], Tone> = { g: "ok", a: "warn", r: "bad", n: "idle" }

const title = (s: string) => { const t = s.trim(); return t.charAt(0).toUpperCase() + t.slice(1) }

/** Your Google rank, coloured by band: 1-3 green, page one blue, pages 2-3 amber, further grey. */
export function rankTone(pos: number): Tone {
  const p = Math.max(1, Math.round(pos))
  return p <= 3 ? "ok" : p <= 10 ? "info" : p <= 30 ? "warn" : "idle"
}
const rankHint = (pos: number) => { const p = Math.max(1, Math.round(pos)); return p <= 3 ? "Top 3" : p <= 10 ? "Page one" : p <= 30 ? `Page ${Math.ceil(p / 10)}` : "Past page 3" }

export function KeywordsPanel({ autopilot, siteConnected }: { autopilot: boolean; siteConnected: boolean }) {
  const [v, setV] = useState<KeywordsView | null>(null)
  const [failed, setFailed] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [sheet, setSheet] = useState<MoveCard | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const polls = useRef(0)

  async function load() {
    const r = await fetch("/api/workspace/keywords").catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: KeywordsView } | null
    if (!r?.ok || !d?.view) return setFailed(true)
    setFailed(false)
    setV(d.view)
  }
  useEffect(() => { void load() }, [])
  // While Google's numbers are on their way, look again every 20 seconds (for up to 10 minutes).
  useEffect(() => {
    if (!v?.refreshing || polls.current >= 30) return
    const t = window.setTimeout(() => { polls.current++; void load() }, 20_000)
    return () => window.clearTimeout(t)
  }, [v])

  const main = useMemo(() => (v?.rows ?? []).filter((r) => !r.branded), [v])
  const branded = useMemo(() => (v?.rows ?? []).filter((r) => r.branded), [v])
  const counts = useMemo(() => {
    const c = new Map<KwSource, number>()
    for (const r of main) for (const s of r.sources) c.set(s, (c.get(s) ?? 0) + 1)
    return c
  }, [main])
  const rows = main.filter((r) => filter === "all" || r.sources.includes(filter))

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
    polls.current = 0
    const d = await post({ op: "refresh" }, "refresh")
    if (d) toast(d.started ? "I’m getting fresh numbers from Google. They show up here in about a minute." : "Your numbers are already fresh today.")
  }

  if (failed && !v) return <div className="ax-kw-top"><EmptyState icon={<Glyph name="globe" size={22} />} title="I couldn’t load your keywords" text="That’s on my side. Try again in a minute." actions={<Button onClick={() => void load()}>Try again</Button>} /></div>
  if (!v) return <div className="ax-kw-top ax-card ax-kw-sk" aria-busy="true" aria-label="Loading your searches"><Skeleton kind="row" rows={6} /></div>
  if (!v.rows.length) return <div className="ax-kw-top"><EmptyState icon={<Glyph name="globe" size={22} />} title="No searches to measure yet" text={v.notes[0]} bullets={["How many people search each one a month", "How hard page one is, and where you are now", "Which ones I’d write a page for"]} actions={<Button variant="primary" href="/dashboard/tracking">Connect Search Console</Button>} /></div>

  const waiting = v.refreshing
  const volumeCell = (r: KeywordRow) => r.volume === "Not measured yet"
    ? (waiting ? <Skeleton kind="line" width={70} /> : <span className="ax-kw-none">Not measured yet</span>)
    : <span className="ax-kw-vol">{r.volume}{r.trend === "up" ? <span className="ax-kw-tr up" title="Rising"> ↑</span> : r.trend === "down" ? <span className="ax-kw-tr down" title="Falling"> ↓</span> : null}</span>

  const columns: Column<KeywordRow>[] = [
    {
      key: "kw", label: "Search", sortable: true, value: (r) => r.text,
      render: (r) => (
        <div className="ax-kw-cell">
          <span className="ax-kw-t">{r.text}</span>
          <span className="ax-kw-tags">{r.pinned && <Pill tone="info">On your topic plan</Pill>}{r.sources.slice(0, 2).map((s) => <span key={s} className="ax-kw-src">{LABEL[s]}</span>)}{r.intent && <span className="ax-kw-src">{r.intent}</span>}</span>
        </div>
      ),
    },
    { key: "vol", label: "Searches a month", num: true, sortable: true, value: (r) => r.volumeN || null, render: volumeCell },
    { key: "diff", label: "Difficulty", sortable: true, value: (r) => r.difficulty, render: (r) => r.difficulty !== null ? <Pill tone={DIFF_TONE[r.tone]} title="How hard page one is, 0 to 100">{r.difficulty} · {r.difficultyLabel}</Pill> : waiting && r.volume === "Not measured yet" ? <Skeleton kind="line" width={60} /> : <span className="ax-kw-none">Not measured</span> },
    { key: "rank", label: "Your rank", num: true, sortable: true, value: (r) => r.position, render: (r) => r.position !== null ? <Pill tone={rankTone(r.position)} title={rankHint(r.position)}>#{Math.max(1, Math.round(r.position))}</Pill> : <span className="ax-kw-none">Not ranking</span> },
    { key: "seen", label: "Shown in 90 days", num: true, sortable: true, hideOnCards: true, value: (r) => r.impressions, render: (r) => r.impressions ? r.impressions.toLocaleString("en-US") : <span className="ax-kw-none">None</span> },
    { key: "act", label: <span className="sr-only">Draft</span>, render: (r) => <Button size="sm" onClick={() => setSheet({ id: "", title: title(r.text), topic: r.text, rival: "", rivalHost: "", signals: [], outline: [], score: 0, why: "" })}>Draft it</Button> },
  ]
  const menu = (r: KeywordRow): MenuItem[] => [
    r.pinned
      ? { label: "Take off my topic plan", onClick: () => void pin(r), disabled: busy === r.keyword }
      : r.sources.includes("plan")
        ? { label: "Already on your topic plan", disabled: true }
        : { label: "Add to my topic plan", hint: "My next plan gives it a page", onClick: () => void pin(r), disabled: busy === r.keyword },
    ...(r.bids ? [{ label: `Ads cost ${r.bids} a click`, disabled: true } as MenuItem] : []),
  ]

  const filters: Filter[] = ["all", ...(["gsc", "pin", "plan", "ai", "gap", "idea"] as KwSource[]).filter((k) => counts.get(k))]
  return (
    <div className="ax-kw-top">
      <div className="ax-kw-head">
        <FilterPills<Filter> label="Where the searches come from" scroll value={filter} onChange={setFilter} options={filters.map((f) => ({ value: f, label: f === "all" ? "All" : LABEL[f], count: f === "all" ? main.length : counts.get(f) }))} />
        {waiting
          ? <Pill tone="info" dot>Getting Google’s numbers, about a minute</Pill>
          : <Button size="sm" loading={busy === "refresh"} disabled={!v.canRefresh} title={v.canRefresh ? undefined : "Fresh today. I check again tomorrow."} onClick={() => void refresh()}>{v.canRefresh ? "Refresh numbers" : "Fresh today"}</Button>}
      </div>
      <p className="ax-kw-note">
        Searches a month from Google’s Keyword Planner{v.measuredAt ? <> · updated <When at={v.measuredAt} mode="ago" fallback="recently" /></> : null}. Difficulty is 0 to 100: how hard page one is.
      </p>
      <DataTable<KeywordRow>
        label="Your searches"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.keyword}
        rowMenu={menu}
        maxHeight={720}
        stickyFirst
        empty={<EmptyState title="Nothing in this group" text="Pick another filter above." />}
      />
      {branded.length > 0 && (
        <details className="ax-card ax-kw-brand">
          <summary>Searches for your own name ({branded.length})<span>People who already know you. I keep them apart so they don’t crowd your plan.</span></summary>
          <ul>{branded.map((r) => <li key={r.keyword}><span>{r.text}</span>{r.position !== null && <Pill tone={rankTone(r.position)}>#{Math.max(1, Math.round(r.position))}</Pill>}{r.impressions ? <span className="ax-kw-none">{r.impressions.toLocaleString("en-US")} shown</span> : null}</li>)}</ul>
        </details>
      )}
      {v.notes.length > 0 && <p className="ax-note">{v.notes.join(" ")}</p>}
      {sheet && <DraftSheet move={sheet} autopilot={autopilot} siteConnected={siteConnected} onClose={() => setSheet(null)} />}
    </div>
  )
}
