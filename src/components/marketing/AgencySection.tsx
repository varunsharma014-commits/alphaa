import { BRAND } from "@/lib/brand"

// The agency problem, told from the agent's side. Numbers are the same
// $2,000/mo agency benchmark used across the site ($24,000 → $1,188).
const contrasts = [
  {
    them: "The PDF report",
    theirs: "Every month a PDF full of graphs and jargon. You nod, file it, write the cheque. You have no idea if anything worked.",
    ours: "I tell you in one line what I did today, what changed, and what I need from you. You can ask me why.",
  },
  {
    them: "The retainer",
    theirs: "6-month minimums. 12-month contracts. Exit fees. They lock you in before they deliver a result.",
    ours: "Month to month. Cancel in two clicks. I only get to stay if the AIs keep saying your name.",
  },
  {
    them: "Google-era people",
    theirs: "Ask them how they’ll get you into ChatGPT, Gemini and Claude. Watch them stumble. It’s not what they were built for.",
    ours: "It’s the only thing I do. I ask the AIs every week and fix what they can’t find.",
  },
]

export function AgencySection() {
  return (
    <section className="ag-section ag-section--grey">
      <h2>Your SEO agency charges $2,000 a month<br /><span className="ag-quiet">for a job AI is taking over.</span></h2>
      <p className="ag-section__sub">Even a good Google agency leaves you invisible where customers now ask.</p>

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
            <div className="ag-math__k">An SEO agency</div>
            <div className="ag-math__n ag-math__n--old">$24,000<small>/yr</small></div>
            <div className="ag-math__s">~$2,000 a month · still invisible on AI</div>
          </div>
          <div className="ag-math__arrow">→</div>
          <div>
            <div className="ag-math__k">{BRAND.agentName}</div>
            <div className="ag-math__n">$1,188<small>/yr</small></div>
            <div className="ag-math__s">$99 a month · works every day</div>
          </div>
        </div>
        <div className="ag-math__foot">
          <div className="ag-math__save">Save up to <span>$22,800 a year</span></div>
          <p>…and show up where your customers now ask.</p>
        </div>
      </div>
    </section>
  )
}
