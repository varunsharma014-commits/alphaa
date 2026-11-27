// v3 copy of apple/Sections AgencyToggle (used on /compare/[slug] with a priceBlock).
// Same words and figures, verbatim; v3 tokens so it follows dark mode.
import { BRAND } from "@/lib/brand"
import { Section } from "@/components/marketing/v3"
import "./compare.css"

const A = BRAND.agentName

const ROWS: [string, string, string][] = [
  ["The report", "A monthly PDF full of jargon and vanity metrics. You have no idea if it worked.", "One line: what I did today, what changed, what I need from you."],
  ["The contract", "6-month minimums, 12-month contracts, exit fees. Locked in before they deliver.", "Month to month. Cancel online in a minute. I only stay if I keep earning it."],
  ["The scope", "Usually one channel per retainer. Ask about ChatGPT or Claude and many stumble.", "SEO and AI search and content on every plan. Reviews, social media, email and lead tracking on Pro. Ads on Growth (early access)."],
]

export function AgencyVs() {
  return (
    <Section center>
      <h2 className="v3-h2">Agencies often charge $1,000+ a month<br /><span className="v3-muted">for marketing an AI Agent now runs for you.</span></h2>
      <p className="v3-lede">Keep the money, get your time back, and show up where customers search and ask today.</p>
      <div className="vs3">
        <div className="vs3__col">
          <div className="vs3__name">Marketing agency (example)</div>
          <div className="vs3__price"><b>$1,000+</b><span>/mo</span></div>
          <div className="vs3__year">for example, $12,000+ a year</div>
        </div>
        <div className="vs3__col vs3__col--us">
          <div className="vs3__name">{A}</div>
          <div className="vs3__price"><b>$99</b><span>/mo</span></div>
          <div className="vs3__year">$1,188 a year</div>
        </div>
        {ROWS.map(([k, them, us]) => (
          <div key={k} className="vs3__row">
            <div className="vs3__k">{k}</div>
            <p className="vs3__them">{them}</p>
            <p className="vs3__us">{us}</p>
          </div>
        ))}
        <div className="vs3__save">
          <span>For example, against a $1,000 a month agency, save</span>
          <b>$10,812 a year</b>
          <em>…and your marketing still gets done every week.</em>
        </div>
      </div>
    </Section>
  )
}
