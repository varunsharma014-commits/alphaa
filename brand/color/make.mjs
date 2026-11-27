// Builds the Alphaa colour brand kit into brand/color/ (run from the repo root):
//   node brand/color/make.mjs
// Orb files come from orb.mjs (SVG wedges, rendered with sharp); covers, avatar and the newsletter
// template are HTML in src/ rendered by headless Chrome (chrome.mjs). Ends with preview.png.
import sharp from "sharp"
import path from "path"
import { readFile, writeFile, stat, mkdir } from "fs/promises"
import { fileURLToPath } from "url"
import opentype from "opentype.js"
import { orbSvg, orbShapes } from "./orb.mjs"
import { shot } from "./chrome.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "../..")
const out = (f) => path.join(here, f)
await mkdir(out("covers"), { recursive: true })
await mkdir(out("logo"), { recursive: true })

// 1. Orb mark: SVG + transparent PNGs + on-white PNGs.
await writeFile(out("logo/alphaa-orb.svg"), orbSvg({ size: 1024 }))
await writeFile(out("logo/alphaa-orb-on-white.svg"), orbSvg({ size: 1024, bg: "#ffffff", scale: 0.72 }))
for (const s of [512, 900, 1024]) {
  await sharp(Buffer.from(orbSvg({ size: s }))).png().toFile(out(`logo/alphaa-orb-${s}.png`))
  await sharp(Buffer.from(orbSvg({ size: s, bg: "#ffffff", scale: 0.72 }))).png().toFile(out(`logo/alphaa-orb-on-white-${s}.png`))
}
// Marketplace forms often cap uploads at 50KB: 900px on white, palette PNG.
await sharp(Buffer.from(orbSvg({ size: 900, bg: "#ffffff", scale: 0.72 }))).png({ palette: true, colors: 128, compressionLevel: 9, effort: 10 }).toFile(out("logo/alphaa-orb-on-white-900-small.png"))

