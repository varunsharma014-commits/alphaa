"use client"

// The "On-page" score in the editor's Score panel (lib/onpage-grade.ts), live as you type. Its own
// section so other score blocks (content score, originality) sit beside it untouched.
// It never blocks publishing. The summary (excerpt = description) can be edited here.
import { useEffect, useMemo, useRef, useState } from "react"
import { gradeOnPage, SUMMARY_MAX, SUMMARY_MIN, type OnPageContext } from "@/lib/onpage-grade"
import type { GradeLevel } from "@/lib/content-grade"
import "./editor.css"
import "./onpage.css"

const WORD: Record<GradeLevel, string> = { good: "Good", ok: "Check", fix: "Fix" }
type Loaded = { context: OnPageContext; termSources: { url: string; title: string }[]; hasBrief: boolean; locked: boolean }

export function OnPageCard({ draftId, markdown, title, locked, onInsert }: { draftId: string; markdown: string; title: string; locked?: boolean; onInsert?: (md: string) => void }) {
  const [data, setData] = useState<Loaded | null>(null)
  const [err, setErr] = useState(false)
  const [excerpt, setExcerpt] = useState("")
  const [saved, setSaved] = useState("")
  const [saving, setSaving] = useState<"idle" | "saving" | "error">("idle")
  const [now] = useState(() => new Date())
  const live = useRef(true)

  useEffect(() => {
    live.current = true
    fetch(`/api/workspace/drafts/${draftId}/onpage`)
      .then(async (r) => ({ ok: r.ok, d: (await r.json().catch(() => null)) as Loaded | null }))
      .then(({ ok, d }) => {
        if (!live.current) return
        if (!ok || !d?.context) return setErr(true)
        setData(d)
        setExcerpt(d.context.excerpt ?? "")
        setSaved(d.context.excerpt ?? "")
      })
      .catch(() => live.current && setErr(true))
    return () => { live.current = false }
  }, [draftId])

  const g = useMemo(() => gradeOnPage(markdown, title, { ...(data?.context ?? {}), excerpt: data ? excerpt : undefined, now }), [markdown, title, data, excerpt, now])

  async function saveExcerpt() {
    if (excerpt.trim() === saved.trim() || locked) return
    setSaving("saving")
    const r = await fetch(`/api/workspace/drafts/${draftId}/onpage`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ excerpt }) }).catch(() => null)
    if (r?.ok) { setSaved(excerpt); setSaving("idle") } else setSaving("error")
  }

  const words = markdown.split(/\s+/).filter(Boolean).length
  return (
    <section className="dx-gr dx-op" aria-label="On-page score">
      <div className="dx-gr__top">
        <span className={`dx-score dx-score--${words < 30 ? "ok" : g.level}`} aria-label={words < 30 ? "On-page score not ready" : `On-page score ${g.score} out of 100`}>{words < 30 ? "—" : g.score}</span>
        <div>
          <b>On-page SEO</b>
          <p>{!data && !err ? "Reading the pages that rank for this…" : "Title, headings, links and topic coverage. Advice only."}</p>
        </div>
      </div>
      {words >= 30 && (
        <ul className="dx-gr__rows">
          {g.checks.map((c) => (
            <li key={c.key} className="dx-gr__row">
              <span className={`dx-dot dx-dot--${c.level}`} aria-hidden="true" />
              <span className="dx-gr__l">{c.label}</span>
              <span className="dx-gr__v">{c.value}</span>
              <span className={`dx-pill dx-pill--${c.level}`}>{WORD[c.level]}</span>
            </li>
          ))}
        </ul>
      )}

      {data && (g.missingTerms.length > 0 || g.coveredTerms.length > 0) && words >= 30 && (
        <details className="dx-gr__ans">
          <summary>Topic terms ({g.coveredTerms.length} of {g.coveredTerms.length + g.missingTerms.length} used)</summary>
          <div className="dx-op__terms">
            {g.missingTerms.map((t) => <span key={t} className="dx-op__t dx-op__t--miss">{t}</span>)}
            {g.coveredTerms.map((t) => <span key={t} className="dx-op__t dx-op__t--ok">✓ {t}</span>)}
          </div>
          {data.termSources.length > 0 && (
            <p className="dx-op__src">From {data.termSources.map((s, i) => <span key={s.url}>{i ? ", " : ""}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title.slice(0, 60) || s.url}</a></span>)}. Only add what’s true for you.</p>
          )}
        </details>
      )}
      {data && !data.context.terms?.length && (
        <p className="dx-op__note">{data.hasBrief ? "I couldn’t read enough ranking pages for this topic to suggest terms." : "Topic terms show for posts I planned from a brief."}</p>
      )}

      {words >= 30 && g.fixes.length > 0 && (
        <>
          <div className="dx-gr__h">On-page fixes</div>
          <ol className="dx-gr__fixes">
            {g.fixes.map((f, i) => (
              <li key={i} className={`dx-fix dx-fix--${f.level}`}>
                {f.text}
                {f.insert && onInsert && !locked && <> <button type="button" className="dx-link" onClick={() => onInsert(f.insert!)}>Add link</button></>}
              </li>
            ))}
          </ol>
        </>
      )}

      {data && (
        <div className="dx-op__sum">
          <label htmlFor={`dx-op-ex-${draftId}`}>Summary for Google <span className={excerpt.trim().length > SUMMARY_MAX || (excerpt.trim().length > 0 && excerpt.trim().length < SUMMARY_MIN) ? "dx-op__warn" : ""}>{excerpt.trim().length}/{SUMMARY_MAX}</span></label>
          <textarea
            id={`dx-op-ex-${draftId}`}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            onBlur={() => void saveExcerpt()}
            readOnly={locked}
            rows={3}
            maxLength={400}
            placeholder="One or two sentences on what the reader gets."
          />
          <span className="dx-op__note" role="status" aria-live="polite">{saving === "saving" ? "Saving…" : saving === "error" ? "Not saved. Try again." : "It goes out as the post’s excerpt."}</span>
        </div>
      )}
      {err && <p className="dx-op__note">I couldn’t load the brief for this post, so I’m scoring the text only.</p>}
    </section>
  )
}
