// "With Alphaa / Without Alphaa" (homepage, 2026-11-26). Two columns of plain, true contrasts
// (no stats) and one illustration each, drawn here in inline SVG: flat line style in the site's
// own colour tokens, so it follows light and dark mode. No stock, web or AI-made images.
// Server component: every word is crawlable.
import "./with-without.css"

const WITHOUT = [
  "Sunday nights writing posts",
  "No idea if ChatGPT knows you exist",
  "Google profile untouched for months",
  "Reviews waiting weeks for a reply",
  "Past customers never hear from you again",
  "Paying for marketing and hoping it works",
]

const WITH = [
  "Posts ready every week, in your voice",
  "A weekly check of what 4 AIs say about you",
  "Fresh Google updates, written for you",
  "Every review answered in your voice",
  "Past customers get a note that brings them back",
  "A plain-English briefing of what’s working",
]

export function WithWithout() {
  return (
    <div className="ww">
      <section className="ww-col ww-col--without" aria-labelledby="ww-without">
        <div className="ww-art"><BuriedFounder /></div>
        <h3 id="ww-without" className="ww-title"><span className="ww-dot" aria-hidden="true" />Without Alphaa</h3>
        <ul className="ww-list">
          {WITHOUT.map((t) => <li key={t}><span className="ww-ic ww-ic--x" aria-hidden="true" />{t}</li>)}
        </ul>
      </section>
      <section className="ww-col ww-col--with" aria-labelledby="ww-with">
        <div className="ww-art"><RelaxedOwner /></div>
        <h3 id="ww-with" className="ww-title"><span className="ww-dot" aria-hidden="true" />With Alphaa</h3>
        <ul className="ww-list">
          {WITH.map((t) => <li key={t}><span className="ww-ic ww-ic--ok" aria-hidden="true" />{t}</li>)}
        </ul>
      </section>
    </div>
  )
}

/** A founder at a desk behind a laptop full of tabs, hands on head, papers piling up, badges everywhere. */
function BuriedFounder() {
  return (
    <svg viewBox="0 0 320 220" role="img" aria-labelledby="ww-a1" className="ww-svg">
      <title id="ww-a1">Illustration: a stressed business owner at a desk, hands on their head, behind a laptop full of open tabs, with stacks of paper, coffee cups and notification badges piling up late at night.</title>
      {/* backdrop */}
      <ellipse cx="160" cy="118" rx="138" ry="92" className="f-soft" />
      {/* clock, late */}
      <circle cx="268" cy="44" r="16" className="f-card s-ink" strokeWidth="2.5" />
      <path d="M268 34v10l-7 5" className="s-ink" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* flying papers */}
      <g className="f-card s-ink" strokeWidth="2">
        <rect x="44" y="46" width="30" height="38" rx="3" transform="rotate(-16 59 65)" />
        <rect x="222" y="74" width="26" height="34" rx="3" transform="rotate(14 235 91)" />
      </g>
      <g className="s-mute" strokeWidth="2" strokeLinecap="round">
        <path d="M49 58h16M50 65h18M51 72h12" transform="rotate(-16 59 65)" />
        <path d="M227 85h14M227 92h16" transform="rotate(14 235 91)" />
      </g>
      {/* person: hands on head */}
      <path d="M128 168c0-26 14-42 32-42s32 16 32 42" className="f-accent" />
      <circle cx="160" cy="98" r="20" className="f-card s-ink" strokeWidth="2.5" />
      <path d="M132 142c-6-16-4-32 8-42M188 142c6-16 4-32-8-42" className="s-ink" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M150 92l7 2M170 92l-7 2" className="s-ink" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="153" cy="99" r="1.8" className="f-ink" />
      <circle cx="167" cy="99" r="1.8" className="f-ink" />
      <path d="M152 110q4-4 8 0t8 0" className="s-ink" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="141" cy="99" r="5.5" className="f-card s-ink" strokeWidth="2.2" />
      <circle cx="179" cy="99" r="5.5" className="f-card s-ink" strokeWidth="2.2" />
      <path d="M188 76c3 5 4 8 1 10s-6-2-4-5z" className="f-accent2" />
      {/* laptop full of tabs */}
      <rect x="104" y="120" width="112" height="56" rx="5" className="f-card s-ink" strokeWidth="2.5" />
      <g className="f-mute">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <rect key={i} x={108 + i * 11.6} y="124" width="9.6" height="6" rx="1.5" />)}
      </g>
      <path d="M114 142h60M114 151h80M114 160h48" className="s-mute" strokeWidth="3" strokeLinecap="round" />
      <path d="M94 176h132l-6 8H100z" className="f-card s-ink" strokeWidth="2.5" strokeLinejoin="round" />
      {/* desk */}
      <path d="M24 184h272" className="s-ink" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 184v24M280 184v24" className="s-ink" strokeWidth="3" strokeLinecap="round" />
      {/* paper stacks */}
      <g className="f-card s-ink" strokeWidth="2">
        <rect x="34" y="166" width="48" height="10" rx="2" />
        <rect x="38" y="156" width="46" height="10" rx="2" transform="rotate(-3 61 161)" />
        <rect x="32" y="146" width="48" height="10" rx="2" transform="rotate(4 56 151)" />
        <rect x="40" y="136" width="44" height="10" rx="2" transform="rotate(-5 62 141)" />
        <rect x="236" y="166" width="46" height="10" rx="2" />
        <rect x="240" y="156" width="42" height="10" rx="2" transform="rotate(5 261 161)" />
      </g>
      {/* coffee cups */}
      <g className="f-card s-ink" strokeWidth="2.2">
        <path d="M92 160h14v16a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
        <path d="M226 162h12v14a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z" />
      </g>
      {/* notification badges */}
      <g>
        <circle cx="214" cy="118" r="11" className="f-bad" />
        <text x="214" y="122" textAnchor="middle" className="t-badge">23</text>
        <circle cx="100" cy="112" r="10" className="f-bad" />
        <text x="100" y="116" textAnchor="middle" className="t-badge">9+</text>
        <circle cx="250" cy="138" r="9" className="f-bad" />
        <text x="250" y="142" textAnchor="middle" className="t-badge">!</text>
      </g>
    </svg>
  )
}

