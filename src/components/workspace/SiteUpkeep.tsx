"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { DecayRow, LinkPage, LinkRow, Upkeep, UpkeepDraft } from "@/lib/seo/upkeep"
import { AI_NOTE, toast } from "@/lib/workspace/events"
import { When } from "./ui"

// Tracking & Setup → "Pages to refresh" (Search Console decay) and "Broken links" (site check).
// Each row has ONE action: write the refresh / fix the links → RefreshSheet (preview, why, what
// changed) → Publish update (or Autopilot's "Going out soon"), Undo after; a page the site's
// connection can't update goes to the web person instead.

export type SheetReq = { op: "draft" | "links" | "get"; url?: string; draftId?: string; label: string }

const LINK_KIND: Record<LinkRow["type"], string> = {
  broken_internal_link: "Broken link",
  broken_outbound_link: "Broken link to another site",
  redirect_chain: "Redirect chain",
}

export function SiteUpkeep({ data }: { data: Upkeep }) {
  const [sheet, setSheet] = useState<SheetReq | null>(null)
  const [checking, setChecking] = useState(false)

  async function checkSite() {
    setChecking(true)
    const res = await fetch("/api/crawl", { method: "POST" }).catch(() => null)
    setChecking(false)
    if (!res?.ok) return toast("The site check didn’t finish. Try again in a minute.")
    toast("Site checked")
    window.location.reload()
  }

  const draftAct = (d: UpkeepDraft | null, url: string, op: "draft" | "links", label: string, blocker: string | null) => {
    if (d?.status === "published") return <span className="ax-pill g">Updated</span>
    if (d?.status === "scheduled") return <button className="ax-btn s sm" type="button" onClick={() => setSheet({ op: "get", draftId: d.id, label })}>Going out soon</button>
    if (d) return <button className="ax-btn p sm" type="button" onClick={() => setSheet({ op: "get", draftId: d.id, label })}>Review the {op === "draft" ? "refresh" : "fix"}</button>
    return <button className={`ax-btn ${blocker ? "s" : "p"} sm`} type="button" onClick={() => setSheet({ op, url, label })}>{op === "draft" ? "Refresh this post" : "Fix the links"}</button>
  }

  const decayRow = (p: DecayRow) => (
    <div key={p.page} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 0", flexWrap: "wrap" }}>
      <span style={{ width: 9, height: 9, borderRadius: 999, background: p.lostClicks > 0 ? "#ff9500" : "#ffcc00", flex: "none", marginTop: 6 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <a href={p.page} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: "inherit", wordBreak: "break-all" }}>{p.path}</a>
        {p.ours && <span className="ax-pill n" style={{ marginLeft: 8 }}>I wrote it</span>}
        {p.evidence.map((e) => <div key={e} style={{ fontSize: 13, color: "var(--x-mut)", marginTop: 3 }}>{e}</div>)}
        {p.blocker && !p.draft && <div className="ax-t11" style={{ marginTop: 4 }}>{p.blocker} I’ll write it, then you can send it to your web person.</div>}
      </div>
      {draftAct(p.draft, p.page, "draft", p.path, p.blocker)}
    </div>
  )

  const byPage = new Map<string, LinkRow[]>()
  for (const it of data.links.items) for (const s of it.sources) byPage.set(s, [...(byPage.get(s) ?? []), it])
  const linkPage = (p: LinkPage) => {
    const rows = byPage.get(p.page) ?? []
    return (
      <div key={p.page} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 0", flexWrap: "wrap" }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: rows.some((r) => r.type !== "redirect_chain") ? "#ff3b30" : "#ffcc00", flex: "none", marginTop: 6 }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <a href={p.page} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, color: "inherit", wordBreak: "break-all" }}>{p.path}</a>
          {p.ours && <span className="ax-pill n" style={{ marginLeft: 8 }}>I wrote it</span>}
          {rows.slice(0, 6).map((r) => (
            <div key={`${r.type}|${r.target}`} style={{ fontSize: 13, color: "var(--x-mut)", marginTop: 3, wordBreak: "break-all" }}>
              <b style={{ fontWeight: 600, color: r.type === "redirect_chain" ? "var(--x-mut)" : "#c93400" }}>{LINK_KIND[r.type]}</b>{" "}
              {r.type === "redirect_chain" ? `${r.target} → ${r.hops} redirects → ${r.finalUrl ?? ""}` : `${r.target}${r.status ? ` (${r.status})` : " (no answer)"}`}
            </div>
          ))}
          {rows.length > 6 && <div className="ax-t11" style={{ marginTop: 3 }}>and {rows.length - 6} more</div>}
        </div>
        {draftAct(p.draft, p.page, "links", p.path, p.blocker)}
      </div>
    )
  }

  const g = data.gsc
  const l = data.links
  return (
    <>
      <div className="ax-h2" id="refresh">
        <div>
          <h2>Pages to refresh{g.pages.length ? ` (${g.pages.length})` : ""}</h2>
          <p>{g.span ? `Google Search Console, ${g.span}. ` : ""}I flag a page when it loses 30%+ of its clicks (at least 5) or impressions (at least 100), or drops 3+ places.</p>
        </div>
      </div>
      {!g.connected ? (
        <section className="ax-card ax-empty"><div style={{ flex: 1 }}><b>Connect Google Search Console</b><p>Then I compare every page’s Google clicks with the 4 weeks before and tell you which ones need a refresh.</p></div><Link className="ax-btn p sm" href="/dashboard/settings/integrations">Connect Google</Link></section>
      ) : !g.at ? (
        <p className="ax-note">Your first page-by-page comparison arrives with the next daily Search Console sync.</p>
      ) : g.pages.length ? (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>{g.pages.map(decayRow)}</section>
      ) : (
        <p className="ax-note">No page is losing Google traffic right now. I compared {g.checked} page{g.checked === 1 ? "" : "s"} (<When at={g.at} mode="ago" prefix="checked " fallback="checked recently" />).</p>
      )}

      <div className="ax-h2" id="links">
        <div>
          <h2>Links to fix{l.pages.length ? ` (${l.items.length})` : ""}</h2>
          <p>{l.crawledAt ? <>From my last site check, <When at={l.crawledAt} mode="ago" fallback={l.crawledAt.slice(0, 10)} />{l.checked != null ? `: ${l.checked} links on your site and ${l.outboundChecked ?? 0} to other sites checked.` : "."}</> : "Dead links, links to other sites that stopped working, and links that bounce through several redirects."}</p>
        </div>
        <button className="ax-btn s sm" type="button" disabled={checking} onClick={() => void checkSite()}>{checking ? "Checking… (about a minute)" : "Check my site now"}</button>
      </div>
      {!l.crawledAt ? (
        <p className="ax-note">I haven’t checked your site’s links yet. “Check my site now” takes about a minute.</p>
      ) : l.checked == null ? (
        <p className="ax-note">My last site check ran before I started checking links. Run it again to see them.</p>
      ) : l.pages.length ? (
        <section className="ax-card ax-list" style={{ padding: "2px 22px" }}>{l.pages.map(linkPage)}</section>
      ) : (
        <p className="ax-note">Every link I checked works.</p>
      )}

      {sheet && <RefreshSheet req={sheet} autopilot={data.autopilot} webPersonEmail={data.webPersonEmail} onClose={(changed) => { setSheet(null); if (changed) window.location.reload() }} />}
    </>
  )
}

