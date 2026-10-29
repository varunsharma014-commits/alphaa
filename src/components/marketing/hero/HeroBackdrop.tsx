// Quiet motion behind the hero: a fading grid and a soft glow. Decorative only.
export function HeroBackdrop() {
  return (
    <div className="hx-bg" aria-hidden="true">
      <div className="hx-grid" />
      <div className="hx-glow" />
    </div>
  )
}
