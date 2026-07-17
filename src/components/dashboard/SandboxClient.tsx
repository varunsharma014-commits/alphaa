"use client"

import { useState, type ReactNode } from "react"
import { Bot, Globe, Sparkles, Search, RefreshCw, Check, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { DsCard } from "@/components/dashboard/DsCard"
import { StatusPill } from "@/components/dashboard/StatusPill"

type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"

type SandboxEngineResult = {
  engine: EngineKey
  answer: string
  appeared: boolean
  mentioned: string[]
  status: "appeared" | "not_appearing" | "not_configured" | "error"
}

// Display order + labels. The API returns whatever scanAllEngines produced; we
// render in this order so the columns never jump around between runs.
const ENGINES: Array<{ key: EngineKey; label: string; Icon: LucideIcon }> = [
  { key: "chatgpt", label: "ChatGPT", Icon: Bot },
  { key: "claude", label: "Claude", Icon: Globe },
  { key: "gemini", label: "Gemini", Icon: Sparkles },
  { key: "perplexity", label: "Perplexity", Icon: Search },
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
        <mark
          key={i}
          style={{
            background: isSelf ? "var(--ds-ok-bg)" : "var(--ds-bad-bg)",
            color: isSelf ? "var(--ds-ok)" : "var(--ds-bad-soft)",
            border: `1px solid ${isSelf ? "var(--ds-ok-border)" : "var(--ds-bad-border)"}`,
            borderRadius: "4px",
            padding: "0 3px",
            fontWeight: 500,
          }}
        >
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
}: {
  businessName: string
  placeholder: string
  initialRemaining: number
  limit: number
}) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [results, setResults] = useState<SandboxEngineResult[] | null>(null)
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null)

  const trimmed = question.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < 5
  const canAsk = !loading && trimmed.length >= 5 && trimmed.length <= 200 && remaining > 0

  async function ask() {
    if (!canAsk) return
    setLoading(true)
    setError(null)
    setResults(null)

    // Narrates the real work: all four engines are asked in parallel, so this
    // is a progress narration, not a fake per-engine stream.
    const steps = ["Asking ChatGPT…", "Asking Claude…", "Asking Gemini…", "Asking Perplexity…", "Reading the answers…"]
    let step = 0
    setProgress(steps[0])
    const timer = setInterval(() => {
      step = Math.min(step + 1, steps.length - 1)
      setProgress(steps[step])
    }, 2200)

    try {
      const res = await fetch("/api/sandbox/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        if (data && typeof data.remaining === "number") setRemaining(data.remaining)
        setError(
          data && typeof data.error === "string"
            ? data.error
            : "The live check didn't finish this time. Please try again in a minute."
        )
        return
      }
      if (data && Array.isArray(data.results)) {
        setResults(data.results as SandboxEngineResult[])
        setAskedQuestion(typeof data.question === "string" ? data.question : trimmed)
      }
      if (data && typeof data.remaining === "number") setRemaining(data.remaining)
    } catch {
      setError("The live check didn't finish this time. Please try again in a minute.")
    } finally {
      clearInterval(timer)
      setProgress(null)
      setLoading(false)
    }
  }

  const outOfChecks = remaining <= 0

  return (
    <div>
      {/* Ask box */}
      <DsCard style={{ marginBottom: "14px" }}>
        <label
          htmlFor="sandbox-question"
          style={{
            display: "block",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--ds-text-ghost)",
            marginBottom: "8px",
          }}
        >
          Your question
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            id="sandbox-question"
            value={question}
            maxLength={200}
            placeholder={placeholder}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask()
            }}
            disabled={loading}
            style={{
              flex: "1 1 260px",
              minWidth: 0,
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border-2)",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "14px",
              color: "var(--ds-text)",
              outline: "none",
            }}
          />
          <button
            onClick={ask}
            disabled={!canAsk}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--ds-accent)",
              color: "var(--ds-text)",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "8px",
              padding: "10px 18px",
              border: "none",
              cursor: canAsk ? "pointer" : "default",
              opacity: canAsk ? 1 : 0.5,
            }}
          >
            {loading && <RefreshCw size={13} className="animate-spin" />}
            {loading ? "Asking the AIs…" : "Ask the AIs"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "8px",
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--ds-text-faint)" }}>
            {tooShort ? "A little longer, please — at least 5 characters." : `${trimmed.length}/200 characters`}
          </p>
          <p style={{ fontSize: "11px", color: outOfChecks ? "var(--ds-warn)" : "var(--ds-text-faint)" }}>
            {remaining} of {limit} live checks left today
          </p>
        </div>

        {outOfChecks && !error && (
          <p style={{ fontSize: "12px", color: "var(--ds-warn)", marginTop: "8px", lineHeight: 1.6 }}>
            You&apos;ve used your {limit} live checks today — they reset in a few hours. alphaa also checks
            automatically every Wednesday.
          </p>
        )}
        {error && (
          <p style={{ fontSize: "12px", color: "var(--ds-warn)", marginTop: "8px", lineHeight: 1.6 }}>{error}</p>
        )}
      </DsCard>

      {/* Honest note */}
      <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", lineHeight: 1.6, marginBottom: "16px" }}>
        This asks the engines live, right now. Answers can vary between runs — that&apos;s how AI works. Nothing here
        is a ranking or a promise; it&apos;s just what each engine said this time.
      </p>

      {loading && progress && (
        <DsCard accent="var(--ds-accent)" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RefreshCw size={15} color="var(--ds-accent)" className="animate-spin" />
            <span style={{ fontSize: "13px", color: "var(--ds-text-mute)" }}>{progress}</span>
          </div>
        </DsCard>
      )}

      {results && askedQuestion && (
        <>
          <p style={{ fontSize: "12px", color: "var(--ds-text-mute)", marginBottom: "10px" }}>
            Asked just now: &ldquo;{askedQuestion}&rdquo;
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
              alignItems: "start",
            }}
          >
            {ENGINES.map(({ key, label, Icon }) => {
              const r = results.find((x) => x.engine === key)
              const unavailable = !r || r.status === "not_configured" || r.status === "error"
              return (
                <DsCard key={key}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <Icon size={15} color={r?.appeared ? "var(--ds-ok)" : "var(--ds-text-mute)"} />
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>{label}</span>
                  </div>

                  {unavailable ? (
                    <>
                      <StatusPill variant="neutral">No answer</StatusPill>
                      <p style={{ fontSize: "12px", color: "var(--ds-text-mute)", marginTop: "10px", lineHeight: 1.6 }}>
                        {!r || r.status === "not_configured"
                          ? `${label} isn't connected on this account, so alphaa didn't ask it. Nothing is being guessed here.`
                          : `${label} didn't respond this time — so there's no answer to show. Try again in a minute.`}
                      </p>
                    </>
                  ) : (
                    <>
                      <StatusPill variant={r.appeared ? "found" : "error"}>
                        {r.appeared ? "You were named ✓" : "You weren't named"}
                      </StatusPill>
                      <p
                        style={{
                          fontSize: "12.5px",
                          color: "var(--ds-text-strong)",
                          lineHeight: 1.7,
                          marginTop: "10px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {highlight(r.answer, businessName, r.mentioned)}
                      </p>
                      {r.mentioned.length > 0 && (
                        <div style={{ marginTop: "10px", borderTop: "0.5px solid var(--ds-border)", paddingTop: "10px" }}>
                          <div
                            style={{
                              fontSize: "10px",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "var(--ds-text-ghost)",
                              marginBottom: "6px",
                            }}
                          >
                            {label} named instead
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {r.mentioned.map((name) => (
                              <StatusPill key={name} variant="error">
                                {name}
                              </StatusPill>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </DsCard>
              )
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "14px",
              fontSize: "11px",
              color: "var(--ds-text-faint)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <Check size={12} color="var(--ds-ok)" /> Green = your business
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <X size={12} color="var(--ds-bad-soft)" /> Red = someone else the engine named
            </span>
          </div>
        </>
      )}
    </div>
  )
}
