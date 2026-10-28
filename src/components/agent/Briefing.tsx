"use client"

import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import type { Briefing as BriefingData, InboxItem, LedgerItem } from "@/lib/agent/briefing"
import { BriefingHero } from "./BriefingHero"

// The morning briefing: am I winning, what's waiting for me, what did you do.
// Built for a time-poor owner on a phone: read it top to bottom in seconds,
// approve with one tap, close the app.

function greeting(name: string | null): string {
  const h = new Date().getHours()
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  return name ? `${part}, ${name}.` : `${part}.`
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  if (diff <= 0) return "Today"
  if (diff === 1) return "Yesterday"
  return d.toLocaleDateString("en-US", { weekday: "long" })
}

// Drafts are Markdown; the owner reads plain text.
const plain = (md: string) => md.replace(/^#{1,6}\s*/gm, "").replace(/^-{3,}\s*$/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\n{3,}/g, "\n\n").trim()
const blanks = (t: string) => t.match(/\[[^\]]{2,}\]/g)?.length ?? 0

function whenNext(iso: string): string {
  const d = new Date(iso)
  const day = dayLabel(iso)
  const diff = Math.round((new Date(d.toDateString()).getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000)
  if (diff <= 0) return d.getHours() < 12 ? "this morning" : d.getHours() < 18 ? "this afternoon" : "tonight"
  if (diff === 1) return "tomorrow"
  return day
}

const weekday = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "long" })

function asOfLabel(iso: string): string {
  const day = dayLabel(iso)
  return day === "Today" ? "today’s check" : day === "Yesterday" ? "yesterday’s check" : `${day}’s check`
}

