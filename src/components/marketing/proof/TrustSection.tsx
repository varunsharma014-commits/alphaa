import Link from "next/link"
import { AUTHOR } from "@/lib/author"

// Homepage proof, right under the hero. Only things that are true and checkable:
// the scan is live, nothing publishes without approval, the guarantee, and a real
// named founder. Customer quotes render only from REAL_QUOTES, filled with
// permission (Varun, 2026-11-15) — never invented, never "example" quotes.

export const REAL_QUOTES: { quote: string; name: string; business: string; city?: string }[] = []

const POINTS = [
  {
    title: "Nothing pre-recorded.",
    body: "The scan above asks ChatGPT, Gemini, Claude and Perplexity live, while you watch. What you see is what they said a few seconds ago.",
  },
  {
    title: "You approve everything.",
    body: "Posts, pages and review replies wait for your one-tap yes. Nothing goes public in your name without it.",
  },
  {
    title: "Next month on us.",
    body: "If no AI names you by day 90 with weekly checks active, next month is free. Month to month, cancel online in a minute.",
  },
]

export function TrustSection() {
  return (
    <section className="ag-trust" aria-labelledby="trust-h">
      <h2 id="trust-h" className="ag-trust__h">Why you can trust it</h2>
      <div className="ag-trust__grid">
        {POINTS.map((p) => (
          <div key={p.title} className="ag-trust__card">
            <b>{p.title}</b>
            <p>{p.body}</p>
          </div>
        ))}
      </div>

      {REAL_QUOTES.length > 0 && (
        <div className="ag-trust__quotes">
          {REAL_QUOTES.map((q) => (
            <figure key={q.name} className="ag-trust__quote">
              <blockquote>“{q.quote}”</blockquote>
              <figcaption>{q.name}, {q.business}{q.city ? `, ${q.city}` : ""}</figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="ag-trust__founder">
        <span className="ag-trust__avatar" aria-hidden="true">VS</span>
        <p>
          Built by <Link href={AUTHOR.path}>{AUTHOR.name}</Link>, who has spent over a decade in performance marketing
          and founded Growth Turbine, a marketing agency in Ottawa. Questions? Email{" "}
          <a href="mailto:hi@alphaa.app">hi@alphaa.app</a> and a person answers.
        </p>
      </div>
    </section>
  )
}
