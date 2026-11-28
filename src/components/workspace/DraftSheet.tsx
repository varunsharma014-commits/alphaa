"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { hasPlaceholders } from "@/lib/brackets"
import { mdToHtml } from "@/lib/markdown"
import { gradeContent } from "@/lib/content-grade"
import { GradeCard } from "@/components/editor/GradeCard"
import { OriginalityCard } from "@/components/editor/OriginalityCard"
import type { OriginalityResult } from "@/lib/originality-rules"
import { DRAFT_SAVED_EVENT, type DraftSavedDetail } from "@/components/editor/events"
import { AI_NOTE, askAlphaa, toast } from "@/lib/workspace/events"
import type { MoveCard } from "@/lib/workspace/rivals"
import type { ContentBrief } from "@/lib/content-brief"
import { BriefView } from "./BriefView"
import { RepurposeButton } from "./RepurposeButton"
import { goLiveLabel, reviewMessage, useRole } from "./role"

// "Draft it": a side sheet that plans the page first (POST /api/agent/brief → lib/content-brief.ts:
// their real page, my own pages to link, the facts, the FAQ), then writes it from that brief
// (/api/agent/draft, mode "post" → a post_draft row), shows it section by section with the brief
// folded above it, and ends with ONE action: Autopilot on = "Add to Going out soon" (publishes
// after the stop window); off = "Publish" (the usual approval path). No website connected = hand it
// to the web person. Once live: "Repurpose" (lib/repurpose.ts).

type Draft = { title: string; text: string; excerpt: string | null; draftId: string; image: string | null; imageAlt: string | null; checks: { numbers: string; unverified: string[] } | null }
// The saved editor (components/editor): edits autosave to the draft, and the saved text is what
// Publish / Add to Going out soon send.
const DraftEditor = dynamic(() => import("@/components/editor/DraftEditor").then((m) => m.DraftEditor), { ssr: false })
const STEPS = ["Reading what their page covers", "Planning the outline from your site’s facts", "Writing it in your voice", "Checking every number against your facts", "Making the cover image"]