export function Briefing({ data, onShow }: { data: BriefingData; onShow: (topic: string, label: string) => void }) {
  const [hello, setHello] = useState("")
  const [sharing, setSharing] = useState(false)
  const [inbox, setInbox] = useState<InboxItem[]>(data.inbox)
  const [done, setDone] = useState<LedgerItem[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const { user } = useUser()
  const name = data.firstName ?? user?.firstName ?? null

  useEffect(() => {
    setHello(greeting(name))
  }, [name])

  // "I'm on ChatGPT": a public, verified card the owner can post or text.
  async function share(engine: string) {
    setSharing(true)
    const win = window.open("", "_blank")
    const res = await fetch("/api/agent/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engine }) }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { id?: string } | null
    setSharing(false)
    if (data?.id && win) win.location.href = `/w/${data.id}`
    else win?.close()
  }

  const ledger = useMemo(() => [...done, ...data.ledger], [done, data.ledger])
  const days = useMemo(() => {
    const out: { label: string; items: LedgerItem[] }[] = []
    for (const it of ledger) {
      const label = dayLabel(it.at)
      const last = out[out.length - 1]
      if (last?.label === label) last.items.push(it)
      else out.push({ label, items: [it] })
    }
    return out
  }, [ledger])

  function finished(item: InboxItem, url: string | null) {
    setInbox((prev) => prev.filter((x) => !(x.kind === item.kind && x.id === item.id)))
    const text = item.kind === "review" ? "Replied to a Google review" : item.kind === "gbp" ? "Posted an update to your Google listing" : item.kind === "post" ? item.title.replace(/^I wrote a new post for your website: /, "Published ") : ""
    if (text) setDone((d) => [{ text, href: url, at: new Date().toISOString() }, ...d])
    setFlash("Done. It’s live.")
    window.setTimeout(() => setFlash(null), 2600)
  }

  const yes = data.lights.filter((l) => l.light === "yes").length
  const firstYes = data.lights.find((l) => l.light === "yes")

  return (
    <div className="ag-brief">
      <div>
        <p className="ag-brief__hello">{hello}</p>
        <p className="ag-brief__next">
          <span className="ag-dot ag-dot--live" aria-hidden="true" /> Next up: {data.nextUp.text.charAt(0).toLowerCase() + data.nextUp.text.slice(1)} · {whenNext(data.nextUp.at)}
        </p>
      </div>

      {/* The result: people AI sent them, and what that's worth */}
      <BriefingHero />

      {/* 1. Am I winning? */}
      <section className="ag-brief__head">
        <h1 className="ag-brief__headline">{data.headline}</h1>
        <div className="ag-brief__lights" aria-label={`${yes} of 4 AIs recommend you`}>
          {data.lights.map((l) => (
            <div key={l.engine} className={`ag-light ag-light--${l.light}`}>
              <span className="ag-light__dot" aria-hidden="true">{l.light === "yes" ? "✓" : l.light === "no" ? "" : "?"}</span>
              <span className="ag-light__name">{l.name}</span>
            </div>
          ))}
        </div>
        {firstYes && (
          <button type="button" className="ag-share" onClick={() => share(firstYes.engine)} disabled={sharing}>
            {sharing ? "Making your card…" : `Share it: “${firstYes.name} recommends us”`}
          </button>
        )}
        {(data.rivalLine || data.planLine) && (
          <p className="ag-brief__plan">
            {data.rivalLine} {data.planLine}
          </p>
        )}
        <p className="ag-brief__asof">
          {data.asOf ? `As of ${asOfLabel(data.asOf)}. ` : ""}I check all four again {weekday(data.nextCheck)}.
        </p>
      </section>

      {/* 2. What's holding you up? */}
      <section className="ag-brief__sec">
        {inbox.length === 0 ? (
          <p className="ag-brief__lead">{flash ?? "Nothing is waiting for you. I’ve got it from here."}</p>
        ) : (
          <>
            <p className="ag-brief__lead">
              {flash ? `${flash} ` : ""}
              {inbox.length === 1 ? "I have one thing waiting for your OK:" : `I have ${inbox.length} things waiting for your OK:`}
            </p>
            <InboxCard key={`${inbox[0].kind}-${inbox[0].id}`} item={inbox[0]} position={inbox.length > 1 ? `1 of ${inbox.length}` : null} onDone={finished} onShow={onShow} />
          </>
        )}
      </section>

      {/* 3. Are you actually working? */}
      <section className="ag-brief__sec">
        <p className="ag-brief__lead">{ledger.length ? "Here’s what I did for you this week:" : "My first full pass is running. Everything I do will be listed here."}</p>
        {days.map((d) => (
          <div key={d.label} className="ag-ledger">
            <div className="ag-ledger__day">{d.label}</div>
            <ul>
              {d.items.map((it, i) => (
                <li key={i}>
                  <span>{it.text}</span>
                  {it.href && <a href={it.href} target="_blank" rel="noopener">See it</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {data.milestones.length > 1 && (
        <section className="ag-brief__sec">
          <p className="ag-brief__lead">Milestones</p>
          <ul className="ag-miles">
            {[...data.milestones].reverse().map((m) => (
              <li key={m.text}><span>★</span>{m.text}<time>{new Date(m.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></li>
            ))}
          </ul>
        </section>
      )}

      {inbox.length === 0 && <p className="ag-brief__end">You’re all caught up. I’ll keep working while you get on with your day.</p>}
    </div>
  )
}

function InboxCard({ item, position, onDone, onShow }: { item: InboxItem; position: string | null; onDone: (item: InboxItem, url: string | null) => void; onShow: (topic: string, label: string) => void }) {
  const initial = item.kind === "review" || item.kind === "gbp" || item.kind === "post" ? item.text ?? "" : ""
  const [text, setText] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const missing = blanks(text)

  async function call(action: "publish" | "draft") {
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
    onDone(item, data?.url ?? null)
  }

  return (
    <div className="ag-inbox">
      <div className="ag-inbox__top">
        <b>{item.title}</b>
        {position && <span>{position}</span>}
      </div>
      {item.kind === "review" && item.quote && <blockquote className="ag-inbox__quote">“{item.quote}”</blockquote>}
      {item.kind === "post" && item.image && !editing && <img className="ag-inbox__img" src={item.image} alt="" />}

      {item.kind === "fix" || item.kind === "connect" ? (
        <p className="ag-inbox__text">{item.text}</p>
      ) : editing ? (
        <textarea className="ag-inbox__edit" value={text} onChange={(e) => setText(e.target.value)} rows={Math.min(14, Math.max(4, Math.ceil(text.length / 60)))} autoFocus />
      ) : text ? (
        <div className={`ag-inbox__text ${item.kind === "post" ? "ag-inbox__text--clip" : ""}`}>{item.kind === "post" ? plain(text) : text}</div>
      ) : (
        <p className="ag-inbox__text ag-inbox__text--muted">I haven’t written this one yet.</p>
      )}

      {missing > 0 && <p className="ag-inbox__need">{missing === 1 ? "One detail only you know is marked [like this]. Fill it in and it’s ready." : `${missing} details only you know are marked [like this]. Fill them in and it’s ready.`}</p>}
      <div className="ag-inbox__btns">
        {item.kind === "fix" ? (
          <button className="ag-btn-primary" onClick={() => onShow(item.topic, "Show me the fix")}>Show me the fix</button>
        ) : item.kind === "connect" ? (
          <a className="ag-btn-primary" href={item.href}>{item.cta}</a>
        ) : !text ? (
          <button className="ag-btn-primary" disabled={busy} onClick={() => call("draft")}>{busy ? "Writing…" : "Write my reply"}</button>
        ) : missing > 0 && !editing ? (
          <button className="ag-btn-primary" onClick={() => setEditing(true)}>{missing === 1 ? "Fill in 1 detail" : `Fill in ${missing} details`}</button>
        ) : (
          <>
            <button className="ag-btn-primary" disabled={busy || !text.trim() || missing > 0} onClick={() => call("publish")}>
              {busy ? "Publishing…" : editing ? "Save & publish" : "Approve & publish"}
            </button>
            {!editing && <button className="ag-btn-ghost" disabled={busy} onClick={() => setEditing(true)}>Edit</button>}
          </>
        )}
      </div>
      {error && <p className="ag-inbox__err">{error}</p>}
    </div>
  )
}