/** The same owner, leaning back with a coffee, laptop closed, a "done" card floating by. */
function RelaxedOwner() {
  return (
    <svg viewBox="0 0 320 220" role="img" aria-labelledby="ww-a2" className="ww-svg">
      <title id="ww-a2">Illustration: a relaxed, smiling business owner leaning back in a chair with hands behind their head, laptop closed, a coffee and a plant nearby, while a card shows this week’s marketing is done.</title>
      <ellipse cx="160" cy="118" rx="138" ry="92" className="f-soft" />
      {/* sun */}
      <circle cx="270" cy="44" r="12" className="f-accent2" />
      <path d="M270 22v-6M270 72v-6M248 44h-6M298 44h-6M254 28l-4-4M290 64l-4-4M286 28l4-4M250 64l4-4" className="s-accent2" strokeWidth="2.5" strokeLinecap="round" />
      {/* "done" card */}
      <rect x="28" y="30" width="128" height="50" rx="12" className="f-card s-line" strokeWidth="1.5" />
      <circle cx="50" cy="55" r="11" className="f-good" />
      <path d="M45 55l4 4 7-8" className="s-white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M70 48h66M70 60h46" className="s-mute" strokeWidth="5" strokeLinecap="round" />
      {/* plant */}
      <path d="M262 186l-4-34h28l-4 34z" className="f-card s-ink" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M272 152c-2-16-12-22-20-24 2 10 8 20 20 24zM272 152c2-18 12-26 22-28-2 12-10 22-22 28zM272 152v-30" className="f-good2 s-ink" strokeWidth="2" strokeLinejoin="round" />
      {/* chair */}
      <path d="M118 102c-8 26-4 56 6 76h82" className="s-ink" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M140 178l-8 22M196 178l8 22" className="s-ink" strokeWidth="4" strokeLinecap="round" />
      {/* person, leaning back, hands behind head */}
      <path d="M128 168c-4-22 4-46 24-52 16-4 30 8 34 28l4 24z" className="f-accent" />
      <path d="M186 160l32-4 16 14" className="s-ink" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M232 172h12" className="s-ink" strokeWidth="8" strokeLinecap="round" />
      <path d="M138 122c-10-6-14-20-6-30M168 120c8-8 8-22 0-30" className="s-ink" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="150" cy="92" r="20" className="f-card s-ink" strokeWidth="2.5" />
      <path d="M141 90q3-3 6 0M154 90q3-3 6 0" className="s-ink" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M143 99q7 7 14 0" className="s-ink" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* side table, closed laptop, coffee */}
      <path d="M40 150h62M50 150v50M92 150v50" className="s-ink" strokeWidth="3" strokeLinecap="round" />
      <rect x="48" y="142" width="40" height="7" rx="2" className="f-card s-ink" strokeWidth="2" />
      <path d="M74 120h14v16a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" className="f-card s-ink" strokeWidth="2.2" />
      <path d="M88 124c6 0 6 8 0 8" className="s-ink" strokeWidth="2" fill="none" />
      <path d="M78 114c-3-4 3-6 0-10M84 114c-3-4 3-6 0-10" className="s-mute" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* floor */}
      <path d="M24 204h272" className="s-line" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
