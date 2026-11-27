// The image for a social post: the business's own colours and logo, with a short headline
// (4-5 words, readable in two seconds). Drawn from text, never a stock or AI-made picture.
// Rendered with resvg, stored like post images (MockActivity "post_image") and served signed.
import path from "path"
import { readFile } from "fs/promises"
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"
import opentype, { type Font } from "opentype.js"
import { db } from "@/lib/db"
import { safeFetch } from "@/lib/safe-fetch"
import { imageUrl } from "@/lib/images"
import { luminance, type BrandKit } from "@/lib/brand-kit"

const S = 1080
const PAD = 84
let fonts: { regular: Font; bold: Font } | null = null

async function loadFonts() {
  if (fonts) return fonts
  const dir = path.join(process.cwd(), "scripts/assets/blog-cover")
  const load = async (w: number) => {
    const buf = await readFile(path.join(dir, `inter-latin-${w}-normal.woff`))
    return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
  }
  fonts = { regular: await load(400), bold: await load(700) }
  return fonts
}

const width = (f: Font, t: string, size: number, track: number) => [...t].reduce((w, ch) => w + f.getAdvanceWidth(ch, size) + track * size, 0)
function pathFor(f: Font, t: string, x: number, y: number, size: number, fill: string, track = -0.03): string {
  let d = "", cx = x
  for (const ch of t) {
    d += f.getPath(ch, cx, y, size).toPathData(1)
    cx += f.getAdvanceWidth(ch, size) + track * size
  }
  return `<path d="${d}" fill="${fill}"/>`
}
function wrap(f: Font, text: string, size: number, maxW: number): string[] {
  const lines: string[] = []
  let cur = ""
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const t = cur ? `${cur} ${w}` : w
    if (width(f, t, size, -0.03) <= maxW || !cur) cur = t
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}
const covered = (f: Font, t: string) => [...t].every((ch) => /\s/.test(ch) || f.charToGlyph(ch).index !== 0)

async function logoData(url: string | null): Promise<{ uri: string; w: number; h: number; light: boolean } | null> {
  if (!url) return null
  try {
    const r = await safeFetch(url, { signal: AbortSignal.timeout(8000) })
    const type = (r.headers.get("content-type") ?? "").split(";")[0].trim()
    if (!r.ok || !/^image\/(png|jpeg|svg\+xml)$/.test(type)) return null
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > 1_500_000) return null
    // Read its size so it keeps its shape.
    let w = 0, h = 0
    if (type === "image/png") { w = buf.readUInt32BE(16); h = buf.readUInt32BE(20) }
    else if (type === "image/svg+xml") {
      const svg = buf.toString("utf8")
      const vb = svg.match(/viewBox=["'][\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)/i)
      w = Number(vb?.[1] ?? svg.match(/\bwidth=["']([\d.]+)/i)?.[1] ?? 0); h = Number(vb?.[2] ?? svg.match(/\bheight=["']([\d.]+)/i)?.[1] ?? 0)
    } else {
      for (let i = 2; i < buf.length - 9;) {
        if (buf[i] !== 0xff) { i++; continue }
        const marker = buf[i + 1], len = buf.readUInt16BE(i + 2)
        if (marker >= 0xc0 && marker <= 0xc3) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break }
        i += 2 + len
      }
    }
    if (!w || !h) return null
    const uri = `data:${type};base64,${buf.toString("base64")}`
    // How light is the logo itself? White logos go on a dark tile, everything else on white.
    const px = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><image width="64" height="64" preserveAspectRatio="xMidYMid meet" href="${uri}"/></svg>`).render().pixels
    let sum = 0, count = 0
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue
      sum += luminance(`#${[px[i], px[i + 1], px[i + 2]].map((x) => x.toString(16).padStart(2, "0")).join("")}`)
      count++
    }
    return { uri, w, h, light: count > 0 && sum / count > 0.6 }
  } catch {
    return null
  }
}

/** The named card styles (owner picks one in Social Studio's Preview, saved in settings images.cardStyle). */
export const CARD_STYLES = ["minimal", "editorial", "gradient", "warm"] as const
export type CardStyle = (typeof CARD_STYLES)[number]
export const CARD_STYLE_NAME: Record<CardStyle, string> = { minimal: "Minimal light", editorial: "Editorial dark", gradient: "Bold gradient", warm: "Warm" }

/** Draws the card and saves it. Null when the headline uses letters the font can't draw. */
export async function renderSocialCard(userId: string, input: CardInput): Promise<{ id: string; url: string } | null> {
  // The owner's saved style, and Alphaa's own brand stays black & white (brand rule).
  const [u, st] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true } }),
    db.mockActivity.findFirst({ where: { userId, type: "agent_settings" }, orderBy: { createdAt: "desc" }, select: { metadata: true } }),
  ])
  const saved = ((st?.metadata as { images?: { cardStyle?: string } } | null)?.images?.cardStyle ?? null) as CardStyle | null
  const mono = input.mono ?? /(^|\.)alphaa\.app$/i.test((u?.websiteUrl ?? "").replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
  // JPEG: Instagram and TikTok only take JPEG for photo posts.
  const img = await renderCardJpeg({ ...input, style: input.style ?? (saved && CARD_STYLES.includes(saved) ? saved : undefined), mono })
  if (!img) return null
  const headline = input.headline.trim().replace(/\s+/g, " ").slice(0, 80)
  const row = await db.mockActivity.create({ data: { userId, type: "post_image", title: `Made an image for “${headline}”`, metadata: { b64: img.toString("base64"), mime: "image/jpeg", alt: headline, kind: "social_card" } } })
  return { id: row.id, url: imageUrl(row.id) }
}

