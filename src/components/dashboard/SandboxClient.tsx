"use client"

import { useState, type ReactNode } from "react"
import { Button, EmptyState, Glyph, Pill, SectionHeader, Skeleton } from "@/components/workspace/ui"
import { EngineMark } from "@/components/workspace/EngineCard"
import "@/components/workspace/detail.css"

// "Ask the AIs": one live question to ChatGPT, Claude, Gemini and Perplexity, answered side by side.
// The quota is the same one the API enforces (lib/quotas.ts sandbox_question).

type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"

type SandboxEngineResult = {
  engine: EngineKey
  answer: string
  appeared: boolean
  mentioned: string[]
  status: "appeared" | "not_appearing" | "not_configured" | "error"
}

const ENGINES: Array<{ key: EngineKey; label: string }> = [
  { key: "chatgpt", label: "ChatGPT" },
  { key: "claude", label: "Claude" },
  { key: "perplexity", label: "Perplexity" },
  { key: "gemini", label: "Gemini" },
]

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Highlights the user's own business name (green) and any competitor names the
// engine actually named (accent/red). Wrapped in try/catch: a weird business
// name must never take the page down — worst case we show plain text.
function highlight(answer: string, ownName: string, competitors: string[]): ReactNode {
  try {
    const own = (ownName ?? "").trim()
    const comps = competitors.filter((c) => typeof c === "string" && c.trim().length > 1)
    const terms: Array<{ term: string; self: boolean }> = []
    if (own.length > 1) terms.push({ term: own, self: true })
    for (const c of comps) terms.push({ term: c.trim(), self: false })
    if (terms.length === 0) return answer

    // Longest-first so "Acme Dental Care" wins over "Acme".
    terms.sort((a, b) => b.term.length - a.term.length)
    const re = new RegExp(`(${terms.map((t) => escapeRegex(t.term)).join("|")})`, "gi")
    const parts = answer.split(re)
    if (parts.length === 1) return answer

    const selfSet = new Set(terms.filter((t) => t.self).map((t) => t.term.toLowerCase()))
    return parts.map((part, i) => {
      const isMatch = terms.some((t) => t.term.toLowerCase() === part.toLowerCase())
      if (!isMatch) return <span key={i}>{part}</span>
      const isSelf = selfSet.has(part.toLowerCase())
      return (
        <mark key={i} className={isSelf ? undefined : "rival"}>
          {part}
        </mark>
      )
    })
  } catch (err) {
    console.error("[sandbox] highlight failed:", err)
    return answer
  }
}

