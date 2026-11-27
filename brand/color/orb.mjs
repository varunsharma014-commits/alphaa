// The Alphaa orb as plain SVG: the same conic gradient as the dashboard's `.ax-orb`
// (src/app/(dashboard)/workspace.css), drawn as 360 thin wedges so resvg, sharp and every
// image tool can render it (SVG has no conic gradient). Starts at 12 o'clock, clockwise,
// exactly like CSS `conic-gradient(from 0deg, ...)`.
// Keep in sync with src/lib/brand-orb.ts (the app's copy for social cards).
export const ORB_STOPS = ["#5ac8fa", "#0071e3", "#af52de", "#ff2d55", "#ff9500", "#5ac8fa"]

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")

/** Colour at a turn fraction t (0..1) around the orb. */
export function orbColor(t) {
  const seg = ORB_STOPS.length - 1
  const x = Math.min(0.999999, Math.max(0, t)) * seg
  const i = Math.floor(x), f = x - i
  const a = rgb(ORB_STOPS[i]), b = rgb(ORB_STOPS[i + 1])
  return toHex(a.map((v, k) => v + (b[k] - v) * f))
}

/** The orb's wedges as SVG elements, centred at (cx, cy), radius r. */
export function orbShapes(cx, cy, r, n = 360) {
  const out = []
  const pt = (deg) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `${(cx + r * 1.02 * Math.cos(a)).toFixed(3)} ${(cy + r * 1.02 * Math.sin(a)).toFixed(3)}`
  }
  for (let i = 0; i < n; i++) {
    const a0 = (i * 360) / n, a1 = ((i + 1.6) * 360) / n // overlap hides seams
    out.push(`<path d="M${cx} ${cy}L${pt(a0)}L${pt(a1)}Z" fill="${orbColor((i + 0.5) / n)}"/>`)
  }
  const id = `oc${Math.round(cx)}_${Math.round(cy)}_${Math.round(r)}`
  return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><g clip-path="url(#${id})">${out.join("")}</g>`
}

/**
 * A square SVG with the orb in the middle.
 * @param {{size?: number, bg?: string|null, scale?: number}} o  scale = orb diameter / size
 */
export function orbSvg({ size = 1024, bg = null, scale = 1 } = {}) {
  const r = (size * scale) / 2
  const back = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ""
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${back}${orbShapes(size / 2, size / 2, r)}</svg>`
}
