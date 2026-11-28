"use client"

// The originality block (lib/originality.ts): "Original: 98%", the passages that match other pages
// with their links, and "Rewrite these lines" when it's held. Its own component so it sits beside
// the content score without touching it: the editor's score panel and the Draft it sheet.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { summaryLine, textHash, type OriginalityResult } from "@/lib/originality-rules"
import type { SavedDraft } from "@/lib/draft-versions"
import "./editor.css"
import "./originality.css"

type State = { result: OriginalityResult | null; fresh: boolean; checkable: boolean }

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, "") } catch { return u } }

export function OriginalityCard({ draftId, text, autoCheck = false, compact = false, beforeAction, onRewritten, onState }: {
  draftId: string
  /** The text on screen (editor): a result for older text shows as "changed since my check". */
  text?: string
  /** Run the check when there's no result yet (Draft it sheet). */
  autoCheck?: boolean
  compact?: boolean
  /** Save pending edits first (editor). False = stop. */
  beforeAction?: () => Promise<boolean>
  onRewritten?: (d: SavedDraft) => void
  onState?: (r: OriginalityResult | null) => void
}) {
  const [s, setS] = useState<State | null>(null)
  const [busy, setBusy] = useState<null | "check" | "rewrite">(null)
  const [err, setErr] = useState<string | null>(null)
  const [open, setOpen] = useState(!compact)
  const started = useRef(false)

  const call = useCallback(async (op: "get" | "check" | "rewrite") => {
    const res = await fetch("/api/workspace/originality", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, draftId }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as (State & { error?: string; draft?: SavedDraft; changed?: number }) | null
    return { ok: !!res?.ok, d }
  }, [draftId])

  const run = useCallback(async (op: "check" | "rewrite") => {
    setErr(null)
    if (beforeAction && !(await beforeAction())) return
    setBusy(op)
    const { ok, d } = await call(op)
    setBusy(null)
    if (!ok || !d) return setErr(d?.error ?? "That didn’t work just now. Try again in a minute.")
    setS({ result: d.result ?? null, fresh: true, checkable: d.checkable !== false })
    if (op === "rewrite" && d.draft) onRewritten?.(d.draft)
  }, [beforeAction, call, onRewritten])

  useEffect(() => {
    let live = true
    void call("get").then(({ ok, d }) => {
      if (!live) return
      const st = ok && d ? { result: d.result ?? null, fresh: !!d.fresh, checkable: d.checkable !== false } : { result: null, fresh: false, checkable: true }
      setS(st)
      if (autoCheck && !started.current && st.checkable && (!st.result || !st.fresh)) { started.current = true; void run("check") }
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId])

  const r = s?.result ?? null
  // The editor's own text decides "changed since my check" (the saved copy can lag a second).
  const stale = useMemo(() => (r && text != null ? textHash(text) !== r.hash : !!r && s?.fresh === false), [r, text, s?.fresh])
  useEffect(() => { onState?.(r && !stale ? r : null) }, [r, stale, onState])

  if (!s) return <div className="dx-gr dx-or dx-or--load">Checking originality…</div>
  if (!s.checkable) return null
  const level = !r ? "ok" : r.blocked ? "fix" : r.passages.length ? "ok" : "good"

  if (busy === "check" && !r) return <div className="dx-gr dx-or dx-or--load" aria-live="polite">Checking it against the pages I read and Google… (about a minute)</div>
  if (!r) {
    return (
      <div className="dx-gr dx-or">
        <div className="dx-or__head"><b>Originality</b><button type="button" className="dx-link" onClick={() => void run("check")} disabled={!!busy}>Check it now</button></div>
        <p className="dx-or__sum">I compare it with the pages I read for it and search Google for its most distinctive sentences.</p>
        {err && <p className="dx-or__err">{err}</p>}
      </div>
    )
  }
  return (
    <div className={`dx-gr dx-or${compact ? " dx-or--compact" : ""}`} role="group" aria-label="Originality check">
      <div className="dx-or__head">
        <span className={`dx-score dx-score--${level}`} aria-label={`Original ${r.original} percent`}>{r.tooShort ? "—" : `${r.original}%`}</span>
        <span className="dx-or__t">
          <b>{r.tooShort ? "Originality" : `Original: ${r.original}%`}</b>
          <span>{summaryLine(r)}</span>
        </span>
        {compact && r.passages.length > 0 && <button type="button" className="dx-link" onClick={() => setOpen(!open)}>{open ? "Hide" : "See them"}</button>}
      </div>
      {stale && <p className="dx-or__note">The text changed since this check. <button type="button" className="dx-link" disabled={!!busy} onClick={() => void run("check")}>{busy === "check" ? "Checking…" : "Check again"}</button></p>}
      {r.blocked && <p className="dx-or__held">I won’t publish it like this. Quotes are fine when they name their source.</p>}
      {open && r.passages.length > 0 && (
        <ol className="dx-or__list">
          {r.passages.slice(0, compact ? 4 : 10).map((p, i) => (
            <li key={i}>
              <q>{p.text}</q>
              <span className="dx-or__src">{p.words} words · {p.via === "web" ? "found on Google: " : "on "}<a href={p.url} target="_blank" rel="noopener noreferrer">{p.title ? `${p.title.slice(0, 60)} (${host(p.url)})` : host(p.url)} ↗</a></span>
            </li>
          ))}
        </ol>
      )}
      {!compact && r.sources.length > 0 && <p className="dx-or__meta">Closest page: {host(r.sources[0].url)}, {r.sources[0].pct}% of the words.</p>}
      {!compact && (r.read.length > 0 || r.web.ran || r.web.note) && (
        <p className="dx-or__meta">
          {r.read.length ? `Compared with ${r.read.filter((x) => x.ok).length} page${r.read.filter((x) => x.ok).length === 1 ? "" : "s"} I read for it${r.read.some((x) => !x.ok) ? ` (${r.read.filter((x) => !x.ok).length} I couldn’t open)` : ""}. ` : ""}
          {r.web.ran ? `Searched ${r.web.sentences.length} sentence${r.web.sentences.length === 1 ? "" : "s"} on Google.` : ""}
          {r.web.note ? ` ${r.web.note}` : ""}
        </p>
      )}
      {r.passages.length > 0 && (
        <div className="dx-or__act">
          <button type="button" className={`dx-btn ${r.blocked ? "dx-btn--p" : "dx-btn--s"}`} disabled={!!busy} onClick={() => void run("rewrite")}>{busy === "rewrite" ? "Rewriting…" : "Rewrite these lines"}</button>
          <span>Only the matching lines change. You can undo it in History.</span>
        </div>
      )}
      {err && <p className="dx-or__err">{err}</p>}
    </div>
  )
}
