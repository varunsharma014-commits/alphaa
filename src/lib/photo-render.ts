// Real pictures under the headline: the owner's own photo (or an AI-made scene, when the owner
// chose that) with a dark gradient, the 4-5 word headline and the logo. Same font and logo tile
// as the text card (lib/social-card.ts). Also cleans up any photo we keep: re-encoded as JPEG
// (drops EXIF, so no GPS from phone photos), turned upright, and capped in size.
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"
import { loadFonts, pathFor, wrap, textWidth, covered, logoData } from "@/lib/social-card"
import type { BrandKit } from "@/lib/brand-kit"

export type ImageSize = "square" | "portrait"
export const SIZE_PX: Record<ImageSize, { w: number; h: number }> = { square: { w: 1080, h: 1080 }, portrait: { w: 1080, h: 1350 } }

export type ImageInfo = { type: "jpeg" | "png" | "webp" | "other"; w: number; h: number; orientation: number }

/** Type, size and EXIF orientation, read from the bytes (no decoding). */
export function imageInfo(buf: Buffer): ImageInfo {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { type: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), orientation: 1 }
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16)
    if (chunk === "VP8X") return { type: "webp", w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), orientation: 1 }
    if (chunk === "VP8 ") return { type: "webp", w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, orientation: 1 }
    if (chunk === "VP8L") { const b = buf.readUInt32LE(21); return { type: "webp", w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff), orientation: 1 } }
    return { type: "webp", w: 0, h: 0, orientation: 1 }
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let w = 0, h = 0, orientation = 1
    for (let i = 2; i < buf.length - 9;) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01 || marker === 0xff) { i += marker === 0xff ? 1 : 2; continue }
      const len = buf.readUInt16BE(i + 2)
      if (marker === 0xe1 && buf.toString("ascii", i + 4, i + 8) === "Exif") orientation = exifOrientation(buf, i + 10) ?? 1
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break }
      i += 2 + len
    }
    return { type: "jpeg", w, h, orientation }
  }
  return { type: "other", w: 0, h: 0, orientation: 1 }
}

function exifOrientation(buf: Buffer, tiff: number): number | null {
  try {
    const le = buf.toString("ascii", tiff, tiff + 2) === "II"
    const u16 = (o: number) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
    const u32 = (o: number) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o))
    const ifd = tiff + u32(tiff + 4)
    const n = u16(ifd)
    for (let k = 0; k < n; k++) {
      const e = ifd + 2 + k * 12
      if (u16(e) === 0x0112) return u16(e + 8)
    }
  } catch { /* unreadable EXIF: treat as upright */ }
  return null
}

/** sharp ships with Next for image optimisation; used only when it's there (WebP/HEIC). */
async function loadSharp(): Promise<null | ((b: Buffer) => import("sharp").Sharp)> {
  try {
    const m = (await import("sharp")) as unknown as { default?: (b: Buffer) => import("sharp").Sharp }
    return (m.default ?? (m as unknown as (b: Buffer) => import("sharp").Sharp))
  } catch {
    return null
  }
}

const toJpeg = (r: { pixels: Uint8Array | Buffer; width: number; height: number }, q = 86) => Buffer.from(jpeg.encode({ data: Buffer.from(r.pixels), width: r.width, height: r.height }, q).data)

/**
 * Any photo we keep: upright, longest side at most `max`, re-encoded as JPEG (EXIF dropped).
 * Null when it isn't a picture we can read.
 */
