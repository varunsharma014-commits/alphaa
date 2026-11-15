"use client"

import { useEffect, useState } from "react"

// The homepage hero's idle window: the agent's actual weekly job, ticking through one step at a
// time, so the box reads as "an agent at work" before anyone types. Steps only, no results or
// numbers (nothing here is a claim about a real business).

const DEFAULT_STEPS = [
  "Ask ChatGPT, Gemini, Claude and Perplexity what your customers ask",
  "Read your website the way AI reads it",
  "Fix what’s missing: your facts, FAQs and structured data",
  "Write posts and pages for you to approve",
  "Check again every week and tell you what changed",
]

export function AgentWorkPreview({ steps = DEFAULT_STEPS, title = "What I do for you, every week" }: { steps?: string[]; title?: string }) {
  const [at, setAt] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setAt(steps.length)
      return
    }
    // Each step "runs" ~1.4s, then the list rests complete for a moment and starts over.
    const t = window.setInterval(() => setAt((a) => (a >= steps.length + 2 ? 0 : a + 1)), 1400)
    return () => window.clearInterval(t)
  }, [steps.length])

  return (
    <div className="ag-work" aria-label={title}>
      <div className="ag-work__head">
        <span className="ag-work__dot" aria-hidden="true" />
        {title}
      </div>
      <ol className="ag-work__list">
        {steps.map((s, i) => {
          const state = i < at ? "done" : i === at ? "run" : "todo"
          return (
            <li key={s} className={`ag-work__step ag-work__step--${state}`}>
              <span className="ag-work__mark" aria-hidden="true">
                {state === "done" ? (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                ) : state === "run" ? (
                  <span className="ag-work__spin" />
                ) : null}
              </span>
              <span>{s}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