type View = {
  draftId: string
  title: string
  html: string
  excerpt: string
  status: string
  url: string
  changeId: string | null
  blocker: string | null
  refresh: { url: string; kind: "refresh" | "links"; evidence: string[]; changes: string[]; unverified: string[]; prevTitle: string }
}

const STEPS = ["Reading the page as it is now", "Checking what people search for and ask AI", "Updating it from your own facts", "Checking every number against your page"]

export function RefreshSheet({ req, autopilot, webPersonEmail, onClose }: { req: SheetReq; autopilot: boolean; webPersonEmail: string | null; onClose: (changed: boolean) => void }) {
  const [v, setV] = useState<View | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ text: string; changeId: string | null } | null>(null)
  const [handoff, setHandoff] = useState(false)
  const [email, setEmail] = useState(webPersonEmail ?? "")
  const [changed, setChanged] = useState(false)

  async function load() {
    setError(null)
    const t = req.op === "draft" ? window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000) : 0
    const res = await fetch("/api/workspace/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: req.op, url: req.url, draftId: req.draftId }) }).catch(() => null)
    if (t) window.clearInterval(t)
    const d = (await res?.json().catch(() => null)) as (View & { error?: string }) | null
    if (!res?.ok || !d?.draftId) return setError(d?.error ?? "That didn’t work just now. Try again in a minute.")
    setV(d)
    if (req.op !== "get") setChanged(true)
    if (d.status === "published") setDone({ text: `Live on your site: ${d.url}`, changeId: d.changeId })
  }
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(changed) }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [busy, changed, onClose])

  async function act(op: "publish" | "schedule") {
    if (!v) return
    setBusy(true)
    const res = await fetch("/api/workspace/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, draftId: v.draftId }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; url?: string | null; at?: string; changeId?: string | null } | null
    setBusy(false)
    if (!res?.ok) {
      toast(d?.error ?? "That didn’t go through. Nothing changed.")
      if (d?.error && /web person|only lets apps|isn’t in your|couldn’t find|needs updating/i.test(d.error)) setHandoff(true)
      return
    }
    setChanged(true)
    if (op === "schedule") {
      setDone({ text: `In “Going out soon”. It updates ${d?.at ? new Date(d.at).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "in 3 days"} unless you stop it.`, changeId: null })
      toast("Added to Going out soon")
    } else {
      setDone({ text: `Updated on your site: ${d?.url ?? v.url}`, changeId: d?.changeId ?? null })
      toast("Page updated")
    }
  }

  async function undo() {
    if (!done?.changeId) return
    setBusy(true)
    const res = await fetch("/api/connect/wp/undo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ changeId: done.changeId }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(false)
    if (!res?.ok) return toast(d?.error ?? "Couldn’t undo it.")
    setDone({ text: "Undone: the earlier version is back on your site.", changeId: null })
    toast("Undone")
  }

  async function send() {
    if (!v) return
    setBusy(true)
    const res = await fetch("/api/agent/handoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ what: "refresh", email, title: v.title, text: v.html, url: v.refresh.url }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(false)
    if (!res?.ok) return toast(d?.error ?? "The email didn’t send.")
    setDone({ text: `Sent to ${email}. Replies go to you.`, changeId: null })
    toast("Sent")
  }

  const blocked = !!v?.blocker || handoff
  const unverified = v?.refresh.unverified ?? []
  return (
    <>
      <div className="ax-bk" onClick={() => { if (!busy) onClose(changed) }} aria-hidden="true" />
      <aside className="ax-insp ax-sheet" role="dialog" aria-modal="true" aria-label={`Refresh: ${req.label}`}>
        <header>
          <div style={{ minWidth: 0 }}><div className="ax-eb">{v?.refresh.kind === "links" || req.op === "links" ? "Link fix" : "Refresh"} · same address, same page</div><h3>{v?.title ?? req.label}</h3></div>
          <button className="ax-x" type="button" aria-label="Close" onClick={() => onClose(changed)} disabled={busy}>✕</button>
        </header>
        <div className="bd">
          {!v && !error && (
            req.op === "draft" ? (
              <div className="ax-steps" aria-live="polite">
                {STEPS.map((s, i) => <div key={s} className={i < step ? "done" : i === step ? "now" : ""}><span className="mk" aria-hidden="true">{i < step ? "✓" : ""}</span>{s}</div>)}
                <p className="ax-t11" style={{ fontSize: 12.5 }}>This takes about a minute.</p>
              </div>
            ) : <p className="ax-note">Loading…</p>
          )}
          {error && <div className="box"><div className="v">{error}</div>{req.op !== "get" && <button className="ax-btn s sm" type="button" style={{ marginTop: 10 }} onClick={() => void load()}>Try again</button>}</div>}
          {v && (
            <>
              <div className="box">
                <div className="ax-eb" style={{ marginBottom: 6 }}>Address (unchanged)</div>
                <a className="ax-src v" href={v.refresh.url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>{v.refresh.url} ↗</a>
              </div>
              {v.refresh.evidence.length > 0 && (
                <div className="box"><div className="ax-eb" style={{ marginBottom: 6 }}>Why</div>{v.refresh.evidence.map((e) => <div key={e} className="v">{e}</div>)}</div>
              )}
              {v.refresh.changes.length > 0 && (
                <div className="box"><div className="ax-eb" style={{ marginBottom: 6 }}>What I changed</div><ul style={{ margin: 0, paddingLeft: 18 }}>{v.refresh.changes.map((c) => <li key={c} style={{ fontSize: 13.5, marginBottom: 3 }}>{c}</li>)}</ul>{v.title !== v.refresh.prevTitle && <div className="ax-t11" style={{ marginTop: 6 }}>Title was “{v.refresh.prevTitle}”.</div>}</div>
              )}
              {unverified.length > 0 && <p className="ax-note" style={{ marginTop: 0, color: "#c93400" }}>I couldn’t trace these numbers to your page or your facts: {unverified.join(", ")}. Check them before it goes out. (Autopilot won’t publish this one on its own.)</p>}
              {v.blocker && <p className="ax-note" style={{ marginTop: 0 }}>{v.blocker}</p>}
              {/* Server-sanitized article HTML (lib/seo/article-html.ts sanitizeArticle). */}
              <div className="ax-md" dangerouslySetInnerHTML={{ __html: v.html }} />
            </>
          )}
          <p className="ax-note" role="note" style={{ marginTop: 0 }}>{AI_NOTE} Undo puts the earlier version back.</p>
        </div>
        <footer>
          {done ? (
            <>
              <span style={{ flex: 1, fontSize: 13, color: "var(--x-mut)", alignSelf: "center", wordBreak: "break-all" }}>{done.text}</span>
              {done.changeId && <button className="ax-btn s" type="button" disabled={busy} onClick={() => void undo()}>{busy ? "Undoing…" : "Undo"}</button>}
              <button className="ax-btn s" type="button" onClick={() => onClose(changed)}>Close</button>
            </>
          ) : !v ? (
            <button className="ax-btn s" type="button" onClick={() => onClose(changed)}>Close</button>
          ) : blocked ? (
            <>
              <input className="ax-input" type="email" placeholder="Your web person’s email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Web person’s email" style={{ flex: 1 }} />
              <button className="ax-btn p" type="button" disabled={busy || !/^\S+@\S+\.\S+$/.test(email)} onClick={() => void send()}>{busy ? "Sending…" : "Send it to my web person"}</button>
            </>
          ) : v.status === "scheduled" ? (
            <span style={{ flex: 1, fontSize: 13, color: "var(--x-mut)", alignSelf: "center" }}>In “Going out soon”. Stop it there if you change your mind.</span>
          ) : autopilot && !unverified.length ? (
            <button className="ax-btn p" type="button" disabled={busy} onClick={() => void act("schedule")}>{busy ? "Adding…" : "Add to Going out soon"}</button>
          ) : (
            <button className="ax-btn p" type="button" disabled={busy} onClick={() => void act("publish")}>{busy ? "Updating…" : "Publish update"}</button>
          )}
        </footer>
      </aside>
    </>
  )
}
