"use client"

// Research → Topic plan (lib/clusters.ts): each pillar topic as a card with its coverage
// ("4 of 7 written"), the pillar page first, then the supporting articles, each with where it
// came from (an AI question, a Google search, a competitor page, a service) and ONE action:
// planned = Draft it (the DraftSheet: brief → writer, linked to its pillar and live siblings),
// drafted = Open (the editor), live = Refresh (the page refresh sheet).
import { useState } from "react"
import dynamic from "next/dynamic"
import type { ArticleView, ClusterCard, ClusterSource, ClusterView } from "@/lib/cluster-rules"
import type { MoveCard } from "@/lib/workspace/rivals"
import { toast } from "@/lib/workspace/events"
import { When } from "./ui"
import { DraftSheet } from "./DraftSheet"
import { RefreshSheet, type SheetReq } from "./SiteUpkeep"
import "./topic-plan.css"

const DraftEditor = dynamic(() => import("@/components/editor/DraftEditor").then((m) => m.DraftEditor), { ssr: false })

const STATUS: Record<ArticleView["status"], { label: string; tone: string }> = {
  published: { label: "Live", tone: "g" },
  drafted: { label: "Drafted", tone: "b" },
  planned: { label: "Planned", tone: "n" },
}

/** The strongest real signal for one line under the title. */
function signal(a: ArticleView): string | null {
  const pick = (k: ClusterSource["kind"]) => a.sources.find((s) => s.kind === k && s.detail)
  const s = pick("gsc") ?? pick("ai") ?? pick("gap") ?? null
  if (!s) return null
  return s.kind === "gsc" ? `“${s.text}” · ${s.detail}` : s.kind === "ai" ? `Asked to AI: “${s.text}” · ${s.detail}` : s.detail
}

