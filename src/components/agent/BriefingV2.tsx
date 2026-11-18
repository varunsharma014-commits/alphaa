"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useUser } from "@clerk/nextjs"
import type { Briefing as BriefingData, InboxItem, LedgerItem } from "@/lib/agent/briefing"
import type { Chip } from "@/lib/agent/types"
import { AUTO_APPROVE_CHANGED, type AutoApproveChangedDetail } from "@/lib/auto-approve-text"
import { BriefingHero } from "./BriefingHero"
import { FirstAnswer } from "./FirstAnswer"
import { openAutoApprove } from "./AutoApproveModal"
import { TODAY_EVENT, TODAY_FOCUS, type RailGroup, type TodayDetail } from "./ToolsRailV2"

// Dashboard v2 home (lib/dash-v2.ts): one thing at a time. A headline with the real count,
// progress for today, ONE focus card, the rest as one-line rows, and everything I did folded
// into "What I did for you this week".

function greeting(name: string | null): string {
  const h = new Date().getHours()
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  return name ? `${part}, ${name}.` : `${part}.`
}
const plain = (md: string) => md.replace(/^#{1,6}\s*/gm, "").replace(/^-{3,}\s*$/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\n{3,}/g, "\n\n").trim()
const blanks = (t: string) => t.match(/\[[^\]]{2,}\]/g)?.length ?? 0
const lower = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)
const key = (i: InboxItem) => `${i.kind}-${i.id}`
const postTitle = (t: string) => t.replace(/^I wrote a new post for your website: /, "")

function groupOf(i: InboxItem): RailGroup {
  if (i.kind === "review") return "rp"
  if (i.kind === "gbp" || i.kind === "post" || i.kind === "social") return "mk"
  if (i.kind === "fix") return i.id === "insights" ? "rs" : i.id === "voice" ? "st" : "ws"
  return "st"
}
const GROUP_NAME: Record<RailGroup, string> = { mk: "Marketing", rs: "Results", rp: "Reputation", rc: "Research", ws: "Website", st: "Setup" }

function kicker(i: InboxItem): string {
  if (i.kind === "social") return "Marketing · Social"
  if (i.kind === "gbp") return "Marketing · Google listing"
  if (i.kind === "post") return "Marketing · Website"
  if (i.kind === "setup") return `Setup · Step ${i.step} of ${i.total}`
  return GROUP_NAME[groupOf(i)]
}

function focusTitle(i: InboxItem): string {
  if (i.kind === "review") return i.author && i.rating ? `Reply to ${i.author}’s ${i.rating}-star review` : i.title
  if (i.kind === "gbp") return "Post this update to your Google listing"
  if (i.kind === "post") return `Publish ${postTitle(i.title)} on your website`
  return i.title
}

function rowTitle(i: InboxItem): string {
  if (i.kind === "review") return i.author ? `Reply to ${i.author}’s review` : "Reply to a Google review"
  if (i.kind === "gbp") return "Post your Google listing update"
  if (i.kind === "post") return `Publish ${postTitle(i.title)}`
  return i.title
}

function why(i: InboxItem): string | null {
  if (i.kind === "review") return "People read how you answer reviews before they choose you."
  if (i.kind === "fix" && i.id === "facts") return "AI repeats what it reads. A clear correction on your site fixes it at the source."
  return null
}

function slot(iso: string | null): string {
  if (!iso) return "Not scheduled"
  const d = new Date(iso)
  return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
}

const APPROVALS = new Set(["review", "gbp", "post", "social"])

