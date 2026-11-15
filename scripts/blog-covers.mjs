// Generates a black & white title cover for every blog post:
//   public/blog-covers/<slug>.jpg      hero, card, og:image, sitemap, RSS
//   public/blog-covers/_backdrop.jpg   text-free, for hero backgrounds
// No stock photos, AI images or third-party graphics, so there is nothing for
// image-rights trackers (Copytrack etc.) to match. Text is drawn as vector
// paths from the bundled Inter (OFL) fonts, rasterised with resvg, encoded as
// JPEG. src/content/blog/index.ts points every post at its cover by slug, so
// a post's meta needs no image field.
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
const BG = "#000000", WHITE = "#FFFFFF", GREY = "#A1A1A6", LINE = "#2A2A2A"
const PAD = 80

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

export async function renderCover({ title = "", tag, bare = false }) {
  const f = await loadFonts()
  const parts = []

  // dot grid, as on the site
  let dots = ""
  for (let x = 20; x < W; x += 28) for (let y = 20; y < H; y += 28) dots += `M${x} ${y}h1.4v1.4h-1.4z`
  parts.push(`<path d="${dots}" fill="#FFFFFF" fill-opacity="0.08"/>`)

  // answer-engine motif: concentric rings around a diamond, bottom-right
  const cx = W - 150, cy = H - 120
  parts.push(`<circle cx="${cx}" cy="${cy}" r="420" fill="url(#glow)"/>`)
  for (let k = 0; k < 7; k++) {
    const r = 70 + k * 62
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#FFFFFF" stroke-opacity="${(0.34 - k * 0.042).toFixed(2)}" stroke-width="${k === 0 ? 2 : 1.4}"/>`)
  }
  const s = 26
  parts.push(`<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="5" fill="#FFFFFF" transform="rotate(45 ${cx} ${cy})"/>`)
  ;[[-200, -150], [120, -250], [-330, 40]].forEach(([dx, dy], i) =>
    parts.push(`<circle cx="${cx + dx}" cy="${cy + dy}" r="${5 - i}" fill="#FFFFFF" fill-opacity="0.7"/>`))

  if (!bare) {
    // brand: diamond + "alphaa" (matches the /og card), then the tag
    const by = 92
    parts.push(`<rect x="${PAD + 3}" y="${by - 21}" width="18" height="18" rx="3" fill="${WHITE}" transform="rotate(45 ${PAD + 12} ${by - 12})"/>`)
    parts.push(pathFor(f.bold, "alphaa", PAD + 34, by, 30, WHITE, -0.02))
    if (tag) {
      const tx = PAD + 34 + widthOf(f.bold, "alphaa", 30, -0.02) + 26
      const t = tag.toUpperCase(), ts = 16
      const tw = widthOf(f.bold, t, ts, 0.08)
      parts.push(`<rect x="${tx}" y="${by - 27}" width="${tw + 30}" height="34" rx="17" fill="none" stroke="#3A3A3A" stroke-width="1.5"/>`)
      parts.push(pathFor(f.bold, t, tx + 15, by - 4, ts, "#E6E6E6", 0.08))
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
    lines.forEach((l, n) => parts.push(pathFor(f.bold, l, PAD, y0 + size * 0.92 + n * lh, size, WHITE)))

    // footer
    parts.push(`<rect x="${PAD}" y="${H - 88}" width="560" height="1.5" fill="${LINE}"/>`)
    parts.push(pathFor(f.regular, "alphaa.app", PAD, H - 50, 22, GREY, 0))
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><radialGradient id="glow"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.10"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="${BG}"/>
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
