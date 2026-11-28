"use client"

// The saved editor for website/blog drafts (a post_draft row; lib/draft-versions.ts).
//   - Markdown with a formatting toolbar (headings, bold, link, lists) and a live preview
//     (lib/markdown.ts mdToHtml, the same renderer the publish path uses).
//   - Autosaves (debounced) to /api/workspace/drafts/[id]; that saved text is what every publish
//     and schedule path sends. A local copy covers a crash or a dropped connection.
//   - "Save version" (⌘S), publishes, AI rewrites and restores keep a version: History lists them
//     (when, who), shows a word diff against the current text, and restores one.
//   - The content score (lib/content-grade.ts) updates as you type. It informs, never blocks.
// Opened from Research "Draft it", the content thread ("Website posts & pages") and any chat
// doc block that carries a draftId.
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { mdToHtml } from "@/lib/markdown"
import { countPostWords, gradeContent } from "@/lib/content-grade"
import { diffStats, diffText } from "@/lib/text-diff"
import { GradeCard } from "./GradeCard"
import { OnPageCard } from "./OnPageCard"
import { OriginalityCard } from "./OriginalityCard"
import "./editor.css"

import { DRAFT_SAVED_EVENT, type DraftSavedDetail } from "./events"
export { DRAFT_SAVED_EVENT, type DraftSavedDetail }

type Draft = { id: string; title: string; markdown: string; excerpt: string | null; status: string; url: string | null; scheduledFor: string | null; rev: number; editedAt: string | null; editedBy: "owner" | "agent" | null; createdAt: string; image: string | null }
type Rev = { id: string; at: string; by: "owner" | "agent"; reason: "original" | "save" | "publish" | "ai_rewrite" | "restore"; title: string; words: number; restoredFrom: string | null; who?: string | null }
type SaveState = { k: "idle" } | { k: "dirty" } | { k: "saving" } | { k: "saved"; at: number } | { k: "note"; msg: string } | { k: "error"; msg: string } | { k: "conflict"; current: Draft }

const REASON: Record<Rev["reason"], string> = { original: "First draft", save: "Saved", publish: "Published", ai_rewrite: "AI rewrite", restore: "Restored" }
const AUTOSAVE_MS = 1200
// Links and numbered lists only get a button once the shared renderer (lib/markdown.ts, also what
// publishes) turns them into HTML; until then they'd go out as literal Markdown.
const RENDERS_LINKS = mdToHtml("[a](https://example.com)").includes("<a ")
const RENDERS_OL = mdToHtml("1. a\n2. b").includes("<ol")
const localKey = (id: string) => `alphaa:draft:${id}`
const phCount = (t: string) => (t.match(/\[[^\]]{2,}\](?!\()/g) ?? []).length

