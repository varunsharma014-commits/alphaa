// Generates a title cover for every blog post in Alphaa's colour system (2026-11-26, was
// black & white): a pastel block in one of the site's five service tones, ink headline,
// the orb + "alphaa" mark (brand/color/README.md).
//   public/blog-covers/<slug>.jpg      hero, card, og:image, sitemap, RSS
//   public/blog-covers/_backdrop.jpg   text-free, for hero backgrounds
// No stock photos, AI images or third-party graphics, so there is nothing for
// image-rights trackers (Copytrack etc.) to match. Text is drawn as vector
// paths from the bundled Inter (OFL) fonts, rasterised with resvg, encoded as
// JPEG. src/content/blog/index.ts points every post at its cover by slug, so
// a post's meta needs no image field. The tone comes from the post's topic
// (social / ads / email / content words in the title), else its tag, else a
// stable hash of the slug, so a cover never changes colour by itself.
//
// Usage:
//   node scripts/blog-covers.mjs            # create covers that are missing
//   node scripts/blog-covers.mjs --force    # regenerate every cover
//   node scripts/blog-covers.mjs --slug x   # (re)generate one post's cover
// Runs (missing-only) at the start of `npm run build`.
import { readFile, writeFile, mkdir, access, readdir } from "fs/promises"
import path from "path"
import opentype from "opentype.js"
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"

const ROOT = process.cwd()
const ASSETS = path.join(ROOT, "scripts/assets/blog-cover")
const OUT_DIR = path.join(ROOT, "public/blog-covers")
const POSTS_DIR = path.join(ROOT, "src/content/blog")

export const W = 1200, H = 675
const INK = "#111114", MUTED = "#5f6068", LINE = "#dcdce2"
const PAD = 80

// The site's service tones (src/components/marketing/v3/v3.css): tint, soft, strong, ink, and two
// neighbouring softs for the corner blobs.
const TONES = {
  mk: { bg: "#fff0f4", soft: "#ffd6e2", c: "#e8457a", ink: "#c2255c", n1: "#ffedb3", n2: "#e1d4ff" },
  ad: { bg: "#eef4ff", soft: "#d4e3ff", c: "#2f6fde", ink: "#2f6fde", n1: "#e1d4ff", n2: "#c9efd8" },
  ct: { bg: "#fffaeb", soft: "#ffedb3", c: "#b07a00", ink: "#8a5f00", n1: "#ffd6e2", n2: "#c9efd8" },
  se: { bg: "#effaf3", soft: "#c9efd8", c: "#1f9d55", ink: "#17803f", n1: "#d4e3ff", n2: "#ffedb3" },
  em: { bg: "#f5f0ff", soft: "#e1d4ff", c: "#7a4fd6", ink: "#7a4fd6", n1: "#ffd6e2", n2: "#d4e3ff" },
}
const TOPIC = [
  ["mk", /\b(social media|instagram|facebook|tiktok|linkedin|pinterest|reels?|social posts?)\b/i],
  ["ad", /\b(ads|advertising|ppc|google ads|meta ads|paid search|ad spend|campaigns?)\b/i],
  ["em", /\b(email|newsletters?|inbox|drip)\b/i],
]
const BY_TAG = {
  guide: "se", "how-to": "se", "aeo guide": "se", "technical guide": "se", checklist: "se",
  playbook: "ad", comparison: "em", industry: "mk",
  mechanism: "ct", explainer: "ct", technical: "ct", glossary: "ct",
}
const ORDER = ["mk", "ad", "ct", "se", "em"]
export function toneFor({ title = "", tag, slug = "" } = {}) {
  for (const [t, re] of TOPIC) if (re.test(title)) return t
  const byTag = BY_TAG[(tag ?? "").toLowerCase()]
  if (byTag) return byTag
  let h = 7
  for (const ch of slug || title) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return ORDER[h % ORDER.length]
}