export type CardInput = {
  headline: string
  businessName: string | null
  brand: Pick<BrandKit, "logo" | "primary"> | null | undefined
  /** Optional second line under the headline (short). */
  subline?: string | null
  style?: CardStyle
  /** Black & white only (Alphaa's own brand). */
  mono?: boolean
}

/** The card as a JPEG (what social platforms accept). */
export async function renderCardJpeg(input: CardInput): Promise<Buffer | null> {
  const svg = await cardSvg(input)
  if (!svg) return null
  const r = new Resvg(svg, { fitTo: { mode: "width", value: S }, background: "#ffffff" }).render()
  return Buffer.from(jpeg.encode({ data: Buffer.from(r.pixels), width: r.width, height: r.height }, 90).data)
}

/** The card as a PNG, without saving it (the public first-week preview stores it itself). */
export async function renderCardPng(input: CardInput): Promise<Buffer | null> {
  const svg = await cardSvg(input)
  return svg ? Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: S } }).render().asPng()) : null
}

const hex = (c: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : /^#[0-9a-f]{3}$/i.test(c) ? `#${c.slice(1).split("").map((x) => x + x).join("")}` : "#111111")
function shade(c: string, amt: number): string {
  const h = hex(c)
  const ch = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const out = ch.map((v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)))))
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

type Palette = { bg: string; bg2?: string; ink: string; sub: string; accent: string; rule: string; tile: "light" | "dark" | "auto" }

function palette(style: CardStyle, brandColor: string | null, mono: boolean): Palette {
  const brand = hex(brandColor ?? "#111111")
  // A brand colour that's nearly white or black can't be the accent on a matching background.
  const accentOn = (bg: string) => (Math.abs(luminance(brand) - luminance(bg)) > 0.25 ? brand : luminance(bg) > 0.5 ? "#111111" : "#FFFFFF")
  if (mono) {
    if (style === "minimal" || style === "warm") return { bg: "#FFFFFF", ink: "#0A0A0A", sub: "#5A5A5A", accent: "#0A0A0A", rule: "#E5E5E5", tile: "light" }
    if (style === "gradient") return { bg: "#000000", bg2: "#2A2A2A", ink: "#FFFFFF", sub: "#BDBDBD", accent: "#FFFFFF", rule: "#3A3A3A", tile: "dark" }
    return { bg: "#0A0A0A", ink: "#FFFFFF", sub: "#A3A3A3", accent: "#FFFFFF", rule: "#2A2A2A", tile: "dark" }
  }
  if (style === "minimal") return { bg: "#FAFAF7", ink: "#111111", sub: "#5B5B5B", accent: accentOn("#FAFAF7"), rule: "#E6E4DE", tile: "light" }
  if (style === "warm") return { bg: "#F6EBDD", ink: "#2B1A0E", sub: "#6B4F3A", accent: accentOn("#F6EBDD"), rule: "#E5D3BD", tile: "light" }
  if (style === "gradient") {
    const dark = luminance(brand) < 0.5
    return { bg: shade(brand, dark ? -0.35 : -0.55), bg2: shade(brand, dark ? 0.15 : -0.1), ink: "#FFFFFF", sub: "rgba(255,255,255,0.78)", accent: "#FFFFFF", rule: "rgba(255,255,255,0.22)", tile: "auto" }
  }
  return { bg: "#101114", ink: "#F7F7F5", sub: "#A7A9AE", accent: accentOn("#101114"), rule: "#26282D", tile: "auto" }
}