// 2. Lockup: orb + "alphaa" wordmark (Inter Bold paths, tracking -0.03em, like the site's .v3-logo).
const fbuf = await readFile(path.join(root, "scripts/assets/blog-cover/inter-latin-700-normal.woff"))
const font = opentype.parse(fbuf.buffer.slice(fbuf.byteOffset, fbuf.byteOffset + fbuf.byteLength))
function lockupSvg({ bg = null, ink = "#111114" } = {}) {
  const H = 400, size = 250, track = -0.03 * size, orbD = 210, gap = 64, pad = 60
  let x = pad + orbD + gap, d = ""
  for (const ch of "alphaa") { d += font.getPath(ch, x, 0, size).toPathData(2); x += font.getAdvanceWidth(ch, size) + track }
  const W = Math.ceil(x - track + pad)
  // Optical: centre the x-height (~0.55 em) on the orb.
  const base = H / 2 + size * 0.545 / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg ? `<rect width="${W}" height="${H}" fill="${bg}"/>` : ""}${orbShapes(pad + orbD / 2, H / 2, orbD / 2)}<path transform="translate(0 ${base.toFixed(1)})" d="${d}" fill="${ink}"/></svg>`
}
await writeFile(out("logo/alphaa-lockup.svg"), lockupSvg())
await writeFile(out("logo/alphaa-lockup-white-ink.svg"), lockupSvg({ ink: "#ffffff" }))
await sharp(Buffer.from(lockupSvg())).png().toFile(out("logo/alphaa-lockup.png"))
await sharp(Buffer.from(lockupSvg({ bg: "#ffffff" }))).png().toFile(out("logo/alphaa-lockup-on-white.png"))
await sharp(Buffer.from(lockupSvg({ ink: "#ffffff" }))).png().toFile(out("logo/alphaa-lockup-white-ink.png"))

// 3. HTML pages via Chrome.
const pages = [
  ["src/avatar.html", 1080, 1080, "covers/alphaa-avatar-1080.png"],
  ["src/li-cover.html", 1128, 191, "covers/alphaa-linkedin-cover-1128x191.png"],
  ["src/li-cover.html", 4200, 700, "covers/alphaa-linkedin-cover-4200x700.png"],
  ["src/fb-cover.html", 1640, 624, "covers/alphaa-facebook-cover-1640x624.png"],
  ["src/x-header.html", 1500, 500, "covers/alphaa-x-header-1500x500.png"],
  ["src/newsletter-cover.html", 1920, 1080, "covers/alphaa-newsletter-cover-example-1920x1080.png"],
]
for (const [src, w, h, o] of pages) await shot(out(src), w, h, out(o))
// LinkedIn newsletter logo (min 300x300): the avatar, downsized.
await sharp(out("covers/alphaa-avatar-1080.png")).resize(512, 512).png().toFile(out("covers/alphaa-newsletter-logo-512.png"))

// 4. Preview sheet.
const tiles = [
  ["logo/alphaa-orb-1024.png", "Orb · transparent"], ["logo/alphaa-orb-on-white-1024.png", "Orb · on white"],
  ["covers/alphaa-avatar-1080.png", "Avatar 1080 (circle-safe)"], ["../social/posts/color/w4_guarantee.png", "Post 1080x1350"],
  ["logo/alphaa-lockup-on-white.png", "Lockup (orb + wordmark)"], ["covers/alphaa-linkedin-cover-4200x700.png", "LinkedIn cover 1128x191 / 4200x700"],
  ["covers/alphaa-facebook-cover-1640x624.png", "Facebook cover 1640x624"], ["covers/alphaa-x-header-1500x500.png", "X header 1500x500"],
  ["covers/alphaa-newsletter-cover-example-1920x1080.png", "Newsletter / article cover 1920x1080"], ["../social/posts/color/w4_guarantee-x.png", "Post 1600x900 (X)"],
]
const fig = []
for (const [f, label] of tiles) {
  try { await stat(out(f)); fig.push(`<figure class="${/(cover-|header-|-x\.png|lockup)/.test(f) ? "wide" : ""}"><img src="../${f}"><figcaption>${label}</figcaption></figure>`) } catch {}
}
await writeFile(out("src/preview.html"), `<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href=../../social/base-color.css><style>
html,body{width:2000px;height:2260px;background:#f6f6f8}
.sheet{padding:70px;display:grid;grid-template-columns:repeat(4,1fr);gap:28px;align-content:start}
header{grid-column:1/-1;display:flex;align-items:center;gap:18px;font-size:44px;font-weight:800;letter-spacing:-.03em}
header .orb{width:56px;height:56px}header small{font-size:22px;font-weight:500;color:var(--muted);letter-spacing:0;margin-left:12px}
.sw{grid-column:1/-1;display:flex;gap:12px}.sw span{flex:1;border-radius:18px;padding:18px;font-size:18px;font-weight:700}
figure{background:#fff;border:1px solid var(--line);border-radius:22px;padding:18px;box-shadow:var(--shadow)}
figure.wide{grid-column:span 2}
figure img{display:block;width:100%;max-height:560px;object-fit:contain;border-radius:12px;background:repeating-conic-gradient(#f0f0f3 0 25%,#fff 0 50%) 0 0/24px 24px}
figcaption{font-size:18px;font-weight:600;color:var(--fg2);margin-top:12px}
</style></head><body><div class=sheet><header><span class=orb></span>alphaa brand kit<small>colour system · 2026-11-26</small></header>
<div class=sw><span style="background:var(--mk-2);color:var(--mk-ink)">Social #e8457a</span><span style="background:var(--ad-2);color:var(--ad-ink)">Ads #2f6fde</span><span style="background:var(--ct-2);color:var(--ct-ink)">Content #b07a00</span><span style="background:var(--se-2);color:var(--se-ink)">SEO &amp; AI #1f9d55</span><span style="background:var(--em-2);color:var(--em-ink)">Email #7a4fd6</span><span style="background:#111114;color:#fff">Ink #111114</span></div>
${fig.join("\n")}</div></body></html>`)
await shot(out("src/preview.html"), 2000, 2260, out("preview.png"))
console.log("brand/color built")