export async function normalizePhoto(buf: Buffer, max = 1600): Promise<{ jpeg: Buffer; w: number; h: number } | null> {
  const info = imageInfo(buf)
  if (info.type === "webp" || info.type === "other") {
    const sharp = await loadSharp()
    if (!sharp) return null
    try {
      const { data, info: o } = await sharp(buf).rotate().resize({ width: max, height: max, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer({ resolveWithObject: true })
      return { jpeg: data, w: o.width, h: o.height }
    } catch {
      return null
    }
  }
  if (!info.w || !info.h) return null
  // EXIF 5-8 = the camera was turned: the picture's real width is its stored height.
  const turned = info.orientation >= 5 && info.orientation <= 8
  const W = turned ? info.h : info.w, H = turned ? info.w : info.h
  const scale = Math.min(1, max / Math.max(W, H))
  const ow = Math.round(W * scale), oh = Math.round(H * scale)
  const sw = info.w * scale, sh = info.h * scale
  const t: Record<number, string> = {
    2: `translate(${ow} 0) scale(-1 1)`,
    3: `translate(${ow} ${oh}) rotate(180)`,
    4: `translate(0 ${oh}) scale(1 -1)`,
    5: `matrix(0 1 1 0 0 0)`,
    6: `translate(${ow} 0) rotate(90)`,
    7: `matrix(0 -1 -1 0 ${ow} ${oh})`,
    8: `translate(0 ${oh}) rotate(-90)`,
  }
  const mime = info.type === "png" ? "image/png" : "image/jpeg"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ow}" height="${oh}" viewBox="0 0 ${ow} ${oh}"><g transform="${t[info.orientation] ?? ""}"><image width="${sw}" height="${sh}" preserveAspectRatio="none" href="data:${mime};base64,${buf.toString("base64")}"/></g></svg>`
  try {
    const r = new Resvg(svg, { background: "#ffffff" }).render()
    if (!r.width || !r.height) return null
    return { jpeg: toJpeg(r), w: r.width, h: r.height }
  } catch {
    return null
  }
}

export type OverlayInput = {
  /** The background picture, already a clean JPEG (normalizePhoto). */
  photo: Buffer
  headline: string
  businessName: string | null
  brand: Pick<BrandKit, "logo" | "primary"> | null | undefined
  size?: ImageSize
  /** Exact pixel size instead of `size` (the wide 1200×630 blog cover, lib/blog-cover.ts). */
  dims?: { w: number; h: number }
}

/** The photo, cropped to fill, with a dark gradient, the headline and the logo. JPEG, or null if the font can't draw the headline. */
export async function renderPhotoCard(input: OverlayInput): Promise<Buffer | null> {
  const f = await loadFonts()
  const { w: W, h: H } = input.dims ?? SIZE_PX[input.size ?? "square"]
  const PAD = 80
  const headline = input.headline.trim().replace(/\s+/g, " ").slice(0, 80)
  const name = (input.businessName ?? "").trim().slice(0, 40)
  if (!headline || !covered(f.bold, headline)) return null

  // A wide cover (1200×630) has less height: smaller type, at most 3 lines.
  const wide = H < W * 0.7
  const maxLines = wide ? 3 : 4
  let size = wide ? 76 : 112, lines = wrap(f.bold, headline, size, W - PAD * 2)
  while ((lines.length > maxLines || lines.some((l) => textWidth(f.bold, l, size, -0.03) > W - PAD * 2)) && size > (wide ? 44 : 60)) {
    size -= 6
    lines = wrap(f.bold, headline, size, W - PAD * 2)
  }
  const lh = size * 1.08
  // Headline sits at the bottom, over the darkest part of the gradient.
  const lastBase = H - PAD - 8
  const firstBase = lastBase - (lines.length - 1) * lh
  const accent = input.brand?.primary ?? "#FFFFFF"
  const parts: string[] = [
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.45" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0.86"/></linearGradient>` +
      `<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`,
    `<rect width="${W}" height="${H}" fill="#222"/>`,
    `<image width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${input.photo.toString("base64")}"/>`,
    `<rect y="${Math.round(H * 0.32)}" width="${W}" height="${Math.round(H * 0.68)}" fill="url(#g)"/>`,
    `<rect width="${W}" height="220" fill="url(#t)"/>`,
    `<rect x="${PAD}" y="${firstBase - size - 40}" width="72" height="10" rx="5" fill="${accent}"/>`,
  ]
  lines.forEach((l, i) => parts.push(pathFor(f.bold, l, PAD, firstBase + i * lh, size, "#FFFFFF")))

  // Logo top-left on its tile; else the business name.
  const logo = await logoData(input.brand?.logo ?? null)
  if (logo) {
    const h = 72, w = Math.min(320, (logo.w / logo.h) * h)
    parts.push(`<rect x="${PAD - 20}" y="${PAD - 20}" width="${w + 40}" height="${h + 40}" rx="18" fill="${logo.light ? "#111111" : "#FFFFFF"}"/>`)
    parts.push(`<image x="${PAD}" y="${PAD}" width="${w}" height="${h}" preserveAspectRatio="xMinYMid meet" href="${logo.uri}"/>`)
  } else if (name && covered(f.bold, name)) {
    parts.push(pathFor(f.bold, name, PAD, PAD + 36, 38, "#FFFFFF", -0.01))
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`
  try {
    const r = new Resvg(svg, { fitTo: { mode: "width", value: W }, background: "#222222" }).render()
    return toJpeg(r, 88)
  } catch (err) {
    console.error("[photo-render]", err instanceof Error ? err.message : err)
    return null
  }
}