export function BriefingV2({ data, onShow, onChip }: { data: BriefingData; onShow: (topic: string, label: string) => void; onChip: (chip: Chip) => void }) {
  const { user } = useUser()
  const name = data.firstName ?? user?.firstName ?? null
  const [hello, setHello] = useState("")
  useEffect(() => setHello(greeting(name)), [name])

  const [queue, setQueue] = useState<InboxItem[]>(data.inbox)
  const total = data.inbox.length
  const [done, setDone] = useState<LedgerItem[]>([])
  const [approved, setApproved] = useState(0)
  const [autoOn, setAutoOn] = useState(!!data.autoApprove)
  const top = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const on = (e: Event) => setAutoOn(!!(e as CustomEvent<AutoApproveChangedDetail>).detail?.on)
    window.addEventListener(AUTO_APPROVE_CHANGED, on)
    const focus = () => top.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    window.addEventListener(TODAY_FOCUS, focus)
    return () => { window.removeEventListener(AUTO_APPROVE_CHANGED, on); window.removeEventListener(TODAY_FOCUS, focus) }
  }, [])

  // Tell the rail what's waiting ("Today 4", "Marketing 3 waiting").
  useEffect(() => {
    const groups: TodayDetail["groups"] = {}
    for (const i of queue) groups[groupOf(i)] = (groups[groupOf(i)] ?? 0) + (i.kind === "social" ? i.posts.length : 1)
    const social = queue.reduce((n, i) => n + (i.kind === "social" ? i.posts.length : 0), 0)
    const reviews = queue.filter((i) => i.kind === "review").length
    window.dispatchEvent(new CustomEvent<TodayDetail>(TODAY_EVENT, { detail: { total: queue.length, groups, social, reviews } }))
  }, [queue])

  const next = (item: InboxItem, result?: { text: string; url: string | null }) => {
    setQueue((q) => q.filter((x) => key(x) !== key(item)))
    if (result) {
      setApproved((n) => n + 1)
      if (result.text) setDone((d) => [{ text: result.text, href: result.url, at: new Date().toISOString() }, ...d])
    }
  }
  const bringUp = (item: InboxItem) => setQueue((q) => [item, ...q.filter((x) => key(x) !== key(item))])

  const remaining = queue.length
  const minutes = Math.max(1, Math.ceil(remaining * 0.75))
  const headline = total > 0 && remaining === 0
    ? "All done. Go run your business."
    : remaining === 0
      ? `Nothing needs you right now. I’m working on ${lower(data.nextUp.text)}.`
      : `${remaining} quick ${remaining === 1 ? "approval" : "approvals"} and your week is set. About ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`
  const current = total - remaining

  const ledger = useMemo(() => [...done, ...data.ledger], [done, data.ledger])

  return (
    <div className="v2-stage" ref={top}>
      <div className="v2-hello">{hello}<b>{headline}</b></div>

      {total > 0 && (
        <div className="v2-steps" aria-label="Today’s progress">
          {data.inbox.map((it, n) => <i key={key(it)} className={n < current ? "done" : n === current ? "on" : ""} />)}
          <span>{Math.min(current + 1, total)} of {total} for today</span>
        </div>
      )}

      {total > 0 && (remaining === 0 ? (
        <section className="v2-focus v2-done" aria-live="polite">
          <h2>Your week is set.</h2>
          <p>{approved > 0 ? "Everything you approved is going out. I’ll tell you the moment something new needs you." : "I’ll tell you the moment something new needs you."}</p>
        </section>
      ) : (
        <FocusCard key={key(queue[0])} item={queue[0]} autoOn={autoOn} onNext={next} onShow={onShow} onChip={onChip} />
      ))}

      {remaining > 1 && (
        <div className="v2-queue">
          <h3>Up next ({remaining - 1})</h3>
          {queue.slice(1).map((it) => (
            <div key={key(it)} className={`v2-row v2-k-${groupOf(it)}`}>
              <span className="v2-chip">{GROUP_NAME[groupOf(it)]}</span>
              <span className="v2-row__t">{rowTitle(it)}</span>
              <button type="button" className="v2-row__go" onClick={() => bringUp(it)}>Do it ›</button>
            </div>
          ))}
        </div>
      )}

      <details className="v2-more">
        <summary>What I did for you this week</summary>
        {ledger.length ? (
          <ul className="v2-more__list">
            {ledger.map((it, i) => (
              <li key={i}>
                <span>{it.text}</span>
                {it.href && <a href={it.href} target="_blank" rel="noopener">See it</a>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="v2-more__muted">My first full pass is running. Everything I do will be listed here.</p>
        )}
        <div className="v2-more__ai">
          <p>{data.headline} {data.rivalLine ?? ""}</p>
          <div className="ag-brief__lights" aria-label="Which AIs recommend you">
            {data.lights.map((l) => (
              <div key={l.engine} className={`ag-light ag-light--${l.light}`}>
                <span className="ag-light__dot" aria-hidden="true">{l.light === "yes" ? "✓" : l.light === "no" ? "" : "?"}</span>
                <span className="ag-light__name">{l.name}</span>
              </div>
            ))}
          </div>
          <p className="ag-brief__asof">I check all four again {new Date(data.nextCheck).toLocaleDateString("en-US", { weekday: "long" })}.</p>
        </div>
        <FirstAnswer />
        <BriefingHero />
        {data.milestones.length > 1 && (
          <ul className="ag-miles">
            {[...data.milestones].reverse().map((m) => (
              <li key={m.text}><span>★</span>{m.text}<time>{new Date(m.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></li>
            ))}
          </ul>
        )}
      </details>
    </div>
  )
}

function FocusCard({ item, autoOn, onNext, onShow, onChip }: {
  item: InboxItem
  autoOn: boolean
  onNext: (item: InboxItem, result?: { text: string; url: string | null }) => void
  onShow: (topic: string, label: string) => void
  onChip: (chip: Chip) => void
}) {
  const initial = item.kind === "review" || item.kind === "gbp" || item.kind === "post" ? item.text ?? "" : ""
  const [text, setText] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const missing = blanks(text)
  const g = groupOf(item)
  const w = why(item)

  async function approve(action: "publish" | "draft") {
    setBusy(true)
    setError(null)
    const res = await fetch("/api/agent/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: item.kind, id: item.id, action, ...(action === "publish" && text !== initial ? { text } : {}) }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as { error?: string; text?: string; url?: string | null } | undefined
    setBusy(false)
    if (!res?.ok) return setError(data?.error ?? "That didn’t go through. Nothing was published.")
    if (action === "draft") return setText(data?.text ?? "")
    const said = item.kind === "review" ? "Replied to a Google review" : item.kind === "gbp" ? "Posted an update to your Google listing" : item.kind === "post" ? `Published ${postTitle(item.title)}` : ""
    onNext(item, { text: said, url: data?.url ?? null })
  }

  async function approveSocial() {
    if (item.kind !== "social") return
    setBusy(true)
    setError(null)
    let failed = 0
    for (const p of item.posts) {
      const res = await fetch("/api/agent/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "approve", id: p.id }) }).catch(() => null)
      if (!res?.ok) failed++
    }
    setBusy(false)
    if (failed === item.posts.length) return setError("That didn’t go through. Nothing was scheduled.")
    if (failed) setError(`${failed} of them didn’t go through. Open the social posts to check.`)
    const n = item.posts.length - failed
    onNext(item, { text: n === 1 ? "Scheduled a social post" : `Scheduled ${n} social posts`, url: null })
  }

  async function skipSetup() {
    if (item.kind !== "setup") return
    await fetch("/api/agent/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "skip", step: item.id }) }).catch(() => null)
    onNext(item)
  }

  let actions: React.ReactNode
  if (item.kind === "social") {
    actions = <>
      <button className="v2-btn v2-btn--primary" disabled={busy} onClick={approveSocial}>{busy ? "Scheduling…" : item.posts.length === 1 ? "Approve it" : `Approve all ${item.posts.length}`}</button>
      <button className="v2-btn" disabled={busy} onClick={() => onShow("social", "Edit first")}>Edit first</button>
    </>
  } else if (item.kind === "fix") {
    actions = <>
      <button className="v2-btn v2-btn--primary" onClick={() => { onShow(item.topic, item.cta ?? "Show me the fix"); onNext(item) }}>{item.cta ?? "Show me the fix"}</button>
      <button className="v2-btn" onClick={() => onNext(item)}>Later</button>
    </>
  } else if (item.kind === "connect") {
    actions = <>
      <a className="v2-btn v2-btn--primary" href={item.href}>{item.cta}</a>
      <button className="v2-btn" onClick={() => onNext(item)}>Later</button>
    </>
  } else if (item.kind === "setup") {
    actions = <>
      {item.chip
        ? <button className="v2-btn v2-btn--primary" onClick={() => { onChip(item.chip!); if (item.chip!.action.type !== "link") onNext(item) }}>{item.chip.label}</button>
        : <button className="v2-btn v2-btn--primary" onClick={() => { onShow("setup", ""); onNext(item) }}>Show me</button>}
      <button className="v2-btn" onClick={() => void skipSetup()}>Later</button>
    </>
  } else if (!text) {
    actions = <button className="v2-btn v2-btn--primary" disabled={busy} onClick={() => approve("draft")}>{busy ? "I’m writing it…" : "Write my reply"}</button>
  } else if (missing > 0 && !editing) {
    actions = <button className="v2-btn v2-btn--primary" onClick={() => setEditing(true)}>{missing === 1 ? "Fill in 1 detail" : `Fill in ${missing} details`}</button>
  } else {
    const label = item.kind === "review" ? "Post reply" : item.kind === "gbp" ? "Post it" : "Publish it"
    actions = <>
      <button className="v2-btn v2-btn--primary" disabled={busy || !text.trim() || missing > 0} onClick={() => approve("publish")}>{busy ? "Publishing…" : editing ? "Save & publish" : label}</button>
      {!editing && <button className="v2-btn" disabled={busy} onClick={() => setEditing(true)}>Edit</button>}
    </>
  }

  return (
    <section className={`v2-focus v2-k-${g}`} aria-live="polite">
      <span className="v2-kicker">{kicker(item)}</span>
      <h2>{focusTitle(item)}</h2>

      {item.kind === "review" && item.quote && <p className="v2-quote">“{item.quote}”</p>}
      {item.kind === "post" && item.image && !editing && <img className="v2-postimg" src={item.image} alt="" />}

      {item.kind === "social" ? (
        <>
          <p>{item.text}</p>
          <div className="v2-posts">
            {item.posts.slice(0, 3).map((p) => (
              <div key={p.id} className="v2-post">
                {p.image ? <img src={p.image} alt="" loading="lazy" /> : <div className="v2-post__txt">{p.text}</div>}
                <div className="v2-post__cap">{slot(p.when)}<small>{p.where.join(" · ") || "No account yet"}</small></div>
              </div>
            ))}
          </div>
          {item.posts.length > 3 && <p className="v2-muted">And {item.posts.length - 3} more in your social posts.</p>}
        </>
      ) : item.kind === "fix" || item.kind === "connect" || item.kind === "setup" ? (
        <p>{item.text}</p>
      ) : editing ? (
        <textarea className="ag-inbox__edit" value={text} onChange={(e) => setText(e.target.value)} rows={Math.min(14, Math.max(4, Math.ceil(text.length / 60)))} autoFocus />
      ) : text ? (
        <div className={`v2-draft ${item.kind === "post" ? "v2-draft--clip" : ""}`}>{item.kind === "review" && <b>My reply: </b>}{item.kind === "post" ? plain(text) : text}</div>
      ) : (
        <p className="v2-muted">I haven’t written this one yet.</p>
      )}

      {missing > 0 && <p className="ag-inbox__need">{missing === 1 ? "One detail only you know is marked [like this]. Fill it in and it’s ready." : `${missing} details only you know are marked [like this]. Fill them in and it’s ready.`}</p>}
      <div className="v2-actions">{actions}</div>
      {error && <p className="ag-inbox__err">{error}</p>}
      {APPROVALS.has(item.kind) && !autoOn && (
        <button type="button" className="v2-autolink" onClick={() => openAutoApprove()}>Auto-approve and post from now on</button>
      )}
      {w && <div className="v2-why">{w}</div>}
    </section>
  )
}