function when(iso: string | number) {
  const d = new Date(iso)
  const today = new Date()
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  if (d.toDateString() === today.toDateString()) return `Today ${time}`
  const y = new Date(today); y.setDate(today.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return `Yesterday ${time}`
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`
}

function readLocal(id: string): { markdown: string; title: string; rev: number } | null {
  try { const v = window.localStorage.getItem(localKey(id)); return v ? JSON.parse(v) : null } catch { return null }
}
function writeLocal(id: string, v: { markdown: string; title: string; rev: number } | null) {
  try { if (v) window.localStorage.setItem(localKey(id), JSON.stringify(v)); else window.localStorage.removeItem(localKey(id)) } catch { /* private mode */ }
}

// ── toolbar edits on the textarea (execCommand keeps the browser's own undo) ─────────────────
function replaceRange(ta: HTMLTextAreaElement, start: number, end: number, text: string, selStart: number, selEnd: number) {
  ta.focus()
  ta.setSelectionRange(start, end)
  let ok = false
  try { ok = document.execCommand("insertText", false, text) } catch { ok = false }
  if (!ok) {
    ta.setRangeText(text, start, end, "end")
    ta.dispatchEvent(new Event("input", { bubbles: true }))
  }
  ta.setSelectionRange(selStart, selEnd)
}

function wrapInline(ta: HTMLTextAreaElement, mark: string, placeholder: string) {
  const { value } = ta
  let { selectionStart: s, selectionEnd: e } = ta
  // Double-click selections often carry a trailing space: keep it outside the marks.
  while (s < e && /\s/.test(value[s])) s++
  while (e > s && /\s/.test(value[e - 1])) e--
  const sel = value.slice(s, e)
  if (sel && value.slice(s - mark.length, s) === mark && value.slice(e, e + mark.length) === mark) {
    replaceRange(ta, s - mark.length, e + mark.length, sel, s - mark.length, e - mark.length)
    return
  }
  const inner = sel || placeholder
  replaceRange(ta, s, e, `${mark}${inner}${mark}`, s + mark.length, s + mark.length + inner.length)
}

function insertLink(ta: HTMLTextAreaElement) {
  const { selectionStart: s, selectionEnd: e, value } = ta
  const sel = value.slice(s, e) || "link text"
  const isUrl = /^https?:\/\/\S+$/.test(sel)
  const text = isUrl ? `[link text](${sel})` : `[${sel}](https://)`
  // Select the part still to type: the URL (or the text, when a URL was selected).
  const a = isUrl ? s + 1 : s + sel.length + 3
  const b = isUrl ? s + 10 : s + sel.length + 11
  replaceRange(ta, s, e, text, a, b)
}

function prefixLines(ta: HTMLTextAreaElement, kind: "h2" | "h3" | "ul" | "ol") {
  const { selectionStart: s, selectionEnd: e, value } = ta
  const ls = value.lastIndexOf("\n", s - 1) + 1
  const le = value.indexOf("\n", e) === -1 ? value.length : value.indexOf("\n", e)
  const lines = value.slice(ls, le).split("\n")
  const want = kind === "h2" ? "## " : kind === "h3" ? "### " : kind === "ul" ? "- " : ""
  const strip = (l: string) => l.replace(/^(#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)/, "")
  const has = (l: string) => (kind === "ol" ? /^\d+[.)]\s+/.test(l) : l.startsWith(want))
  const allHave = lines.filter((l) => l.trim()).every(has)
  let n = 0
  const next = lines.map((l) => {
    if (!l.trim() && lines.length > 1) return l
    if (allHave) return strip(l)
    n++
    return (kind === "ol" ? `${n}. ` : want) + strip(l)
  }).join("\n")
  replaceRange(ta, ls, le, next, ls, ls + next.length)
}

// ── the editor ───────────────────────────────────────────────────────────────────────────────
export function DraftEditor({ draftId, onClose }: { draftId: string; onClose: (saved: DraftSavedDetail | null) => void }) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [revs, setRevs] = useState<Rev[]>([])
  const [save, setSave] = useState<SaveState>({ k: "idle" })
  const [view, setView] = useState<"write" | "preview">("write")
  const [side, setSide] = useState<"score" | "history">("score")
  const [diffOf, setDiffOf] = useState<(Rev & { markdown: string }) | null>(null)
  const [busy, setBusy] = useState(false)
  const [localCopy, setLocalCopy] = useState<{ markdown: string; title: string } | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)

  const taRef = useRef<HTMLTextAreaElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const rev = useRef(0)
  const latest = useRef({ text: "", title: "" })
  const savedText = useRef({ text: "", title: "" })
  const inflight = useRef<Promise<boolean> | null>(null)
  const lastFocus = useRef<Element | null>(null)

  const locked = draft?.status === "published"

  const broadcast = useCallback((d: Draft) => {
    window.dispatchEvent(new CustomEvent<DraftSavedDetail>(DRAFT_SAVED_EVENT, { detail: { draftId: d.id, title: d.title, markdown: d.markdown, status: d.status } }))
  }, [])

  // Portal into the workspace root (its colours + dark mode), else <body>.
  useEffect(() => { setHost((document.querySelector(".ax") as HTMLElement | null) ?? document.body) }, [])

  // Load the saved draft (and any unsaved local copy from a crash or a dropped connection).
  useEffect(() => {
    let live = true
    lastFocus.current = document.activeElement
    fetch(`/api/workspace/drafts/${draftId}`)
      .then(async (r) => ({ ok: r.ok, d: await r.json().catch(() => null) }))
      .then(({ ok, d }) => {
        if (!live) return
        if (!ok || !d?.draft) return setLoadErr(d?.error ?? "I couldn’t open that draft just now.")
        const dr = d.draft as Draft
        setDraft(dr); setRevs(d.revisions ?? [])
        setText(dr.markdown); setTitle(dr.title)
        rev.current = dr.rev
        latest.current = { text: dr.markdown, title: dr.title }
        savedText.current = { text: dr.markdown, title: dr.title }
        const local = readLocal(draftId)
        if (local && local.rev === dr.rev && (local.markdown !== dr.markdown || local.title !== dr.title) && dr.status !== "published") setLocalCopy(local)
        else if (local) writeLocal(draftId, null)
        window.setTimeout(() => taRef.current?.focus(), 30)
      })
      .catch(() => live && setLoadErr("I couldn’t open that draft just now."))
    return () => { live = false }
  }, [draftId])

  const doSave = useCallback(async (checkpoint?: "save"): Promise<boolean> => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
    if (inflight.current) await inflight.current
    const snap = { ...latest.current }
    const changed = snap.text !== savedText.current.text || snap.title !== savedText.current.title
    if (!changed && !checkpoint) return true
    setSave({ k: "saving" })
    const run = (async () => {
      try {
        const res = await fetch(`/api/workspace/drafts/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: snap.text, title: snap.title, baseRev: rev.current, ...(checkpoint ? { checkpoint } : {}) }),
          keepalive: snap.text.length < 60_000,
        })
        const d = await res.json().catch(() => null)
        if (res.status === 409 && d?.current) {
          setSave({ k: "conflict", current: d.current as Draft })
          if ((d.current as Draft).status === "published") setDraft(d.current)
          return false
        }
        if (!res.ok || !d?.draft) { setSave({ k: "error", msg: d?.error ?? "Not saved yet. I’ll keep trying." }); return false }
        const dr = d.draft as Draft
        rev.current = dr.rev
        savedText.current = { text: dr.markdown, title: dr.title }
        setDraft(dr)
        if (d.revisions) setRevs(d.revisions)
        // Still typing since this save started? Keep the local copy for the newer text.
        if (latest.current.text === snap.text && latest.current.title === snap.title) writeLocal(draftId, null)
        setSave(checkpoint && d.nothingNew ? { k: "note", msg: "No changes since the last version" } : { k: "saved", at: Date.now() })
        broadcast(dr)
        return true
      } catch {
        setSave({ k: "error", msg: "You’re offline. Your text is kept on this device and saves when you’re back." })
        return false
      } finally {
        inflight.current = null
      }
    })()
    inflight.current = run
    const ok = await run
    // Text changed while saving: queue the next autosave.
    if (ok && (latest.current.text !== savedText.current.text || latest.current.title !== savedText.current.title)) schedule()
    return ok
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, broadcast])

  function schedule(ms = AUTOSAVE_MS) {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { void doSave() }, ms)
  }

  // Retry a failed save every 5s (offline, server hiccup).
  useEffect(() => {
    if (save.k !== "error") return
    const t = window.setTimeout(() => { void doSave() }, 5000)
    return () => window.clearTimeout(t)
  }, [save, doSave])

  function edit(nextText: string, nextTitle = latest.current.title) {
    if (locked) return
    latest.current = { text: nextText, title: nextTitle }
    setText(nextText); setTitle(nextTitle)
    writeLocal(draftId, { markdown: nextText, title: nextTitle, rev: rev.current })
    if (save.k !== "conflict") { setSave({ k: "dirty" }); schedule() }
  }

  // Leaving with unsaved text: the browser asks first.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (latest.current.text !== savedText.current.text || latest.current.title !== savedText.current.title) { void doSave(); e.preventDefault(); e.returnValue = "" }
    }
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [doSave])

  async function close() {
    if (busy) return
    if (save.k !== "conflict" && (latest.current.text !== savedText.current.text || latest.current.title !== savedText.current.title)) {
      setBusy(true)
      const ok = await doSave()
      setBusy(false)
      if (!ok && !window.confirm("Your last changes aren’t saved to your account yet (they’re kept on this device). Close anyway?")) return
    }
    const d = draft
    ;(lastFocus.current as HTMLElement | null)?.focus?.()
    onClose(d ? { draftId: d.id, title: savedText.current.title, markdown: savedText.current.text, status: d.status } : null)
  }

  async function saveVersion() {
    if (locked || busy) return
    setBusy(true)
    await doSave("save")
    setBusy(false)
  }

  async function openDiff(r: Rev) {
    const res = await fetch(`/api/workspace/drafts/${draftId}/revisions/${r.id}`).catch(() => null)
    const d = await res?.json().catch(() => null)
    if (!res?.ok || !d?.revision) return setSave({ k: "error", msg: d?.error ?? "I couldn’t open that version." })
    setDiffOf(d.revision)
  }

  async function restore(r: Rev) {
    if (locked || busy) return
    setBusy(true)
    if (!(await doSave())) { setBusy(false); return }
    const res = await fetch(`/api/workspace/drafts/${draftId}/revisions/${r.id}`, { method: "POST" }).catch(() => null)
    const d = await res?.json().catch(() => null)
    setBusy(false)
    if (!res?.ok || !d?.draft) return setSave({ k: "error", msg: d?.error ?? "I couldn’t restore that version." })
    const dr = d.draft as Draft
    rev.current = dr.rev
    latest.current = { text: dr.markdown, title: dr.title }
    savedText.current = { text: dr.markdown, title: dr.title }
    setText(dr.markdown); setTitle(dr.title); setDraft(dr); setRevs(d.revisions ?? revs)
    writeLocal(draftId, null)
    setDiffOf(null)
    setSave({ k: "saved", at: Date.now() })
    broadcast(dr)
  }

  function takeTheirs(cur: Draft) {
    rev.current = cur.rev
    latest.current = { text: cur.markdown, title: cur.title }
    savedText.current = { text: cur.markdown, title: cur.title }
    setText(cur.markdown); setTitle(cur.title); setDraft(cur)
    writeLocal(draftId, null)
    setSave({ k: "saved", at: Date.now() })
  }
  function keepMine(cur: Draft) {
    rev.current = cur.rev
    savedText.current = { text: cur.markdown, title: cur.title }
    setSave({ k: "dirty" })
    void doSave()
  }

  // Keyboard: ⌘B bold, ⌘K link, ⌘S save a version, Esc close; Tab stays inside the dialog.
  function onKey(e: React.KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey
    const ta = taRef.current
    if (e.key === "Escape") { e.preventDefault(); if (diffOf) setDiffOf(null); else void close(); return }
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); void saveVersion(); return }
    if (mod && ta && document.activeElement === ta && !locked) {
      if (e.key.toLowerCase() === "b") { e.preventDefault(); wrapInline(ta, "**", "bold text") }
      else if (e.key.toLowerCase() === "k" && RENDERS_LINKS) { e.preventDefault(); insertLink(ta) }
    }
    if (e.key === "Tab" && dialogRef.current) {
      const f = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null)
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }

  const tool = (fn: (ta: HTMLTextAreaElement) => void) => () => {
    const ta = taRef.current
    if (!ta || locked) return
    if (view === "preview") setView("write")
    fn(ta)
  }

  // On-page fixes ("Add link"): insert Markdown where the cursor last was (a textarea keeps it after blur).
  const insertMd = (md: string) => {
    if (locked) return
    if (view === "preview") setView("write")
    window.setTimeout(() => {
      const ta = taRef.current
      if (!ta) return
      const at = ta.selectionEnd ?? ta.value.length
      const piece = (at > 0 && !/\s$/.test(ta.value.slice(0, at)) ? " " : "") + md
      replaceRange(ta, at, at, piece, at + piece.length, at + piece.length)
    }, 0)
  }

  const deferred = useDeferredValue(text)
  const grade = useMemo(() => gradeContent(deferred), [deferred])
  const html = useMemo(() => (view === "preview" ? mdToHtml(deferred, { highlightPlaceholders: true }) : ""), [deferred, view])
  const diff = useMemo(() => (diffOf ? diffText(diffOf.markdown, text) : null), [diffOf, text])
  const stats = diff ? diffStats(diff) : null
  const words = useMemo(() => countPostWords(deferred), [deferred])
  const ph = phCount(text)

  const status =
    save.k === "saving" ? "Saving…"
      : save.k === "dirty" ? "Editing…"
        : save.k === "saved" ? `Saved ${new Date(save.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
          : save.k === "error" || save.k === "note" ? save.msg
            : save.k === "conflict" ? "Changed somewhere else"
              : draft?.editedAt ? `Saved ${when(draft.editedAt)}` : "Saved"

  if (!host) return null
  return createPortal(
    <div className="dx-root">
      <div className="dx-bk" aria-hidden="true" onClick={() => void close()} />
      <div ref={dialogRef} className="dx" role="dialog" aria-modal="true" aria-labelledby="dx-title-label" onKeyDown={onKey}>
        <header className="dx-head">
          <div className="dx-head__t">
            <label id="dx-title-label" htmlFor="dx-title" className="dx-eb">{locked ? "Published post · read only" : "Edit post"}</label>
            <input
              id="dx-title"
              className="dx-title"
              value={title}
              onChange={(e) => edit(latest.current.text, e.target.value)}
              readOnly={locked}
              maxLength={200}
              placeholder="Post title"
              aria-describedby="dx-title-hint"
            />
            <span id="dx-title-hint" className={`dx-hint${title.length > 65 ? " dx-hint--warn" : ""}`}>{title.length}/65 characters Google shows</span>
          </div>
          <div className="dx-head__r">
            <span className={`dx-status dx-status--${save.k}`} role="status" aria-live="polite">{status}</span>
            <button type="button" className="dx-x" aria-label="Close editor" onClick={() => void close()} disabled={busy}>✕</button>
          </div>
        </header>

        {loadErr ? (
          <div className="dx-body"><p className="dx-msg">{loadErr}</p></div>
        ) : !draft ? (
          <div className="dx-body"><p className="dx-msg" aria-live="polite">Opening your draft…</p></div>
        ) : (
          <>
            {locked && <div className="dx-banner">This post is live{draft.url ? <> at <a href={draft.url} target="_blank" rel="noopener noreferrer">{draft.url}</a></> : ""}. Editing here wouldn’t change your site, so it’s read only. History still shows every version.</div>}
            {draft.status === "scheduled" && draft.scheduledFor && <div className="dx-banner dx-banner--info">Scheduled for {when(draft.scheduledFor)}. Edits save automatically, and the saved text is what goes out.</div>}
            {localCopy && (
              <div className="dx-banner dx-banner--warn" role="alert">
                You have changes on this device that didn’t reach your account.
                <span className="dx-banner__acts">
                  <button type="button" className="dx-btn dx-btn--s" onClick={() => { const l = localCopy; setLocalCopy(null); edit(l.markdown, l.title) }}>Bring them back</button>
                  <button type="button" className="dx-btn dx-btn--g" onClick={() => { setLocalCopy(null); writeLocal(draftId, null) }}>Discard</button>
                </span>
              </div>
            )}
            {save.k === "conflict" && (
              <div className="dx-banner dx-banner--warn" role="alert">
                {save.current.status === "published" ? "This post was published meanwhile, so the copy is locked now." : "This draft was changed somewhere else (another tab or device)."}
                {save.current.status !== "published" && (
                  <span className="dx-banner__acts">
                    <button type="button" className="dx-btn dx-btn--s" onClick={() => takeTheirs(save.current)}>Load the newest</button>
                    <button type="button" className="dx-btn dx-btn--g" onClick={() => keepMine(save.current)}>Keep mine</button>
                  </span>
                )}
              </div>
            )}

            <div className="dx-tools" role="toolbar" aria-label="Formatting">
              <button type="button" onClick={tool((t) => prefixLines(t, "h2"))} disabled={locked} title="Heading" aria-label="Heading (H2)">H2</button>
              <button type="button" onClick={tool((t) => prefixLines(t, "h3"))} disabled={locked} title="Subheading" aria-label="Subheading (H3)">H3</button>
              <button type="button" onClick={tool((t) => wrapInline(t, "**", "bold text"))} disabled={locked} title="Bold (⌘B)" aria-label="Bold"><b>B</b></button>
              {RENDERS_LINKS && <button type="button" onClick={tool(insertLink)} disabled={locked} title="Link (⌘K)" aria-label="Link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
              </button>}
              <button type="button" onClick={tool((t) => prefixLines(t, "ul"))} disabled={locked} title="Bulleted list" aria-label="Bulleted list">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>
              </button>
              {RENDERS_OL && <button type="button" onClick={tool((t) => prefixLines(t, "ol"))} disabled={locked} title="Numbered list" aria-label="Numbered list">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10 6h10M10 12h10M10 18h10" /><path d="M4 6h1v4M4 10h2" /><path d="M4 14h2l-2 3h2" /></svg>
              </button>}
              <span className="dx-tools__sp" />
              <div className="dx-seg" role="group" aria-label="View">
                <button type="button" aria-pressed={view === "write"} onClick={() => { setView("write"); setTimeout(() => taRef.current?.focus(), 0) }}>Write</button>
                <button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")}>Preview</button>
              </div>
            </div>

            <div className="dx-main">
              <section className="dx-pane" aria-label={diffOf ? "Changes" : view === "write" ? "Markdown text" : "Preview"}>
                {diffOf && diff ? (
                  <div className="dx-diff">
                    <div className="dx-diff__h">
                      <div>
                        <b>{REASON[diffOf.reason]} · {when(diffOf.at)}</b>
                        <span>{diffOf.by === "agent" ? "by Alphaa" : "by you"} · compared with now: <ins>+{stats!.added}</ins> <del>−{stats!.removed}</del> words</span>
                      </div>
                      <span className="dx-diff__acts">
                        <button type="button" className="dx-btn dx-btn--g" onClick={() => setDiffOf(null)}>Back to editing</button>
                        {!locked && <button type="button" className="dx-btn dx-btn--p" disabled={busy || (stats!.added === 0 && stats!.removed === 0)} onClick={() => void restore(diffOf)}>{busy ? "Restoring…" : "Restore this version"}</button>}
                      </span>
                    </div>
                    <p className="dx-diff__legend"><del>Struck out</del> = in that version, not now. <ins>Underlined</ins> = added since.</p>
                    <div className="dx-diff__b" aria-label="Differences">
                      {diff.map((o, i) => o.t === "eq" ? <span key={i}>{o.s}</span> : o.t === "add" ? <ins key={i}>{o.s}</ins> : <del key={i}>{o.s}</del>)}
                    </div>
                  </div>
                ) : view === "write" ? (
                  <textarea
                    ref={taRef}
                    className="dx-ta"
                    value={text}
                    onChange={(e) => edit(e.target.value)}
                    readOnly={locked}
                    spellCheck
                    aria-label="Post text in Markdown"
                    aria-describedby="dx-md-hint"
                  />
                ) : (
                  <div className="dx-prev ax-md" dangerouslySetInnerHTML={{ __html: html }} />
                )}
                {!diffOf && <p id="dx-md-hint" className="dx-hint dx-hint--pane">## heading · **bold**{RENDERS_LINKS ? " · [text](https://link)" : ""} · - list. {ph ? <b>{ph} fact{ph === 1 ? "" : "s"} in [brackets] to fill in before it can go live.</b> : null}</p>}
              </section>

              <aside className="dx-side" aria-label="Score and history">
                <div className="dx-seg dx-seg--side" role="tablist" aria-label="Panel">
                  <button type="button" role="tab" aria-selected={side === "score"} onClick={() => setSide("score")}>Score <span className={`dx-mini dx-mini--${grade.level}`}>{grade.readability.words < 30 && !grade.answers.total ? "—" : grade.score}</span></button>
                  <button type="button" role="tab" aria-selected={side === "history"} onClick={() => setSide("history")}>History <span className="dx-mini">{revs.length || ""}</span></button>
                </div>
                {side === "score" ? (
                  <div role="tabpanel">
                    <GradeCard g={grade} />
                    <OnPageCard draftId={draftId} markdown={deferred} title={title} locked={locked} onInsert={insertMd} />
                    {!locked && <OriginalityCard draftId={draftId} text={deferred} beforeAction={() => doSave()} onRewritten={(d) => { takeTheirs(d as Draft); broadcast(d as Draft) }} />}
                  </div>
                ) : (
                  <div role="tabpanel" className="dx-hist">
                    {!revs.length ? (
                      <p className="dx-msg">No versions yet. Your first edit keeps Alphaa’s original, and “Save version” keeps a copy you can come back to.</p>
                    ) : (
                      <ol>
                        {revs.map((r, i) => (
                          <li key={r.id} className={diffOf?.id === r.id ? "on" : ""}>
                            <button type="button" onClick={() => void openDiff(r)} aria-label={`${REASON[r.reason]}, ${when(r.at)}, ${r.by === "agent" ? "by Alphaa" : "by you"}. Show changes`}>
                              <span className="dx-hist__t"><b>{REASON[r.reason]}</b>{i === 0 && <em>latest</em>}</span>
                              <span className="dx-hist__m">{when(r.at)} · {r.by === "agent" ? "Alphaa" : r.who ? (r.who === "the owner" ? "The owner" : r.who) : "You"} · {r.words} words</span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </aside>
            </div>

            <footer className="dx-foot">
              <span className="dx-foot__w">{words} words</span>
              {!locked && <button type="button" className="dx-btn dx-btn--s" onClick={() => void saveVersion()} disabled={busy} title="Save version (⌘S)">Save version</button>}
              <button type="button" className="dx-btn dx-btn--p" onClick={() => void close()} disabled={busy}>{busy ? "Saving…" : "Done"}</button>
            </footer>
          </>
        )}
      </div>
    </div>,
    host,
  )
}