/**
 * The layout every style shares: safe margins (96px), a short accent rule, the 4-5 word headline
 * as the largest element (centred in the space above the footer, left-aligned for reading), an
 * optional subline, and a footer row (logo or name) under a hairline.
 */
async function cardSvg(input: CardInput): Promise<string | null> {
  const f = await loadFonts()
  const headline = input.headline.trim().replace(/\s+/g, " ").slice(0, 80)
  const subline = (input.subline ?? "").trim().replace(/\s+/g, " ").slice(0, 90)
  const name = (input.businessName ?? "").trim().slice(0, 40)
  if (!headline || !covered(f.bold, headline)) return null
  const style: CardStyle = input.style ?? (input.brand?.primary ? "gradient" : "editorial")
  const P = palette(style, input.brand?.primary ?? null, !!input.mono)
  const M = 96
  const maxW = S - M * 2
  const footerH = 150

  let size = 156, lines = wrap(f.bold, headline, size, maxW)
  while ((lines.length > 3 || lines.some((l) => width(f.bold, l, size, -0.035) > maxW)) && size > 72) {
    size -= 4
    lines = wrap(f.bold, headline, size, maxW)
  }
  const lh = size * 1.06
  const subSize = Math.round(Math.max(34, size * 0.34))
  const subLines = subline && covered(f.regular, subline) ? wrap(f.regular, subline, subSize, maxW).slice(0, 2) : []
  const subLh = subSize * 1.3
  const ruleGap = 48
  const block = 10 + ruleGap + lines.length * lh + (subLines.length ? 34 + subLines.length * subLh : 0)
  // Optical centre: a touch above the true middle of the space over the footer.
  const blockTop = Math.max(M, (S - footerH - block) / 2 - 18)

  const parts: string[] = []
  if (P.bg2) {
    parts.push(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.bg}"/><stop offset="1" stop-color="${P.bg2}"/></linearGradient></defs>`)
    parts.push(`<rect width="${S}" height="${S}" fill="url(#g)"/>`)
    // Soft shape art: one large circle, low contrast, top-right.
    parts.push(`<circle cx="${S - 120}" cy="160" r="360" fill="#FFFFFF" opacity="0.06"/>`)
  } else {
    parts.push(`<rect width="${S}" height="${S}" fill="${P.bg}"/>`)
    if (style === "warm") parts.push(`<circle cx="${S - 60}" cy="${S - 260}" r="300" fill="${P.accent}" opacity="0.08"/>`)
    if (style === "editorial") parts.push(`<rect x="0" y="0" width="${S}" height="12" fill="${P.accent}"/>`)
  }
  parts.push(`<rect x="${M}" y="${blockTop}" width="88" height="10" rx="5" fill="${P.accent}"/>`)
  let y = blockTop + 10 + ruleGap + size * 0.8
  for (const l of lines) { parts.push(pathFor(f.bold, l, M, y, size, P.ink, -0.035)); y += lh }
  if (subLines.length) {
    y += 34 - lh + size * 0.8 + subSize * 0.2
    for (const l of subLines) { parts.push(pathFor(f.regular, l, M, y, subSize, P.sub, -0.01)); y += subLh }
  }

  // Footer: hairline, then the logo (on a tile that suits it) or the business name.
  parts.push(`<rect x="${M}" y="${S - footerH}" width="${maxW}" height="2" fill="${P.rule}"/>`)
  const logo = await logoData(input.brand?.logo ?? null)
  const fy = S - footerH / 2 + 2
  if (logo) {
    const h = 64, w = Math.min(320, (logo.w / logo.h) * h)
    const needTile = P.tile === "light" ? logo.light : P.tile === "dark" ? !logo.light : true
    const tileFill = logo.light ? "#111111" : "#FFFFFF"
    if (needTile) parts.push(`<rect x="${M - 18}" y="${fy - h / 2 - 16}" width="${w + 36}" height="${h + 32}" rx="16" fill="${tileFill}"/>`)
    parts.push(`<image x="${M}" y="${fy - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMinYMid meet" href="${logo.uri}"/>`)
  } else if (name && covered(f.bold, name)) {
    parts.push(pathFor(f.bold, name, M, fy + 13, 36, P.ink, -0.01))
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${parts.join("")}</svg>`
}

// Shared with the photo and AI-scene images (lib/photo-render.ts): same font, same logo tile.
export { loadFonts, pathFor, wrap, width as textWidth, covered, logoData }
