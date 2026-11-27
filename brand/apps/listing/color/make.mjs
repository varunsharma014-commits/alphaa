// App listing images in the colour system (Shopify App Store, Webflow Marketplace, icons).
//   1. local dev server + node brand/apps/listing/color/shoot.mjs   (dashboard shots from /preview, sample data)
//   2. node brand/apps/listing/color/make.mjs                       (frames, icons, ../preview-color.png)
// Shopify: 1600x900 feature + screenshots, NO prices on images (Shopify listing rules; plans live in
// Shopify's pricing section). Webflow: 1280x846 screenshots, 900px icon under 50KB.
// Text only + real UI with sample data. No stock/AI photos, no people, no invented numbers.
import path from "path"
import sharp from "sharp"
import { writeFile, mkdir, stat } from "fs/promises"
import { fileURLToPath } from "url"
import { shot } from "../../../color/chrome.mjs"
import { orbSvg } from "../../../color/orb.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const P = (f) => path.join(here, f)
for (const d of ["shopify", "webflow", "icons", "src/html"]) await mkdir(P(d), { recursive: true })

const PILLS = `<div class=pills><span class="pill mk">Social media</span><span class="pill ct">Content</span><span class="pill se">SEO &amp; AI search</span><span class="pill em">Email</span><span class="pill ad">Ads<small>· early access</small></span></div>`
const LOCK = `<div class=lock><span class=orb></span>alphaa</div>`
const win = (s, url) => `<div class=win><div class=bar><i></i><i></i><i></i><span>${url}</span></div><div class=vp><img src="../shots/${s}.png"></div><span class=exl>EXAMPLE DATA</span></div>`
const left = (f) => `<div class=l>${LOCK}${f.tag ? `<div class=tag>${f.tag}</div>` : ""}<h1>${f.h}</h1>${f.sub ? `<p class=sub>${f.sub}</p>` : ""}${f.pills ? PILLS : ""}</div>`

const PLANS = `<div class=plans>
<div class=plan><h3>Starter</h3><div class=pr>$99<small>/month</small></div><span class="badge pill se">AI search</span><ul><li>Weekly checks on ChatGPT, Gemini, Claude and Perplexity</li><li>Wrong facts corrected, website fixes</li><li>2 blog posts a month</li></ul></div>
<div class="plan rec"><h3>Pro</h3><div class=pr>$499<small>/month</small></div><span class="badge pill em">Everything except ads</span><ul><li>Starter, plus social media posts</li><li>Google Business posts and review replies</li><li>Email to your customers</li><li>4 blog posts a month</li></ul></div>
<div class=plan><h3>Growth</h3><div class=pr>$799<small>/month</small></div><span class="badge pill ad">Early access</span><ul><li>Pro, plus Google or Meta ads</li><li>Within the monthly limit you set</li></ul></div></div>`

const W = { shopify: [1600, 900, { pad: "90px", gap: "60px", lw: "500px", h: "62px", s: "22px", ww: "1080px", bleed: "130px" }], webflow: [1280, 846, { pad: "60px", gap: "40px", lw: "390px", h: "48px", s: "18px", ww: "880px", bleed: "90px" }] }
const FRAMES = [
  // Shopify App Store (no prices)
  { m: "shopify", id: "alphaa-shopify-feature", blend: true, h: "Your AI <span>marketing agent</span>", sub: "Social, content, SEO &amp; AI search and email, done every week for your store. You approve.", pills: true, shot: "briefing" },
  { m: "shopify", id: "alphaa-shopify-1-ai-answers", tone: "ad", tag: "SEO &amp; AI search", h: "See what <span>ChatGPT, Gemini, Claude and Perplexity</span> say", sub: "Who named you, who they named instead, and the pages I’m writing so they name you.", shot: "briefing" },
  { m: "shopify", id: "alphaa-shopify-2-social", tone: "mk", tag: "Social media", h: "Posts ready to publish <span>in one tap</span>", sub: "Written and designed in your voice, with your logo and colours.", shot: "social" },
  { m: "shopify", id: "alphaa-shopify-3-content", tone: "ct", tag: "Content", h: "Pages your customers <span>search for</span>", sub: "Ideas from what’s working in your niche, each with its source. Published to your store’s blog, with undo.", shot: "research" },
  { m: "shopify", id: "alphaa-shopify-4-email", tone: "em", tag: "Email", h: "Emails to your customers, <span>in your voice</span>", sub: "A monthly note to your own list, with your address and an unsubscribe link in every send.", shot: "email" },
  // Webflow Marketplace
  { m: "webflow", id: "alphaa-webflow-1", blend: true, h: "Your AI <span>marketing agent</span>", sub: "Social, content, SEO &amp; AI search and email, every week. Pages go to your Webflow CMS when you approve, with undo.", pills: true, shot: "briefing" },
  { m: "webflow", id: "alphaa-webflow-2", tone: "mk", tag: "Social media", h: "Posts ready to publish <span>in one tap</span>", sub: "Written and designed in your voice, with your logo and colours.", shot: "social" },
  { m: "webflow", id: "alphaa-webflow-3", tone: "ct", tag: "Content", h: "Pages AI and Google <span>look for</span>", sub: "Drafted from real searches and what’s working in your niche, then published to your Webflow CMS.", shot: "research" },
  { m: "webflow", id: "alphaa-webflow-4", tone: "em", h: "Three plans, <span>month to month</span>", sub: "Cancel online in a minute.", plans: true },
]
const out = []
for (const f of FRAMES) {
  const [w, h, v] = W[f.m]
  const vars = Object.entries(v).map(([k, x]) => `--${k}:${x}`).join(";")
  const right = f.plans ? PLANS : win(f.shot, "alphaa.app/dashboard")
  const lw = f.plans ? `--lw:${f.m === "webflow" ? "300px" : "380px"};--bleed:0px` : ""
  const html = `<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href=../../../../../social/base-color.css><link rel=stylesheet href=../frame.css>
<style>html,body{width:${w}px;height:${h}px}</style></head><body class="t-${f.tone || "em"}"><div class="f${f.blend ? " blend" : ""}" style="${vars};${lw}">${left(f)}${right}</div></body></html>`
  const src = P(`src/html/${f.id}.html`)
  await writeFile(src, html)
  const png = P(`${f.m}/${f.id}.png`)
  await shot(src, w, h, png)
  // Keep files light: palette-free PNG recompressed with sharp.
  const buf = await sharp(png).png({ compressionLevel: 9, effort: 10 }).toBuffer()
  await writeFile(png, buf)
  out.push([png, f.m, f.id])
  console.log("ok", f.m, f.id)
}

