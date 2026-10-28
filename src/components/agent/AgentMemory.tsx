"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { RailData } from "@/lib/agent/feed"

// The agent's memory: what it knows about the business right now, so the
// owner never has to ask "how are we doing?". Replaces the old left menu.
// Visibility comes with the page (rail data); setup, connections and work
// load after the chat paints (/api/agent/memory).

type Memory = {

  work: { id: string; title: string; detail: string | null; at: string }[]
  health?: { label: string; ok: boolean | null; fix?: { topic: string } | { href: string } }[]
}

const ENGINES = ["ChatGPT", "Gemini", "Claude", "Perplexity"]

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function AgentMemory({ rail, open, onClose, onAsk }: { rail: RailData; open: boolean; onClose: () => void; onAsk: (topic: string, label: string) => void }) {
  const [mem, setMem] = useState<Memory | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open || mem || failed) return
    fetch("/api/agent/memory").then((r) => (r.ok ? r.json() : null)).then((m) => (m ? setMem(m) : setFailed(true))).catch(() => setFailed(true))
  }, [open, mem, failed])
  const pending = failed ? "Couldn’t load this just now." : null

  const waiting = rail.waiting.reviews + rail.waiting.posts

  return (
    <aside className={`ag-mem ${open ? "ag-mem--open" : ""}`} aria-label="What your agent knows" aria-hidden={!open}>
      <div className="ag-mem__head">
        <span>Business state</span>
        <button onClick={onClose} aria-label="Close">Close</button>
      </div>

      <section className="ag-mem__card">
        <div className="ag-mem__lbl">AI visibility</div>
        <div className="ag-mem__big">
          {rail.checked === 0 ? "—" : rail.named} <small>of 4 AIs name you</small>
        </div>
        <ul className="ag-mem__engines">
          {ENGINES.map((name, i) => {
            const s = rail.states[i] ?? "unknown"
            return (
              <li key={name}>
                <i className={s === "found" ? "ok" : s === "partial" ? "half" : s === "missing" ? "no" : ""} />
                {name}
                <span>{s === "found" ? "Names you" : s === "partial" ? "Sometimes" : s === "missing" ? "Not yet" : "Not checked"}</span>
              </li>
            )
          })}
        </ul>
        <div className="ag-mem__sub">Day {rail.dayNumber} of working for {rail.businessName}</div>
      </section>

      <section className="ag-mem__sec">
        <div className="ag-mem__lbl">Your setup</div>
        {!mem?.health ? (
          <p className="ag-mem__muted">{pending ?? "Checking…"}</p>
        ) : (
          <ul className="ag-health">
            {mem.health.map((h) => (
              <li key={h.label} className={h.ok === true ? "ok" : h.ok === false ? "bad" : "unk"}>
                <i aria-hidden="true">{h.ok === true ? "✓" : h.ok === false ? "✕" : "–"}</i>
                <span>{h.label}</span>
                {h.ok === false && h.fix ? (
                  "href" in h.fix ? (
                    <Link href={h.fix.href}>{/Website|Google|Bing/.test(h.label) ? "Connect" : "Fix"}</Link>
                  ) : (
                    <button onClick={() => onAsk((h.fix as { topic: string }).topic, `Fix: ${h.label}`)}>{/Bing/.test(h.label) ? "Connect" : "Fix"}</button>
                  )
                ) : h.ok === null ? (
                  <em>Not checked yet</em>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {waiting > 0 && (
        <section className="ag-mem__sec">
          <div className="ag-mem__lbl">Waiting for your yes</div>
          {rail.waiting.reviews > 0 && (
            <button className="ag-mem__row ag-mem__row--btn" onClick={() => onAsk("reviews", "Show me the reviews waiting for a reply")}>
              {rail.waiting.reviews} review {rail.waiting.reviews === 1 ? "reply" : "replies"} <span>Review →</span>
            </button>
          )}
          {rail.waiting.posts > 0 && (
            <button className="ag-mem__row ag-mem__row--btn" onClick={() => onAsk("content", "Show me the posts waiting for my approval")}>
              {rail.waiting.posts} {rail.waiting.posts === 1 ? "post" : "posts"} to approve <span>Review →</span>
            </button>
          )}
        </section>
      )}

      <section className="ag-mem__sec">
        <div className="ag-mem__lbl">Work I’ve done</div>
        {!mem ? (
          <p className="ag-mem__muted">{pending ?? "Loading…"}</p>
        ) : mem.work.length ? (
          <ol className="ag-mem__work">
            {mem.work.map((w) => (
              <li key={w.id}>
                <b>{w.title}</b>
                {w.detail && <span>{w.detail}</span>}
                <time>{ago(w.at)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ag-mem__muted">Nothing yet. My first full pass runs within a day.</p>
        )}
        <button className="ag-mem__more" onClick={() => onAsk("briefings", "What did you do this week?")}>Every week, in plain English →</button>
      </section>
    </aside>
  )
}