// The orb (dashboard .ax-orb / site .v3-orb): a conic gradient drawn as thin wedges, since SVG
// has none. Same as brand/color/orb.mjs and src/lib/brand-orb.ts.
const STOPS = ["#5ac8fa", "#0071e3", "#af52de", "#ff2d55", "#ff9500", "#5ac8fa"]
function orb(cx, cy, r, n = 180) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const col = (t) => {
    const x = Math.min(0.999999, t) * (STOPS.length - 1), i = Math.floor(x), f = x - i
    const a = rgb(STOPS[i]), b = rgb(STOPS[i + 1])
    return "#" + a.map((v, k) => Math.round(v + (b[k] - v) * f).toString(16).padStart(2, "0")).join("")
  }
  const pt = (deg) => { const a = ((deg - 90) * Math.PI) / 180; return `${(cx + r * 1.02 * Math.cos(a)).toFixed(2)} ${(cy + r * 1.02 * Math.sin(a)).toFixed(2)}` }
  let w = ""
  for (let i = 0; i < n; i++) w += `<path d="M${cx} ${cy}L${pt((i * 360) / n)}L${pt(((i + 1.6) * 360) / n)}Z" fill="${col((i + 0.5) / n)}"/>`
  const id = `o${Math.round(cx)}_${Math.round(cy)}`
  return `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#${id})">${w}</g>`
}

let fonts
async function loadFonts() {
  if (fonts) return fonts
  const load = async (w) => {
    const buf = await readFile(path.join(ASSETS, `inter-latin-${w}-normal.woff`))
    return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  }
  fonts = { regular: await load(400), bold: await load(700) }
  return fonts
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function wrap(font, text, size, maxW) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ""
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (font.getAdvanceWidth(t, size) <= maxW || !cur) cur = t
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}

// Tight tracking like the site's headlines (-0.03em).
function pathFor(font, text, x, y, size, fill, track = -0.03) {
  let d = "", cx = x
  for (const ch of text) {
    d += font.getPath(ch, cx, y, size).toPathData(2)
    cx += font.getAdvanceWidth(ch, size) + track * size
  }
  return `<path d="${d}" fill="${fill}"/>`
}
const widthOf = (font, text, size, track = -0.03) =>
  [...text].reduce((w, ch) => w + font.getAdvanceWidth(ch, size) + track * size, 0)