export default function SandboxClient({
  businessName,
  placeholder,
  initialRemaining,
  limit,
  questions = [],
}: {
  businessName: string
  placeholder: string
  initialRemaining: number
  limit: number
  /** The customer questions I already ask every week (one tap fills the box). */
  questions?: string[]
}) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [results, setResults] = useState<SandboxEngineResult[] | null>(null)
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null)

  const trimmed = question.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < 5
  const outOfChecks = remaining <= 0
  const canAsk = !loading && trimmed.length >= 5 && trimmed.length <= 200 && !outOfChecks

  async function ask(text = trimmed) {
    if (loading || text.length < 5 || text.length > 200 || outOfChecks) return
    setLoading(true)
    setError(null)
    setResults(null)
    setAskedQuestion(text)
    try {
      const res = await fetch("/api/sandbox/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      })
      const data = await res.json().catch(() => null)
      if (data && typeof data.remaining === "number") setRemaining(data.remaining)
      if (!res.ok) {
        setError(data && typeof data.error === "string" ? data.error : "The live check didn’t finish this time. Try again in a minute.")
        return
      }
      if (data && Array.isArray(data.results)) {
        setResults(data.results as SandboxEngineResult[])
        if (typeof data.question === "string") setAskedQuestion(data.question)
      }
    } catch {
      setError("The live check didn’t finish this time. Try again in a minute.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form className="xp-ask" onSubmit={(e) => { e.preventDefault(); ask() }}>
        <label htmlFor="sandbox-question" className="sr-only">Your question</label>
        <div className="xp-ask__row">
          <input
            id="sandbox-question"
            className="xp-ask__in"
            value={question}
            maxLength={200}
            placeholder={placeholder}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
          <Button type="submit" variant="primary" loading={loading} disabled={!canAsk}>{loading ? "Asking" : "Ask the AIs"}</Button>
        </div>
        <div className="xp-ask__meta">
          <span>{tooShort ? "A little longer, please. At least 5 characters." : `${trimmed.length}/200`}</span>
          <span className={outOfChecks ? "warn" : undefined}>{outOfChecks ? `You’ve used today’s ${limit} live questions. They reset tomorrow.` : `${remaining} of ${limit} live questions left today`}</span>
        </div>
        {questions.length > 0 && (
          <div className="xp-ask__chips" aria-label="Questions I ask every week">
            {questions.map((q) => (
              <button key={q} type="button" className="ax-chip" disabled={loading} title={q} onClick={() => { setQuestion(q); ask(q) }}>{q}</button>
            ))}
          </div>
        )}
        {error && <p className="xp-ask__meta"><span className="warn">{error}</span></p>}
      </form>
      <p className="xp-disc">Answers change from one run to the next. This is what each AI said this time, not a ranking.</p>

      {(loading || (results && askedQuestion)) && (
        <>
          <SectionHeader title={`“${askedQuestion}”`} sub={loading ? "Asking all four now. This takes about 20 seconds." : "Asked just now."} />
          <div className="xp-eng-grid">
            {ENGINES.map(({ key, label }) => {
              if (loading) {
                return (
                  <article key={key} className="xp-eng" aria-busy="true">
                    <div className="xp-eng__top"><span className="xp-eng__name"><EngineMark engine={key} />{label}</span></div>
                    <Skeleton kind="line" lines={4} />
                  </article>
                )
              }
              const r = results?.find((x) => x.engine === key)
              const unavailable = !r || r.status === "not_configured" || r.status === "error"
              return (
                <article key={key} className="xp-eng">
                  <div className="xp-eng__top">
                    <span className="xp-eng__name"><EngineMark engine={key} />{label}</span>
                    {unavailable ? <Pill tone="idle">No answer</Pill> : r.appeared ? <Pill tone="ok" dot>Names you</Pill> : <Pill tone="warn">Doesn’t name you</Pill>}
                  </div>
                  {unavailable ? (
                    <p className="ax-p">{!r || r.status === "not_configured" ? `I can’t ask ${label} on this account yet, so there’s nothing to show.` : `${label} didn’t answer this time. Try again in a minute.`}</p>
                  ) : (
                    <>
                      <p className="xp-eng__quote full xp-ans">{highlight(r.answer, businessName, r.mentioned)}</p>
                      {r.mentioned.length > 0 && (
                        <div>
                          <div className="xp-eng__lbl">{r.appeared ? "Also named" : "Named instead of you"}</div>
                          <div className="xp-chips">{r.mentioned.map((n) => <span key={n} className="ax-chip">{n}</span>)}</div>
                        </div>
                      )}
                    </>
                  )}
                </article>
              )
            })}
          </div>
          {results && (
            <div className="xp-legend">
              <span><i className="you" />Your business</span>
              <span><i className="rival" />Someone else it named</span>
            </div>
          )}
        </>
      )}

      {!loading && !results && (
        <div className="xp-gap">
          <EmptyState
            icon={<Glyph name="spark" size={22} />}
            title="Ask what your customers ask"
            text="Type a question or tap one I already ask every week. You’ll see all four answers side by side."
            bullets={["Whether each AI names you", "Who it names instead", "The full answer, with names highlighted"]}
          />
        </div>
      )}
    </div>
  )
}