// Icons: the orb on white (square app icon). 900px must stay under 50KB (Webflow form).
for (const s of [1200, 900, 512, 256]) {
  const svg = Buffer.from(orbSvg({ size: s, bg: "#ffffff", scale: 0.72 }))
  const img = sharp(svg).flatten({ background: "#ffffff" })
  await (s === 900 ? img.png({ palette: true, colors: 128, compressionLevel: 9, effort: 10 }) : img.png()).toFile(P(`icons/alphaa-icon-${s}.png`))
}
if ((await stat(P("icons/alphaa-icon-900.png"))).size >= 50_000) throw new Error("900px icon is over 50KB")

// Preview sheet
const tile = (f, label, wide) => `<figure${wide ? " class=wide" : ""}><img src="../${f}"><figcaption>${label}</figcaption></figure>`
const sheet = `<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href=../../../../social/base-color.css><style>
html,body{width:2000px;height:2350px;background:#f6f6f8}.s{padding:60px;display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
header{grid-column:1/-1;display:flex;align-items:center;gap:16px;font-size:40px;font-weight:800;letter-spacing:-.03em}header .orb{width:50px;height:50px}header small{font-size:20px;font-weight:500;color:var(--muted);margin-left:10px;letter-spacing:0}
h2{grid-column:1/-1;font-size:24px;font-weight:800;margin-top:10px}
figure{grid-column:span 2;background:#fff;border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:var(--shadow)}figure.sm{grid-column:span 1}
figure img{display:block;width:100%;border-radius:10px}figcaption{font-size:16px;font-weight:600;color:var(--fg2);margin-top:10px}
.icons{grid-column:1/-1;display:flex;gap:24px;align-items:flex-end}.icons figure{grid-column:auto;width:180px}
</style></head><body><div class=s><header><span class=orb></span>alphaa app listings<small>colour system · 2026-11-27 · example data</small></header>
<h2>Shopify App Store · 1600x900 (feature + 4 screenshots, no prices)</h2>
${out.filter((o) => o[1] === "shopify").map((o) => tile(`shopify/${o[2]}.png`, o[2])).join("")}
<h2>Webflow Marketplace · 1280x846</h2>
${out.filter((o) => o[1] === "webflow").map((o) => tile(`webflow/${o[2]}.png`, o[2])).join("")}
<h2>App icons (Shopify, Webflow, Canva, Wix) · 1200 / 900 (&lt;50KB) / 512 / 256</h2>
<div class=icons>${[1200, 900, 512, 256].map((s) => `<figure><img src="../icons/alphaa-icon-${s}.png"><figcaption>${s}px</figcaption></figure>`).join("")}</div>
</div></body></html>`
await writeFile(P("src/preview.html"), sheet)
await shot(P("src/preview.html"), 2000, 2350, P("../preview-color.png"))
console.log("preview ok")
