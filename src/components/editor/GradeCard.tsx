"use client"

// The content score card (lib/content-grade.ts): live in the editor, compact in the publish flow.
// It only informs; nothing here blocks publishing.
import type { ContentGrade, GradeLevel } from "@/lib/content-grade"
import "./editor.css"

const WORD: Record<GradeLevel, string> = { good: "Good", ok: "Check", fix: "Fix" }

function Row({ label, value, level }: { label: string; value: string; level: GradeLevel }) {
  return (
    <li className="dx-gr__row">
      <span className={`dx-dot dx-dot--${level}`} aria-hidden="true" />
      <span className="dx-gr__l">{label}</span>
      <span className="dx-gr__v">{value}</span>
      <span className={`dx-pill dx-pill--${level}`}>{WORD[level]}</span>
    </li>
  )
}

export function GradeCard({ g, compact = false, onOpen }: { g: ContentGrade; compact?: boolean; onOpen?: () => void }) {
  const r = g.readability
  if (r.words < 30 && !g.answers.total) {
    return <div className="dx-gr dx-gr--empty">Write a few paragraphs and I’ll score it for direct answers and readability.</div>
  }
  if (compact) {
    const n = g.fixes.length
    return (
      <div className="dx-gr dx-gr--compact" role="group" aria-label="Content score">
        <span className={`dx-score dx-score--${g.level}`} aria-label={`Score ${g.score} out of 100`}>{g.score}</span>
        <span className="dx-gr__sum">
          <b>{g.level === "good" ? "Reads well and answers first" : g.level === "ok" ? "Good, with a few fixes" : "Worth a quick pass"}</b>
          <span>
            {g.answers.total ? `${g.answers.passed}/${g.answers.total} direct answers · ` : ""}
            {r.grade != null ? `grade ${r.grade} · ` : ""}
            {n ? `${n} suggestion${n === 1 ? "" : "s"}` : "no fixes needed"}
          </span>
        </span>
        {onOpen && <button type="button" className="dx-link" onClick={onOpen}>{n ? "See fixes" : "Open"}</button>}
      </div>
    )
  }
  return (
    <div className="dx-gr" role="group" aria-label="Content score">
      <div className="dx-gr__top">
        <span className={`dx-score dx-score--${g.level}`} aria-label={`Score ${g.score} out of 100`}>{g.score}</span>
        <div>
          <b>Content score</b>
          <p>Advice only. It never stops you publishing.</p>
        </div>
      </div>
      <ul className="dx-gr__rows">
        <Row label="Direct answers" value={g.answers.total ? `${g.answers.passed} of ${g.answers.total}` : "no question headings"} level={g.answers.level} />
        <Row label="Reading grade" value={r.grade == null ? "—" : `${r.grade} (aim ≤ 8)`} level={r.gradeLevel} />
        <Row label="Sentence length" value={r.avgSentence == null ? "—" : `${r.avgSentence} words avg${r.longSentences.length ? `, ${r.longSentences.length} long` : ""}`} level={r.sentenceLevel} />
        <Row label="Passive voice" value={`${Math.round(r.passive.share * 100)}%`} level={r.passiveLevel} />
        <Row label="Paragraphs" value={r.longParagraphs.length ? `${r.longParagraphs.length} too long` : "short and scannable"} level={r.paragraphLevel} />
      </ul>
      {g.answers.total > 0 && (
        <details className="dx-gr__ans">
          <summary>Answers under each question</summary>
          <ul>
            {g.answers.checks.map((c, i) => (
              <li key={i}>
                <span className={`dx-dot dx-dot--${c.status === "good" ? "good" : c.status === "missing" ? "fix" : "ok"}`} aria-hidden="true" />
                <span>{c.heading}</span>
                <em>{c.status === "missing" ? "no answer" : `${c.words} words${c.status === "good" ? "" : c.status === "short" ? ", short" : c.status === "long" ? ", long" : ", name the subject"}`}</em>
              </li>
            ))}
          </ul>
        </details>
      )}
      {g.fixes.length > 0 ? (
        <>
          <div className="dx-gr__h">What to fix</div>
          <ol className="dx-gr__fixes">
            {g.fixes.map((f, i) => <li key={i} className={`dx-fix dx-fix--${f.level}`}>{f.text}</li>)}
          </ol>
        </>
      ) : (
        <p className="dx-gr__ok">Nothing to fix: clear answers, short sentences, easy to read.</p>
      )}
    </div>
  )
}
