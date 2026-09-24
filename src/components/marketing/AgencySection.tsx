import { BRAND } from "@/lib/brand"

// The agency problem, told from the agent's side. Numbers are the same
// $2,000/mo agency benchmark used across the site ($24,000 → $1,188).
const contrasts = [
  {
    them: "The PDF report",
    theirs: "Sends a monthly PDF full of jargon and vanity metrics. You have no idea if it actually worked.",
    ours: "Plain English: tells you in one line what it did today, what changed, and what it needs from you.",
  },
  {
    them: "The retainer",
    theirs: "6-month minimums, 12-month contracts, and exit fees. They lock you in before they deliver.",
    ours: "Month-to-month. Cancel in two clicks. We only stay if the AIs keep saying your name.",
  },
  {
    them: "Google-era only",
    theirs: "Ask them how to get into ChatGPT or Claude, and watch them stumble.",
    ours: "Built for AI: getting you recommended by AI engines is the only thing we do.",
  },
]

export function AgencySection() {
  return (
    <section className="ag-section ag-section--grey">
      <h2>Your SEO agency charges $2,000 a month<br /><span className="ag-quiet">for a job AI is taking over.</span></h2>
      <p className="ag-section__sub">Even a “good” Google SEO agency leaves you completely invisible in the places where customers are actually asking questions today.</p>

      <div className="ag-three">
        {contrasts.map((c) => (
          <div key={c.them} className="ag-tile">
            <div className="ag-tile__t">{c.them}</div>
            <p style={{ marginTop: 0, color: "var(--ag-fg2)" }}>{c.theirs}</p>
            <div className="ag-tile__quote"><span className="ag-who">{BRAND.agentName}</span>{c.ours}</div>
          </div>
        ))}
      </div>

      <div className="ag-math">
        <div className="ag-math__lbl">Do the math</div>
        <div className="ag-math__row">
          <div>
            <div className="ag-math__k">The traditional SEO agency</div>
            <div className="ag-math__n ag-math__n--old">$24,000<small>/yr</small></div>
            <div className="ag-math__s">~$2,000 a month · still invisible on AI</div>
          </div>
          <div className="ag-math__arrow">→</div>
          <div>
            <div className="ag-math__k">{BRAND.agentName} AI agent</div>
            <div className="ag-math__n">$1,188<small>/yr</small></div>
            <div className="ag-math__s">$99 a month · works every day</div>
          </div>
        </div>
        <div className="ag-math__foot">
          <div className="ag-math__save">Save up to <span>$22,800 a year</span></div>
          <p>…and actually show up where it matters.</p>
        </div>
      </div>
    </section>
  )
}