// `cluster`: a Topic plan article (lib/clusters.ts): the brief links it to its pillar + live siblings.
export function DraftSheet({ move, autopilot, siteConnected, onClose, cluster = null }: { move: MoveCard; autopilot: boolean; siteConnected: boolean; onClose: () => void; cluster?: { ref: string; pillar: string } | null }) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [brief, setBrief] = useState<ContentBrief | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [shown, setShown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [live, setLive] = useState(false)
  const [orig, setOrig] = useState<OriginalityResult | null>(null)
  const started = useRef(false)
  const role = useRole()
  const publisher = goLiveLabel(role, "") === ""
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
    const src = { ...(move.id ? { gapId: move.id } : {}), ...(move.rivalHost ? { competitor: move.rivalHost } : {}), ...(cluster ? { cluster: cluster.ref } : {}) }
    const post = (url: string, body: object) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
    // 1. The brief (best effort: without it the writer still works, just from the topic).
    let b = brief
    if (!b) {
      const t1 = window.setInterval(() => setStep((s) => Math.min(s + 1, 1)), 9000)
      const r = await post("/api/agent/brief", { topic: move.title, ...src })
      window.clearInterval(t1)
      b = ((await r?.json().catch(() => null)) as { brief?: ContentBrief } | null)?.brief ?? null
      if (b) setBrief(b)
    }
    setStep(2)
    // 2. The page, from the brief.
    const t2 = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 12000)
    const res = await post("/api/agent/draft", { topic: move.title, mode: "post", ...src, ...(b?.id ? { briefId: b.id } : {}) })
    window.clearInterval(t2)
    const d = (await res?.json().catch(() => null)) as (Partial<Draft> & { error?: string; brief?: ContentBrief | null }) | null
    if (!res?.ok || !d?.text || !d.draftId) return setError(d?.error ?? "I couldn’t write that just now. Try again in a minute.")
    if (!b && d.brief) setBrief(d.brief)
    setDraft({ title: d.title ?? move.title, text: d.text, excerpt: d.excerpt ?? null, draftId: d.draftId, image: d.image ?? null, imageAlt: d.imageAlt ?? null, checks: d.checks ?? null })
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
    const held = reviewMessage(d)
    if (held) { setDone(held); return toast(goLiveLabel(role, "Done") === "Send for review" ? "Sent for review" : "Approved") }
    if (op === "schedule") {
      setDone(`In “Going out soon”. It goes live ${d?.at ? new Date(d.at).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "in 3 days"} unless you stop it.`)
      toast("Added to Going out soon")
    } else {
      setDone(d?.url ? `Live on your site: ${d.url}` : "Published to your site.")
      setLive(true)
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
          <div style={{ minWidth: 0 }}><div className="ax-eb">{cluster ? `New page for your site · part of your topic plan: ${cluster.pillar}` : move.rival ? `New page for your site · from what ${move.rival}’s page really covers` : "New page for your site"}</div><h3>{draft?.title ?? move.title}</h3></div>
          <button className="ax-x" type="button" aria-label="Close" onClick={onClose} disabled={busy}>✕</button>
        </header>
        <div className="bd">
          {!draft && !error && (
            <div className="ax-steps" aria-live="polite">
              {STEPS.map((s, i) => (
                <div key={s} className={i < step ? "done" : i === step ? "now" : ""}><span className="mk" aria-hidden="true">{i < step ? "✓" : ""}</span>{s}</div>
              ))}
              <p className="ax-t11" style={{ fontSize: 12.5 }}>This takes about a minute: I read their page and yours first.</p>
            </div>
          )}
          {error && (
            <div className="box"><div className="v">{error}</div><button className="ax-btn s sm" type="button" style={{ marginTop: 10 }} onClick={() => void write()}>Try again</button></div>
          )}
          {draft && (
            <>
              {draft.image && <img src={draft.image} alt={draft.imageAlt ?? ""} />}
              {brief && <BriefView brief={brief} />}
              <div className="box">
                <div className="ax-eb" style={{ marginBottom: 6 }}>What Google shows</div>
                <div style={{ color: "#1a0dab", fontSize: 16 }}>{metaTitle}</div>
                {metaDesc ? <div style={{ fontSize: 13, color: "var(--x-mut)", marginTop: 2 }}>{metaDesc}</div> : <div className="ax-t11">The description is written from the first paragraph.</div>}
              </div>
              <div className="ax-md">
                {sections.slice(0, shown).map((sec, i) => <div key={i} className="ax-reveal" dangerouslySetInnerHTML={{ __html: mdToHtml(sec, { highlightPlaceholders: true }) }} />)}
              </div>
              {hasPlaceholders(draft.text) && <p className="ax-note" style={{ marginTop: 0 }}>The highlighted [brackets] are facts only you know{draft.checks?.numbers === "flagged" ? ", and [check: …] marks a number I couldn’t find in your facts" : ""}. Fill them in before it goes out.</p>}
              {draft.checks?.numbers === "removed" && <p className="ax-note" style={{ marginTop: 0 }}>I left out {draft.checks.unverified.length === 1 ? "a number" : "some numbers"} I couldn’t find on your site ({draft.checks.unverified.join(", ")}).</p>}
              {grade && !done && <GradeCard g={grade} compact onOpen={() => setEditing(true)} />}
              {!done && <OriginalityCard key={draft.draftId} draftId={draft.draftId} text={draft.text} compact autoCheck onState={setOrig} onRewritten={(d) => setDraft((cur) => (cur ? { ...cur, title: d.title, text: d.markdown } : cur))} />}
            </>
          )}
          <p className="ax-note" role="note" style={{ marginTop: 0 }}>{AI_NOTE}</p>
        </div>
        <footer>
          {draft && !done && <button className="ax-btn s" type="button" disabled={busy} onClick={() => setEditing(true)} style={{ marginRight: "auto" }}>Edit</button>}
          {done ? (
            <><span style={{ flex: 1, fontSize: 13, color: "var(--x-mut)", alignSelf: "center" }}>{done}</span>{live && draft && <RepurposeButton draftId={draft.draftId} small={false} label="Repurpose it" />}<button className="ax-btn s" type="button" onClick={onClose}>Close</button></>
          ) : !draft ? (
            <button className="ax-btn s" type="button" onClick={onClose}>Close</button>
          ) : orig?.blocked ? (
            <button className="ax-btn p" type="button" disabled title={orig.reason ?? undefined}>Held: rewrite the matching lines</button>
          ) : hasPlaceholders(draft.text) ? (
            <button className="ax-btn p" type="button" onClick={() => setEditing(true)}>Fill in the facts</button>
          ) : !siteConnected ? (
            <button className="ax-btn p" type="button" onClick={() => { onClose(); askAlphaa({ chip: { label: "Email it to my web person", action: { type: "handoff", what: "post", title: draft.title, text: draft.text, draftId: draft.draftId } } }) }}>Send it to my web person</button>
          ) : !publisher ? (
            <button className="ax-btn p" type="button" disabled={busy} onClick={() => void act("publish")}>{busy ? "Sending…" : goLiveLabel(role, "Publish")}</button>
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