export async function renderCover({ title = "", tag, slug = "", bare = false }) {
  const f = await loadFonts()
  const T = TONES[bare ? "em" : toneFor({ title, tag, slug })]
  const parts = []
  const blob = (id, c) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
  const defs = bare
    // Text-free backdrop: the final-CTA blend (pink, blue, green, yellow corners over pink → purple → blue).
    ? `<linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0f4"/><stop offset=".5" stop-color="#f5f0ff"/><stop offset="1" stop-color="#eef4ff"/></linearGradient>${blob("b1", "#ffd6e2")}${blob("b2", "#d4e3ff")}${blob("b3", "#c9efd8")}${blob("b4", "#ffedb3")}`
    : `${blob("b1", T.soft)}${blob("b2", T.n1)}${blob("b3", T.n2)}`
  parts.push(`<rect width="${W}" height="${H}" fill="${bare ? "url(#base)" : T.bg}"/>`)
  if (bare) {
    parts.push(`<circle cx="0" cy="0" r="560" fill="url(#b1)"/><circle cx="${W}" cy="0" r="560" fill="url(#b2)"/>`)
    parts.push(`<circle cx="${W}" cy="${H}" r="560" fill="url(#b3)"/><circle cx="0" cy="${H}" r="520" fill="url(#b4)"/>`)
  } else {
    parts.push(`<circle cx="${W}" cy="0" r="620" fill="url(#b1)"/><circle cx="0" cy="${H}" r="460" fill="url(#b2)"/><circle cx="${W - 120}" cy="${H}" r="420" fill="url(#b3)"/>`)
  }

  // answer-engine motif, bottom-right: soft rings in the tone around the orb
  const cx = W - 150, cy = H - 120
  for (let k = 0; k < 7; k++) {
    const r = 70 + k * 62
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${bare ? "#7a4fd6" : T.c}" stroke-opacity="${(0.30 - k * 0.038).toFixed(3)}" stroke-width="${k === 0 ? 2 : 1.4}"/>`)
  }
  parts.push(orb(cx, cy, 24))
  ;[[-200, -150], [120, -250], [-330, 40]].forEach(([dx, dy], i) =>
    parts.push(`<circle cx="${cx + dx}" cy="${cy + dy}" r="${5 - i}" fill="${bare ? "#7a4fd6" : T.c}" fill-opacity="0.55"/>`))

  if (!bare) {
    // brand: orb + "alphaa" (as in the site header and the /og card), then the tag pill
    const by = 92
    parts.push(orb(PAD + 13, by - 11, 13))
    parts.push(pathFor(f.bold, "alphaa", PAD + 36, by, 30, INK, -0.03))
    if (tag) {
      const tx = PAD + 36 + widthOf(f.bold, "alphaa", 30, -0.03) + 26
      const t = tag.toUpperCase(), ts = 16
      const tw = widthOf(f.bold, t, ts, 0.08)
      parts.push(`<rect x="${tx}" y="${by - 27}" width="${tw + 30}" height="34" rx="17" fill="${T.soft}"/>`)
      parts.push(pathFor(f.bold, t, tx + 15, by - 4, ts, T.ink, 0.08))
    }

    // title, auto-fit
    const maxW = 860, top = 150, maxH = 370
    let size = 76, lines, lh
    for (; size >= 34; size -= 2) {
      lines = wrap(f.bold, title, size, maxW)
      lh = Math.round(size * 1.08)
      if (lines.length * lh <= maxH && lines.length <= 5 && lines.every((l) => widthOf(f.bold, l, size) <= maxW)) break
    }
    const y0 = top + Math.max(0, Math.round((maxH - lines.length * lh) / 2))
    lines.forEach((l, n) => parts.push(pathFor(f.bold, l, PAD, y0 + size * 0.92 + n * lh, size, INK)))

    // footer
    parts.push(`<rect x="${PAD}" y="${H - 88}" width="560" height="1.5" fill="${LINE}"/>`)
    parts.push(pathFor(f.regular, "alphaa.app", PAD, H - 50, 22, MUTED, 0))
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${defs}</defs>
${parts.join("\n")}
<title>${esc(title)}</title>
</svg>`
  const r = new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { loadSystemFonts: false } }).render()
  return jpeg.encode({ data: r.pixels, width: r.width, height: r.height }, 84).data
}

const str = (src, key) => {
  const m = src.match(new RegExp(`\\n\\s*${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`))
  return m ? JSON.parse(`"${m[1]}"`) : undefined
}

export async function readPosts() {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith(".tsx"))
  const posts = []
  for (const f of files) {
    const src = await readFile(path.join(POSTS_DIR, f), "utf-8")
    const meta = src.split(/export const meta\b/)[1]
    if (!meta) continue
    const head = meta.split(/\n\s*(takeaways|sources):/)[0]
    const slug = str(head, "slug"), title = str(head, "title")
    if (slug && title) posts.push({ slug, title, tag: str(head, "tag") })
  }
  return posts
}

const exists = (p) => access(p).then(() => true, () => false)

export async function generateBlogCovers({ force = false, slug } = {}) {
  await mkdir(OUT_DIR, { recursive: true })
  const backdrop = path.join(OUT_DIR, "_backdrop.jpg")
  if (force || !(await exists(backdrop))) await writeFile(backdrop, await renderCover({ bare: true }))
  let posts = await readPosts()
  if (slug) posts = posts.filter((p) => p.slug === slug)
  let made = 0
  for (const p of posts) {
    const out = path.join(OUT_DIR, `${p.slug}.jpg`)
    if (!force && !slug && (await exists(out))) continue
    await writeFile(out, await renderCover(p))
    made++
  }
  console.log(`blog covers: ${made} generated, ${posts.length} posts`)
  return made
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2)
  const i = a.indexOf("--slug")
  generateBlogCovers({ force: a.includes("--force"), slug: i >= 0 ? a[i + 1] : undefined }).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
