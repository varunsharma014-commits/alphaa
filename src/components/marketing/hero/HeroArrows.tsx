import { Caveat } from "next/font/google"

const hand = Caveat({ subsets: ["latin"], weight: ["600"], display: "swap" })

// Two hand-drawn arrows in the side margins that sweep from the hero down into
// the live check. Decorative; they hide once the conversation starts.
const LEFT = "M138 8 C 90 30, 30 110, 22 205 C 16 270, 70 320, 150 352"

export function HeroArrows() {
  return (
    <div className={`hx-arrows ${hand.className}`} aria-hidden="true">
      <div className="hx-arrow hx-arrow--l">
        <span className="hx-arrow__note">it&apos;s live — try it</span>
        <svg viewBox="0 0 170 380" fill="none">
          <path className="hx-arrow__line" d={LEFT} pathLength={1} />
          <path className="hx-arrow__head" d="M122 332 L 152 353 L 120 368" pathLength={1} />
        </svg>
      </div>
      <div className="hx-arrow hx-arrow--r">
        <span className="hx-arrow__note">your real answers, in 60s</span>
        <svg viewBox="0 0 170 380" fill="none">
          <path className="hx-arrow__line" d={LEFT} pathLength={1} />
          <path className="hx-arrow__head" d="M122 332 L 152 353 L 120 368" pathLength={1} />
        </svg>
      </div>
    </div>
  )
}
