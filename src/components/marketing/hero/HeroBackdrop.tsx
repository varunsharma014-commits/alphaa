// Quiet motion behind the hero: a fading grid and a few "the AI just
// recommended you" cards drifting at the edges. Decorative only.
const CARDS = [
  { engine: "ChatGPT", dot: "#1d1d1f", text: "Recommended your business", pos: "hx-c1" },
  { engine: "Perplexity", dot: "#1d1d1f", text: "Cited your FAQ page", pos: "hx-c2" },
  { engine: "Claude", dot: "#1d1d1f", text: "Named you first", pos: "hx-c3" },
  { engine: "Gemini", dot: "#1d1d1f", text: "Listed you in top 3", pos: "hx-c4" },
  { engine: "Google", dot: "#1d1d1f", text: "New 5★ review — reply posted", pos: "hx-c5" },
  { engine: "Your site", dot: "#1d1d1f", text: "New page published", pos: "hx-c6" },
]

export function HeroBackdrop() {
  return (
    <div className="hx-bg" aria-hidden="true">
      <div className="hx-grid" />
      <div className="hx-glow" />
      {CARDS.map((c) => (
        <div key={c.pos} className={`hx-card ${c.pos}`}>
          <span className="hx-card__dot" style={{ background: c.dot }} />
          <span className="hx-card__t"><b>{c.engine}</b>{c.text}</span>
        </div>
      ))}
    </div>
  )
}
