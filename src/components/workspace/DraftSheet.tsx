"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { mdToHtml } from "@/lib/markdown"
import { gradeContent } from "@/lib/content-grade"
import { GradeCard } from "@/components/editor/GradeCard"
import { DRAFT_SAVED_EVENT, type DraftSavedDetail } from "@/components/editor/events"
import { AI_NOTE, askAlphaa, toast } from "@/lib/workspace/events"
import type { MoveCard } from "@/lib/workspace/rivals"

// "Draft it": a side sheet that writes a publish-ready page with the existing writer
// (/api/agent/draft, mode "post" → a post_draft row), shows it section by section, and ends
// with ONE action: Autopilot on = "Add to Going out soon" (publishes after the stop window);
// off = "Publish" (the usual approval path). No website connected = hand it to the web person.

type Draft = { title: string; text: string; excerpt: string | null; draftId: string; image: string | null }
// The saved editor (components/editor): edits autosave to the draft, and the saved text is what
// Publish / Add to Going out soon send.
const DraftEditor = dynamic(() => import("@/components/editor/DraftEditor").then((m) => m.DraftEditor), { ssr: false })
const STEPS = ["Planning the page from what they cover", "Writing it in your voice", "Adding the title and description Google shows", "Making the cover image"]

export function DraftSheet({ move, autopilot, siteConnected, onClose }: { move: MoveCard; autopilot: boolean; siteConnected: boolean; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [shown, setShown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const started = useRef(false)
  const grade = useMemo(() => (draft ? gradeContent(draft.text) : null), [draft])
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<DraftSavedDetail>).detail
      setDraft((cur) => (cur && d?.draftId === cur.draftId ? { ...cur, title: d.title, text: d.markdown } : cur))
    }
    window.addEventListener(DRAFT_SAVED_EVENT, h)
    return () => window.removeEventListener(DRAFT_SAVED_EVENT, h)
  }, [])

  async function write() {
    setError(null)
    setDraft(null)
    setStep(0)
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000)
    const res = await fetch("/api/agent/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: move.title, mode: "post", competitor: move.rivalHost }) }).catch(() => null)
    window.clearInterval(t)
    const d = (await res?.json().catch(() => null)) as (Partial<Draft> & { error?: string }) | null
    if (!res?.ok || !d?.text || !d.draftId) return setError(d?.error ?? "I couldn’t write that just now. Try again in a minute.")
    setDraft({ title: d.title ?? move.title, text: d.text, excerpt: d.excerpt ?? null, draftId: d.draftId, image: d.image ?? null })
  }
  useEffect(() => {
    if (started.current) return
    started.current = true
    void write()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reveal the page a section at a time, so it reads as it's written.
  const sections = draft ? draft.text.split(/\n(?=#{2,3}\s)/) : []
  useEffect(() => {
    if (!draft) return
    setShown(1)
    const t = window.setInterval(() => setShown((n) => { if (n >= sections.length) { window.clearInterval(t); return n } return n + 1 }), 350)
    return () => window.clearInterval(t)
  }, [draft, sections.length])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy && !editing) onClose() }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [busy, onClose, editing])

  async function act(op: "schedule" | "publish") {
    if (!draft) return
    setBusy(true)
    const res = await fetch("/api/workspace/site-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, draftId: draft.draftId }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; url?: string | null; at?: string } | null
    setBusy(false)
    if (!res?.ok) return toast(d?.error ?? "That didn’t go through. Nothing changed.")
    if (op === "schedule") {
      setDone(`In “Going out soon”. It goes live ${d?.at ? new Date(d.at).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "in 3 days"} unless you stop it.`)
      toast("Added to Going out soon")
    } else {
      setDone(d?.url ? `Live on your site: ${d.url}` : "Published to your site.")
      toast("Published")
    }
  }

  const metaTitle = draft ? (draft.title.length > 60 ? `${draft.title.slice(0, 57).trimEnd()}…` : draft.title) : ""
  const metaDesc = draft?.excerpt ? (draft.excerpt.length > 160 ? `${draft.excerpt.slice(0, 157).trimEnd()}…` : draft.excerpt) : null

  return (
    <>
      <div className="ax-bk" onClick={() => { if (!busy) onClose() }} aria-hidden="true" />
      <aside className="ax-insp ax-sheet" role="dialog" aria-modal="true" aria-label={`Draft: ${move.title}`}>
        <header>
          <div style={{ minWidth: 0 }}><div className="ax-eb">New page for your site · covers what {move.rival} covers, better</div><h3>{draft?.title ?? move.title}</h3></div>
          <button className="ax-x" type="button" aria-label="Close" onClick={onClose} disabled={busy}>✕</button>
        </header>
        <div className="bd">
          {!draft && !error && (
            <div className="ax-steps" aria-live="polite">
              {STEPS.map((s, i) => (
                <div key={s} className={i < step ? "done" : i === step ? "now" : ""}><span className="mk" aria-hidden="true">{i < step ? "✓" : ""}</span>{s}</div>
              ))}
              <p className="ax-t11" style={{ fontSize: 12.5 }}>This takes about half a minute.</p>
            </div>
          )}
          {error && (
            <div className="box"><div className="v">{error}</div><button className="ax-btn s sm" type="button" style={{ marginTop: 10 }} onClick={() => void write()}>Try again</button></div>
          )}
          {draft && (
            <>
              {draft.image && <img src={draft.image} alt="" />}
              <div className="box">
                <div className="ax-eb" style={{ marginBottom: 6 }}>What Google shows</div>
                <div style={{ color: "#1a0dab", fontSize: 16 }}>{metaTitle}</div>
                {metaDesc ? <div style={{ fontSize: 13, color: "var(--x-mut)", marginTop: 2 }}>{metaDesc}</div> : <div className="ax-t11">The description is written from the first paragraph.</div>}
              </div>
              <div className="ax-md">
                {sections.slice(0, shown).map((sec, i) => <div key={i} className="ax-reveal" dangerouslySetInnerHTML={{ __html: mdToHtml(sec, { highlightPlaceholders: true }) }} />)}
              </div>
              {/\[[^\]]{2,}\]/.test(draft.text) && <p className="ax-note" style={{ marginTop: 0 }}>The highlighted [brackets] are facts only you know. Fill them in before it goes out.</p>}
              {grade && !done && <GradeCard g={grade} compact onOpen={() => setEditing(true)} />}
            </>
          )}
          <p className="ax-note" role="note" style={{ marginTop: 0 }}>{AI_NOTE}</p>
        </div>
        <footer>
          {draft && !done && <button className="ax-btn s" type="button" disabled={busy} onClick={() => setEditing(true)} style={{ marginRight: "auto" }}>Edit</button>}
          {done ? (
            <><span style={{ flex: 1, fontSize: 13, color: "var(--x-mut)", alignSelf: "center" }}>{done}</span><button className="ax-btn s" type="button" onClick={onClose}>Close</button></>
          ) : !draft ? (
            <button className="ax-btn s" type="button" onClick={onClose}>Close</button>
          ) : /\[[^\]]{2,}\]/.test(draft.text) ? (
            <button className="ax-btn p" type="button" onClick={() => setEditing(true)}>Fill in the facts</button>
          ) : !siteConnected ? (
            <button className="ax-btn p" type="button" onClick={() => { onClose(); askAlphaa({ chip: { label: "Email it to my web person", action: { type: "handoff", what: "post", title: draft.title, text: draft.text, draftId: draft.draftId } } }) }}>Send it to my web person</button>
          ) : autopilot ? (
            <button className="ax-btn p" type="button" disabled={busy} onClick={() => void act("schedule")}>{busy ? "Adding…" : "Add to Going out soon"}</button>
          ) : (
            <button className="ax-btn p" type="button" disabled={busy} onClick={() => void act("publish")}>{busy ? "Publishing…" : "Publish"}</button>
          )}
        </footer>
      </aside>
      {editing && draft && <DraftEditor draftId={draft.draftId} onClose={() => setEditing(false)} />}
    </>
  )
}
