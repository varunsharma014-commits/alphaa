"use client"

// Research → Topic plan (lib/clusters.ts): each pillar topic as a card with its coverage
// ("4 of 7 written"), folded to its header so the page stays short; open one to see the pillar
// page first, then the supporting articles, each with where it came from (an AI question, a Google
// search, a competitor page, a service) and ONE action: planned = Draft it (the DraftSheet: brief →
// writer, linked to its pillar and live siblings), drafted = Open (the editor), live = ⋯ menu
// (Refresh this page = the page refresh sheet, Open the live page on the owner's own address).
import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { ArticleView, ClusterCard, ClusterSource, ClusterView } from "@/lib/cluster-rules"
import type { MoveCard } from "@/lib/workspace/rivals"
import { toast } from "@/lib/workspace/events"
import { Button, EmptyState, Glyph, Menu, Pill, Skeleton, When, type Tone } from "./ui"
import { DraftSheet } from "./DraftSheet"
import { RefreshSheet, type SheetReq } from "./SiteUpkeep"
import "./topic-plan.css"

const DraftEditor = dynamic(() => import("@/components/editor/DraftEditor").then((m) => m.DraftEditor), { ssr: false })

const STATUS: Record<ArticleView["status"], { label: string; tone: Tone }> = {
  published: { label: "Live", tone: "ok" },
  drafted: { label: "Drafted", tone: "info" },
  planned: { label: "Planned", tone: "idle" },
}
const KW_TONE: Record<string, Tone> = { g: "ok", a: "warn", r: "bad", n: "idle" }

/** The strongest real signal for one line under the title. */
function signal(a: ArticleView): string | null {
  const pick = (k: ClusterSource["kind"]) => a.sources.find((s) => s.kind === k && s.detail)
  const s = pick("gsc") ?? pick("ai") ?? pick("gap") ?? null
  if (!s) return null
  return s.kind === "gsc" ? `“${s.text}” · ${s.detail}` : s.kind === "ai" ? `Asked to AI: “${s.text}” · ${s.detail}` : s.detail
}

/** A live page on the owner's own address: path to show, link to open. */
function livePage(url: string, siteHost: string | null): { path: string; href: string } {
  try {
    const u = new URL(url)
    const path = `${u.pathname.replace(/\/+$/, "") || "/"}`
    return { path, href: siteHost ? `https://${siteHost}${u.pathname}` : url }
  } catch { return { path: url, href: url } }
}

