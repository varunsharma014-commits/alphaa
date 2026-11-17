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

/** Draws the card and saves it. Null when the headline uses letters the font can't draw. */
export async function renderSocialCard(userId: string, input: CardInput): Promise<{ id: string; url: string } | null> {
  // JPEG: Instagram and TikTok only take JPEG for photo posts.
  const img = await renderCardJpeg(input)
  if (!img) return null
  const headline = input.headline.trim().replace(/\s+/g, " ").slice(0, 80)
  const row = await db.mockActivity.create({ data: { userId, type: "post_image", title: `Made an image for “${headline}”`, metadata: { b64: img.toString("base64"), mime: "image/jpeg", alt: headline, kind: "social_card" } } })
  return { id: row.id, url: imageUrl(row.id) }
}

export type CardInput = { headline: string; businessName: string | null; brand: Pick<BrandKit, "logo" | "primary"> | null | undefined }

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

async function cardSvg(input: CardInput): Promise<string | null> {
  const f = await loadFonts()
  const headline = input.headline.trim().replace(/\s+/g, " ").slice(0, 80)
  const name = (input.businessName ?? "").trim().slice(0, 40)
  if (!headline || !covered(f.bold, headline)) return null
  const bg = input.brand?.primary ?? "#111111"
  const ink = luminance(bg) > 0.42 ? "#111111" : "#FFFFFF"

  let size = 124, lines = wrap(f.bold, headline, size, S - PAD * 2)
  while ((lines.length > 4 || lines.some((l) => width(f.bold, l, size, -0.03) > S - PAD * 2)) && size > 64) {
    size -= 6
    lines = wrap(f.bold, headline, size, S - PAD * 2)
  }
  const lh = size * 1.08
  // Centre the headline in the space above the footer.
  const top = (S - 170) / 2 - (lines.length * lh) / 2 + size * 0.82
  const parts: string[] = [`<rect width="${S}" height="${S}" fill="${bg}"/>`, `<rect x="${PAD}" y="${top - size - 54}" width="72" height="10" rx="5" fill="${ink}" opacity="0.55"/>`]
  lines.forEach((l, i) => parts.push(pathFor(f.bold, l, PAD, top + i * lh, size, ink)))

  // Footer: the logo on a white tile (a dark one for white logos), else the name.
  const logo = await logoData(input.brand?.logo ?? null)
  if (logo) {
    const h = 96, w = Math.min(420, (logo.w / logo.h) * h)
    parts.push(`<rect x="${PAD - 24}" y="${S - PAD - h - 24}" width="${w + 48}" height="${h + 48}" rx="20" fill="${logo.light ? "#111111" : "#FFFFFF"}"/>`)
    parts.push(`<image x="${PAD}" y="${S - PAD - h}" width="${w}" height="${h}" preserveAspectRatio="xMinYMid meet" href="${logo.uri}"/>`)
  } else if (name && covered(f.bold, name)) {
    parts.push(pathFor(f.bold, name, PAD, S - PAD, 40, ink, -0.01))
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${parts.join("")}</svg>`
  return svg
}
