// Alphaa's mark, the orb, as plain SVG for resvg (social cards). Same conic gradient as the
// dashboard's .ax-orb and the site header (.v3-orb): drawn as thin wedges from 12 o'clock,
// clockwise, because SVG has no conic gradient. Twin of brand/color/orb.mjs (brand kit).
const STOPS = ["#5ac8fa", "#0071e3", "#af52de", "#ff2d55", "#ff9500", "#5ac8fa"]
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

function colorAt(t: number): string {
  const seg = STOPS.length - 1
  const x = Math.min(0.999999, Math.max(0, t)) * seg
  const i = Math.floor(x), f = x - i
  const a = rgb(STOPS[i]), b = rgb(STOPS[i + 1])
  return "#" + a.map((v, k) => Math.round(v + (b[k] - v) * f).toString(16).padStart(2, "0")).join("")
}

/** The orb centred at (cx, cy) with radius r, as SVG markup (defs + clipped wedges). */
export function orbShapes(cx: number, cy: number, r: number, n = 180): string {
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `${(cx + r * 1.02 * Math.cos(a)).toFixed(2)} ${(cy + r * 1.02 * Math.sin(a)).toFixed(2)}`
  }
  const id = `orb${Math.round(cx)}x${Math.round(cy)}`
  let wedges = ""
  for (let i = 0; i < n; i++) wedges += `<path d="M${cx} ${cy}L${pt((i * 360) / n)}L${pt(((i + 1.6) * 360) / n)}Z" fill="${colorAt((i + 0.5) / n)}"/>`
  return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><g clip-path="url(#${id})">${wedges}</g>`
}
