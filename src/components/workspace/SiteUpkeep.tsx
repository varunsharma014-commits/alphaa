"use client"

import { useEffect, useState } from "react"
import type { DecayRow, LinkPage, LinkRow, Upkeep, UpkeepDraft } from "@/lib/seo/upkeep"
import { AI_NOTE, toast } from "@/lib/workspace/events"
import { Button, EmptyState, Field, Glyph, List, ListRow, Pill, SectionHeader, Sheet, Skeleton, StatusDot, TextInput, When } from "./ui"
import "./p3.css"

// Tracking & Setup → Site health → "Links to fix" (site check) and "Pages losing Google traffic"
// (Search Console decay). Each row has ONE action: write the refresh / fix the links →
// RefreshSheet (preview, why, what changed) → Publish update (or Autopilot's "Going out soon"),
// Undo after; a page the site's connection can't update goes to the web person instead.

export type SheetReq = { op: "draft" | "links" | "get"; url?: string; draftId?: string; label: string }

const LINK_KIND: Record<LinkRow["type"], string> = {
  broken_internal_link: "Broken link",
  broken_outbound_link: "Broken link to another site",
  redirect_chain: "Bounces through redirects",
}
const short = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "")

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
    if (d?.status === "published") return <Pill tone="ok" dot>Updated</Pill>
    if (d?.status === "scheduled") return <Button size="sm" onClick={() => setSheet({ op: "get", draftId: d.id, label })}>Going out soon</Button>
    if (d) return <Button size="sm" variant="primary" onClick={() => setSheet({ op: "get", draftId: d.id, label })}>Review the {op === "draft" ? "refresh" : "fix"}</Button>
    return <Button size="sm" variant={blocker ? "secondary" : "primary"} onClick={() => setSheet({ op, url, label })}>{op === "draft" ? "Refresh this page" : "Fix the links"}</Button>
  }

  const decayRow = (p: DecayRow) => (
    <ListRow
      key={p.page}
      lead={<StatusDot tone="warn" label={p.lostClicks > 0 ? "Losing clicks" : "Losing reach"} />}
      title={<><a className="x3-path" href={p.page} target="_blank" rel="noopener noreferrer">{p.path}</a>{p.ours && <> <Pill tone="idle">I wrote it</Pill></>}</>}
      meta={<>
        {p.evidence.map((e) => <span key={e} className="x3-ev">{e}</span>)}
        {p.blocker && !p.draft && <span className="x3-ev">{p.blocker} I’ll write it, then you can send it to your web person.</span>}
      </>}
      end={draftAct(p.draft, p.page, "draft", p.path, p.blocker)}
      wrapEnd
    />
  )

  const byPage = new Map<string, LinkRow[]>()
  for (const it of data.links.items) for (const s of it.sources) byPage.set(s, [...(byPage.get(s) ?? []), it])
  const linkPage = (p: LinkPage) => {
    const rows = byPage.get(p.page) ?? []
    return (
      <ListRow
        key={p.page}
        lead={<StatusDot tone={rows.some((r) => r.type !== "redirect_chain") ? "bad" : "warn"} />}
        title={<><a className="x3-path" href={p.page} target="_blank" rel="noopener noreferrer">{p.path}</a>{p.ours && <> <Pill tone="idle">I wrote it</Pill></>}</>}
        meta={<>
          {rows.slice(0, 6).map((r) => (
            <span key={`${r.type}|${r.target}`} className="x3-ev">
              <b>{LINK_KIND[r.type]}:</b> {r.type === "redirect_chain" ? `${short(r.target)} goes through ${r.hops} redirects to ${short(r.finalUrl ?? "")}` : `${short(r.target)}${r.status ? ` (error ${r.status})` : " (no answer)"}`}
            </span>
          ))}
          {rows.length > 6 && <span className="x3-ev">and {rows.length - 6} more</span>}
        </>}
        end={draftAct(p.draft, p.page, "links", p.path, p.blocker)}
        wrapEnd
      />
    )
  }

  const g = data.gsc
  const l = data.links
  return (
    <>
      <section id="links">
        <SectionHeader
          title={`Links to fix${l.pages.length ? ` (${l.items.length})` : ""}`}
          sub={l.crawledAt ? <>From my last site check, <When at={l.crawledAt} mode="ago" fallback={l.crawledAt.slice(0, 10)} />{l.checked != null ? `: ${l.checked} links on your site and ${l.outboundChecked ?? 0} to other sites.` : "."}</> : "Dead links, links to other sites that stopped working, and links that bounce through several redirects."}
          end={<Button size="sm" loading={checking} onClick={() => void checkSite()}>{checking ? "Checking, about a minute" : "Check links now"}</Button>}
        />
        {!l.crawledAt ? (
          <p className="ax-note x3-flat">I haven’t checked your links yet. It takes about a minute.</p>
        ) : l.checked == null ? (
          <p className="ax-note x3-flat">My last site check ran before I started checking links. Run it again to see them.</p>
        ) : l.pages.length ? (
          <List card label="Pages with links to fix">{l.pages.map(linkPage)}</List>
        ) : (
          <div className="ax-card x3-banner"><StatusDot tone="ok" /><span>Every link I checked works, and none bounce through a chain of redirects.</span></div>
        )}
      </section>

      <section id="refresh">
        <SectionHeader
          title={`Pages losing Google traffic${g.pages.length ? ` (${g.pages.length})` : ""}`}
          sub={`${g.span ? `Google Search Console, ${g.span}. ` : ""}I flag a page when it loses 30% or more of its clicks or views, or drops 3 or more places.`}
        />
        {!g.connected ? (
          <EmptyState icon={<Glyph name="globe" size={22} />} title="Connect Google Search Console" text="Then I compare every page’s Google clicks with the 4 weeks before and tell you which ones need a refresh." actions={<Button variant="primary" href="/dashboard/settings/integrations">Connect Google</Button>} />
        ) : !g.at ? (
          <p className="ax-note x3-flat">Your first page by page comparison arrives with the next daily Search Console sync.</p>
        ) : g.pages.length ? (
          <List card label="Pages losing Google traffic">{g.pages.map(decayRow)}</List>
        ) : (
          <div className="ax-card x3-banner"><StatusDot tone="ok" /><span>No page is losing Google traffic right now. I compared {g.checked} page{g.checked === 1 ? "" : "s"} (<When at={g.at} mode="ago" prefix="checked " fallback="checked recently" />).</span></div>
        )}
      </section>

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
  const footer = done ? (
    <>
      <span className="x3-sheetnote">{done.text}</span>
      {done.changeId && <Button variant="undo" loading={busy} onClick={() => void undo()} icon={<Glyph name="undo" size={14} />}>Undo</Button>}
      <Button onClick={() => onClose(changed)}>Close</Button>
    </>
  ) : !v ? (
    <Button onClick={() => onClose(changed)}>Close</Button>
  ) : blocked ? (
    <>
      <span className="x3-sheetfield"><TextInput type="email" placeholder="Your web person’s email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Web person’s email" /></span>
      <Button variant="primary" loading={busy} disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={() => void send()}>Send it to my web person</Button>
    </>
  ) : v.status === "scheduled" ? (
    <span className="x3-sheetnote">In “Going out soon”. Stop it there if you change your mind.</span>
  ) : autopilot && !unverified.length ? (
    <Button variant="primary" loading={busy} onClick={() => void act("schedule")}>Add to Going out soon</Button>
  ) : (
    <Button variant="primary" loading={busy} onClick={() => void act("publish")}>Publish update</Button>
  )

  return (
    <Sheet open onClose={() => onClose(changed)} dismissible={!busy} wide eyebrow={`${v?.refresh.kind === "links" || req.op === "links" ? "Link fix" : "Refresh"} · same address, same page`} title={v?.title ?? req.label} footer={footer}>
      <div className="x3-col">
        {!v && !error && (
          req.op === "draft" ? (
            <div className="ax-steps" aria-live="polite">
              {STEPS.map((s, i) => <div key={s} className={i < step ? "done" : i === step ? "now" : ""}><span className="mk" aria-hidden="true">{i < step ? "✓" : ""}</span>{s}</div>)}
              <p className="ax-t11">This takes about a minute.</p>
            </div>
          ) : <Skeleton kind="card" lines={5} />
        )}
        {error && <EmptyState plain title="That didn’t work" text={error} actions={req.op !== "get" ? <Button onClick={() => void load()}>Try again</Button> : undefined} />}
        {v && (
          <>
            <Field label="Address (unchanged)"><TextInput readOnly value={v.refresh.url} /></Field>
            {v.refresh.evidence.length > 0 && <div><div className="x3-k">Why</div>{v.refresh.evidence.map((e) => <div key={e} className="x3-line">{e}</div>)}</div>}
            {v.refresh.changes.length > 0 && (
              <div>
                <div className="x3-k">What I changed</div>
                <ul className="x3-plain">{v.refresh.changes.map((c) => <li key={c}>{c}</li>)}</ul>
                {v.title !== v.refresh.prevTitle && <div className="ax-t11">Title was “{v.refresh.prevTitle}”.</div>}
              </div>
            )}
            {unverified.length > 0 && <p className="ax-note x3-flat x3-warn">I couldn’t trace these numbers to your page or your facts: {unverified.join(", ")}. Check them before it goes out. Autopilot won’t publish this one on its own.</p>}
            {v.blocker && <p className="ax-note x3-flat">{v.blocker}</p>}
            {/* Server-sanitized article HTML (lib/seo/article-html.ts sanitizeArticle). */}
            <div className="ax-md" dangerouslySetInnerHTML={{ __html: v.html }} />
          </>
        )}
        <p className="ax-note x3-flat" role="note">{AI_NOTE} Undo puts the earlier version back.</p>
      </div>
    </Sheet>
  )
}