export function TopicPlan({ view, autopilot, siteConnected, webPersonEmail, siteHost = null }: { view: ClusterView | null; autopilot: boolean; siteConnected: boolean; webPersonEmail: string | null; siteHost?: string | null }) {
  const [v, setV] = useState<ClusterView | null>(view)
  const [busy, setBusy] = useState(false)
  const [sheet, setSheet] = useState<{ move: MoveCard; cluster: { ref: string; pillar: string } } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [refresh, setRefresh] = useState<SheetReq | null>(null)
  // Open the topic that holds the next article; the rest stay folded.
  const nextId = useMemo(() => v?.next ? v.clusters.find((c) => c.pillar.ref === v.next!.ref || c.articles.some((a) => a.ref === v.next!.ref))?.id ?? null : null, [v])
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(nextId ? [nextId] : []))
  const toggle = (id: string) => setOpenIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

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
    if (busy) return <div className="ax-tp-list" aria-busy="true"><Skeleton kind="card" lines={2} /><Skeleton kind="card" lines={2} /></div>
    return (
      <div className="ax-tp-list">
        <EmptyState
          icon={<Glyph name="spark" size={22} />}
          title="No topic plan yet"
          text="I group the questions people ask AI, the Google searches you show up for, your competitors’ pages and your services into a few main topics."
          bullets={["A main guide for each topic", "The pages around it, linked to each other", "What’s written, what’s live and what I write next"]}
          actions={<Button variant="primary" loading={busy} onClick={() => void build()}>Make my topic plan</Button>}
        />
      </div>
    )
  }

  const total = v.clusters.reduce((n, c) => n + c.total, 0)
  const written = v.clusters.reduce((n, c) => n + c.written, 0)

  const row = (a: ArticleView, c: ClusterCard, repeated: Set<string>) => {
    const st = STATUS[a.status]
    const sig = signal(a)
    const live = a.liveUrl ? livePage(a.liveUrl, siteHost) : null
    return (
      <div key={a.id} className={`ax-tp-row${a.pillar ? " pillar" : ""}`}>
        <div className="ax-tp-main">
          <div className="ax-tp-tags">
            {a.pillar && <Pill tone="warn">Main guide</Pill>}
            <Pill tone={st.tone} dot>{st.label}</Pill>
            {[...new Set(a.sources.filter((s) => s.kind !== "page" && s.kind !== "draft").map((s) => s.label))].slice(0, 3).map((l) => <span key={l} className="ax-tp-src">{l}</span>)}
            {a.kw && a.kw.searches > 0 && <span className="ax-tp-src" title={`Google searches for “${a.kw.keyword}”`}>{a.kw.volume}</span>}
            {a.kw && a.kw.difficulty !== null && <Pill tone={KW_TONE[a.kw.tone] ?? "idle"} title="How hard it is to reach page one, 0 to 100">Difficulty {a.kw.difficulty}</Pill>}
          </div>
          <div className="ax-tp-t">{a.title}</div>
          {sig && !repeated.has(sig) && <div className="ax-tp-s">{sig}</div>}
          {live && <a className="ax-src mut ax-tp-url" href={live.href} target="_blank" rel="noopener noreferrer">{live.path} ↗</a>}
        </div>
        <div className="ax-tp-act">
          {a.status === "planned" && <Button size="sm" variant={v.next?.ref === a.ref ? "primary" : "secondary"} onClick={() => draft(a, c)}>Draft it</Button>}
          {a.status === "drafted" && a.openDraftId && <Button size="sm" onClick={() => setEditing(a.openDraftId)}>Open</Button>}
          {a.status === "published" && live && (
            <Menu label={`More for ${a.title}`} items={[{ label: "Refresh this page", hint: "I rewrite it with what’s new, you approve it", onClick: () => setRefresh({ op: "draft", url: a.liveUrl!, label: a.title }) }, { label: "Open the live page", onClick: () => window.open(live.href, "_blank", "noopener") }]} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ax-tp-wrap">
      <div className="ax-tp-head">
        <p className="ax-tp-sum">
          <b>{written} of {total}</b> pages written across {v.clusters.length} topic{v.clusters.length === 1 ? "" : "s"} · updated <When at={v.at} mode="ago" fallback="recently" />
        </p>
        <Button size="sm" loading={busy} onClick={() => void build()}>Refresh the plan</Button>
      </div>
      {v.next && (
        <section className="ax-card ax-move ax-tp-next">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ax-eb ax-tp-blue">Next up</div>
            <p className="t">{v.next.title}</p>
            <p className="s">Part of “{v.next.pillar}”. I write this one next.</p>
          </div>
          {(() => {
            const c = v.clusters.find((x) => x.pillar.ref === v.next!.ref || x.articles.some((a) => a.ref === v.next!.ref))
            const a = c && (c.pillar.ref === v.next!.ref ? c.pillar : c.articles.find((x) => x.ref === v.next!.ref))
            return c && a ? <Button variant="primary" onClick={() => draft(a, c)}>Draft it</Button> : null
          })()}
        </section>
      )}
      <div className="ax-tp-list">
        {v.clusters.map((c) => {
          const isOpen = openIds.has(c.id)
          const all = [c.pillar, ...c.articles]
          const sigs = all.map(signal).filter((x): x is string => !!x)
          const repeated = new Set(sigs.filter((x, i) => sigs.indexOf(x) !== i))
          const toWrite = c.total - c.written
          const pct = Math.round((c.written / Math.max(1, c.total)) * 100)
          return (
            <section key={c.id} className={`ax-card ax-tp${isOpen ? " open" : ""}`}>
              <button type="button" className="ax-tp-hd" aria-expanded={isOpen} aria-controls={`tp-${c.id}`} onClick={() => toggle(c.id)}>
                <div className="ax-tp-hd__b">
                  <h3>{c.title}</h3>
                  <p>{c.why}</p>
                </div>
                <div className="ax-tp-cov" aria-label={`${c.written} of ${c.total} written`}>
                  <span className="ax-tp-cov__t"><b>{c.written} of {c.total}</b> written</span>
                  <div className="ax-bar"><i style={{ width: `${pct}%` }} /></div>
                  <span className="ax-tp-badge">{c.live ? <Pill tone="ok">{c.live} live</Pill> : null}{toWrite ? <Pill tone="idle">{toWrite} to write</Pill> : <Pill tone="ok">All written</Pill>}</span>
                </div>
                <span className="ax-tp-chev" aria-hidden="true"><Glyph name="down" size={16} /></span>
              </button>
              {isOpen && (
                <div className="ax-tp-rows" id={`tp-${c.id}`}>
                  {[...repeated].slice(0, 2).map((x) => <p key={x} className="ax-tp-s ax-tp-shared">{x}</p>)}
                  {row(c.pillar, c, repeated)}
                  {c.articles.map((a) => row(a, c, repeated))}
                </div>
              )}
            </section>
          )
        })}
      </div>
      <p className="ax-note">Every page here comes from your own data: questions people ask AI, Google searches you show up for, your competitors’ pages and what you sell. Pages in a topic link to their main guide, and back. I update the plan once a week.</p>
      {sheet && <DraftSheet move={sheet.move} cluster={sheet.cluster} autopilot={autopilot} siteConnected={siteConnected} onClose={() => { setSheet(null); void reload() }} />}
      {editing && <DraftEditor draftId={editing} onClose={() => { setEditing(null); void reload() }} />}
      {refresh && <RefreshSheet req={refresh} autopilot={autopilot} webPersonEmail={webPersonEmail} onClose={() => { setRefresh(null); void reload() }} />}
    </div>
  )
}