export function TopicPlan({ view, autopilot, siteConnected, webPersonEmail }: { view: ClusterView | null; autopilot: boolean; siteConnected: boolean; webPersonEmail: string | null }) {
  const [v, setV] = useState<ClusterView | null>(view)
  const [busy, setBusy] = useState(false)
  const [sheet, setSheet] = useState<{ move: MoveCard; cluster: { ref: string; pillar: string } } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [refresh, setRefresh] = useState<SheetReq | null>(null)

  async function reload() {
    const r = await fetch("/api/workspace/clusters").catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: ClusterView | null } | null
    if (r?.ok && d) setV(d.view ?? null)
  }
  async function build() {
    setBusy(true)
    const r = await fetch("/api/workspace/clusters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "build" }) }).catch(() => null)
    const d = (await r?.json().catch(() => null)) as { view?: ClusterView | null; error?: string } | null
    setBusy(false)
    if (!r?.ok || !d?.view) return toast(d?.error ?? "I couldn’t plan your topics just now. Try again in a minute.")
    setV(d.view)
    toast("Topic plan updated")
  }

  function draft(a: ArticleView, c: ClusterCard) {
    const move: MoveCard = { id: a.gapId ?? "", title: a.title, topic: a.question ?? a.title, rival: "", rivalHost: a.competitor ?? "", signals: [], outline: [], score: 0, why: "" }
    setSheet({ move, cluster: { ref: a.ref, pillar: c.title } })
  }

  if (!v || !v.clusters.length) {
    return (
      <section className="ax-card ax-empty" style={{ marginTop: 22 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <b>No topic plan yet</b>
          <p>I group the questions people ask AI, the Google searches you show up for, your competitors’ pages and your services into a few main topics. Each gets a main guide and the pages around it, linked to each other.</p>
        </div>
        <button className="ax-btn p" type="button" disabled={busy} onClick={() => void build()}>{busy ? "Planning… (about a minute)" : "Make my topic plan"}</button>
      </section>
    )
  }

  const total = v.clusters.reduce((n, c) => n + c.total, 0)
  const written = v.clusters.reduce((n, c) => n + c.written, 0)
  const row = (a: ArticleView, c: ClusterCard) => {
    const st = STATUS[a.status]
    const sig = signal(a)
    return (
      <div key={a.id} className={`ax-tp-row${a.pillar ? " pillar" : ""}`}>
        <div className="ax-tp-main">
          <div className="ax-tp-tags">
            {a.pillar && <span className="ax-pill a">Main guide</span>}
            <span className={`ax-pill ${st.tone}`}>{st.label}</span>
            {[...new Set(a.sources.filter((s) => s.kind !== "page" && s.kind !== "draft").map((s) => s.label))].slice(0, 3).map((l) => <span key={l} className="ax-tp-src">{l}</span>)}
          </div>
          <div className="ax-tp-t">{a.title}</div>
          {sig && <div className="ax-tp-s">{sig}</div>}
          {a.liveUrl && <a className="ax-src mut" href={a.liveUrl} target="_blank" rel="noopener noreferrer">{a.liveUrl.replace(/^https?:\/\/(www\.)?/, "").slice(0, 70)} ↗</a>}
        </div>
        <div className="ax-tp-act">
          {a.status === "planned" && <button className="ax-btn p sm" type="button" onClick={() => draft(a, c)}>Draft it</button>}
          {a.status === "drafted" && a.openDraftId && <button className="ax-btn s sm" type="button" onClick={() => setEditing(a.openDraftId)}>Open</button>}
          {a.status === "published" && a.liveUrl && <button className="ax-btn s sm" type="button" onClick={() => setRefresh({ op: "draft", url: a.liveUrl!, label: a.title })}>Refresh</button>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 22 }}>
      <div className="ax-tp-head">
        <p className="ax-sub" style={{ margin: 0, flex: 1, minWidth: 220 }}>
          {v.clusters.length} topic{v.clusters.length === 1 ? "" : "s"} · {written} of {total} pages written · updated <When at={v.at} mode="ago" fallback="recently" />
        </p>
        <button className="ax-btn s sm" type="button" disabled={busy} onClick={() => void build()}>{busy ? "Planning…" : "Refresh the plan"}</button>
      </div>
      {v.next && (
        <section className="ax-card ax-move" style={{ marginTop: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ax-eb" style={{ color: "var(--x-blue)" }}>Next up</div>
            <p className="t">{v.next.title}</p>
            <p className="s">Part of “{v.next.pillar}”. My weekly run and my own blog posts write this one next.</p>
          </div>
          {(() => {
            const c = v.clusters.find((x) => x.pillar.ref === v.next!.ref || x.articles.some((a) => a.ref === v.next!.ref))
            const a = c && (c.pillar.ref === v.next!.ref ? c.pillar : c.articles.find((x) => x.ref === v.next!.ref))
            return c && a ? <button className="ax-btn p" type="button" onClick={() => draft(a, c)}>Draft it</button> : null
          })()}
        </section>
      )}
      <div className="ax-tp-list">
        {v.clusters.map((c) => (
          <section key={c.id} className="ax-card ax-tp">
            <header>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ax-eb">Topic</div>
                <h3>{c.title}</h3>
                <p>{c.why}</p>
              </div>
              <div className="ax-tp-cov" aria-label={`${c.written} of ${c.total} written`}>
                <span><b>{c.written} of {c.total}</b> written{c.live ? ` · ${c.live} live` : ""}</span>
                <div className="ax-bar"><i style={{ width: `${Math.round((c.written / Math.max(1, c.total)) * 100)}%` }} /></div>
              </div>
            </header>
            <div className="ax-tp-rows">
              {row(c.pillar, c)}
              {c.articles.map((a) => row(a, c))}
            </div>
          </section>
        ))}
      </div>
      <p className="ax-note">Every page here comes from your own data: questions people ask AI, Google searches you show up for, pages your competitors have and what you sell. Pages in one topic link to their main guide, and the main guide links back. I update the plan once a week.</p>
      {sheet && <DraftSheet move={sheet.move} cluster={sheet.cluster} autopilot={autopilot} siteConnected={siteConnected} onClose={() => { setSheet(null); void reload() }} />}
      {editing && <DraftEditor draftId={editing} onClose={() => { setEditing(null); void reload() }} />}
      {refresh && <RefreshSheet req={refresh} autopilot={autopilot} webPersonEmail={webPersonEmail} onClose={() => { setRefresh(null); void reload() }} />}
    </div>
  )
}
