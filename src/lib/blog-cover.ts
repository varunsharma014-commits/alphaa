// The cover image for a blog post, in the style the owner picked in "How your images look"
// (lib/post-images.ts settings `images.style`), at blog-cover size 1200×630 (what WordPress,
// Webflow, Shopify, Wix and link previews expect):
//   card   (default) a wide text card: their colours + the post title + logo, never a photo
//   photo  one of their own photos (Google listing, website, uploads, brand library) + title
//   ai     an AI-made scene, ONLY when the owner opted in (style "ai"), labelled as AI-made
//   canva  their Canva brand template, filled with the title, centred on a wide canvas
// Replaced generatePostImage() on 2026-11-28, which made an OpenAI photo for every post and
// every customer whatever they had chosen. The alt text says what the picture shows and what
// the post is about, not just the title again. Anything that fails falls back to the text card.
import { Resvg } from "@resvg/resvg-js"
import jpeg from "jpeg-js"
import { db } from "@/lib/db"
import { ensureBrandKit, type BrandKit } from "@/lib/brand-kit"
import { imageSettings, storePostImage, aiScene, type ImageStyle } from "@/lib/post-images"
import { normalizePhoto, renderPhotoCard } from "@/lib/photo-render"
import { nextPhoto, refreshPhotos } from "@/lib/brand-photos"
import { CARD_STYLES, cardPalette, covered, houseTone, isHouse, loadFonts, logoData, pathFor, textWidth, wrap, type CardStyle } from "@/lib/social-card"

export const COVER_W = 1200
export const COVER_H = 630

export type BlogCover = { id: string; url: string; alt: string; kind: ImageStyle }

const clean = (s: string) => s.trim().replace(/\s+/g, " ")
/** The post title as a cover headline: a trailing " | Brand" goes when it's long; ≤ 80 chars, whole words. */
export function coverHeadline(title: string): string {
  let t = clean(title)
  if (t.length > 70) t = t.replace(/\s*[|–—]\s*[^|–—]+$/, "") || t
  if (t.length <= 80) return t
  const cut = t.slice(0, 80)
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,:;]$/, "") || cut
}

/** Alt text that describes the picture and the topic (screen readers, image search). */
export function describeCover(kind: ImageStyle, o: { headline: string; topic: string; businessName: string | null }): string {
  const who = o.businessName?.trim() || "the business"
  const about = clean(o.topic).replace(/[?.!]+$/, "")
  const alt =
    kind === "photo" ? `Photo from ${who}, with the headline “${o.headline}”, for a post about ${about.toLowerCase()}`
      : kind === "ai" ? `AI-made picture illustrating ${about.toLowerCase()}, with the headline “${o.headline}”`
        : kind === "canva" ? `${who} branded graphic with the headline “${o.headline}”`
          : `Text graphic in ${who}’s brand colours with the headline “${o.headline}”`
  return alt.length <= 120 ? alt : `${alt.slice(0, 117).replace(/\s+\S*$/, "")}…`
}

/** The wide text card: same palettes as the social card (lib/social-card.ts), laid out for 1200×630. */
export async function wideCardSvg(input: { headline: string; businessName: string | null; brand: Pick<BrandKit, "logo" | "primary"> | null | undefined; style?: CardStyle; house?: boolean }): Promise<string | null> {
  const f = await loadFonts()
  const headline = clean(input.headline).slice(0, 90)
  const name = (input.businessName ?? "").trim().slice(0, 40)
  if (!headline || !covered(f.bold, headline)) return null
  const W = COVER_W, H = COVER_H, M = 72, footerH = 104
  const style: CardStyle = input.style ?? (input.brand?.primary ? "gradient" : "editorial")
  const tone = input.house ? houseTone(headline) : null
  const P = tone ? { bg: tone.bg, ink: "#111114", sub: "#3a3a40", accent: tone.accent, rule: "#dcdce2", tile: "light" as const, bg2: undefined } : cardPalette(style, input.brand?.primary ?? null)
  const maxW = W - M * 2

  let size = 78, lines = wrap(f.bold, headline, size, maxW)
  while ((lines.length > 3 || lines.some((l) => textWidth(f.bold, l, size, -0.03) > maxW)) && size > 44) {
    size -= 3
    lines = wrap(f.bold, headline, size, maxW)
  }
  const lh = size * 1.1
  const block = 8 + 32 + lines.length * lh
  const top = Math.max(M - 8, (H - footerH - block) / 2)

  const parts: string[] = []
  if (tone) {
    const blob = (id: string, c: string) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`
    parts.push(`<defs>${blob("b1", tone.soft)}${blob("b2", tone.n1)}${blob("b3", tone.n2)}</defs><rect width="${W}" height="${H}" fill="${P.bg}"/>`)
    parts.push(`<circle cx="${W}" cy="0" r="420" fill="url(#b1)"/><circle cx="0" cy="${H}" r="360" fill="url(#b2)"/><circle cx="${W}" cy="${H}" r="300" fill="url(#b3)"/>`)
  } else if (P.bg2) {
    parts.push(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.bg}"/><stop offset="1" stop-color="${P.bg2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`)
    parts.push(`<circle cx="${W - 110}" cy="120" r="300" fill="#FFFFFF" opacity="0.06"/>`)
  } else {
    parts.push(`<rect width="${W}" height="${H}" fill="${P.bg}"/>`)
    if (style === "warm") parts.push(`<circle cx="${W - 40}" cy="${H - 180}" r="240" fill="${P.accent}" opacity="0.08"/>`)
    if (style === "editorial") parts.push(`<rect x="0" y="0" width="${W}" height="10" fill="${P.accent}"/>`)
  }
  parts.push(`<rect x="${M}" y="${top}" width="72" height="8" rx="4" fill="${P.accent}"/>`)
  let y = top + 8 + 32 + size * 0.8
  for (const l of lines) { parts.push(pathFor(f.bold, l, M, y, size, P.ink, -0.03)); y += lh }

  parts.push(`<rect x="${M}" y="${H - footerH}" width="${maxW}" height="2" fill="${P.rule}"/>`)
  const fy = H - footerH / 2 + 2
  const logo = tone ? null : await logoData(input.brand?.logo ?? null)
  if (tone) {
    const { orbShapes } = await import("@/lib/brand-orb")
    parts.push(orbShapes(M + 20, fy, 20))
    parts.push(pathFor(f.bold, "alphaa", M + 54, fy + 11, 32, P.ink, -0.03))
  } else if (logo) {
    const h = 48, w = Math.min(260, (logo.w / logo.h) * h)
    const needTile = P.tile === "light" ? logo.light : P.tile === "dark" ? !logo.light : true
    if (needTile) parts.push(`<rect x="${M - 14}" y="${fy - h / 2 - 12}" width="${w + 28}" height="${h + 24}" rx="12" fill="${logo.light ? "#111111" : "#FFFFFF"}"/>`)
    parts.push(`<image x="${M}" y="${fy - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMinYMid meet" href="${logo.uri}"/>`)
  } else if (name && covered(f.bold, name)) {
    parts.push(pathFor(f.bold, name, M, fy + 10, 28, P.ink, -0.01))
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`
}

const toJpeg = (svg: string, bg = "#ffffff"): Buffer => {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: COVER_W }, background: bg }).render()
  return Buffer.from(jpeg.encode({ data: Buffer.from(r.pixels), width: r.width, height: r.height }, 88).data)
}

/** A Canva design (any shape) centred on a wide canvas in the brand colour, so nothing is cropped. */
function fitWide(img: Buffer, bg: string): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_W}" height="${COVER_H}"><rect width="${COVER_W}" height="${COVER_H}" fill="${bg}"/><image width="${COVER_W}" height="${COVER_H}" preserveAspectRatio="xMidYMid meet" href="data:image/jpeg;base64,${img.toString("base64")}"/></svg>`
  return toJpeg(svg, bg)
}

/** The cover for one post, in the owner's style. Null only if even the text card can't be drawn. */
export async function blogCoverFor(userId: string, input: { title: string; topic?: string | null }): Promise<BlogCover | null> {
  const [s, brand, user] = await Promise.all([
    imageSettings(userId),
    ensureBrandKit(userId).catch(() => null),
    db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true, websiteUrl: true } }),
  ])
  const headline = coverHeadline(input.title)
  const topic = input.topic?.trim() || input.title
  const altFor = (kind: ImageStyle) => describeCover(kind, { headline, topic, businessName: user?.businessName ?? null })
  const house = isHouse(user?.websiteUrl)
  const dims = { w: COVER_W, h: COVER_H }

  try {
    // Alphaa's own site never gets photos or AI pictures (brand rule): always the house card.
    if (!house && s.style === "canva" && s.canvaTemplate) {
      const { autofillJpeg } = await import("@/lib/canva/client")
      const photo = s.canvaTemplate.imageField ? (await nextPhoto(userId, topic))?.bytes ?? null : null
      const { jpeg: design } = await autofillJpeg(userId, s.canvaTemplate, { headline, title: input.title, photo })
      const norm = await normalizePhoto(design, 1600)
      if (norm) return { ...(await storePostImage(userId, fitWide(norm.jpeg, brand?.primary ?? "#111111"), altFor("canva"), "blog_cover_canva")), alt: altFor("canva"), kind: "canva" }
    }
    if (!house && s.style === "photo") {
      await refreshPhotos(userId).catch(() => null)
      const p = await nextPhoto(userId, topic)
      const img = p ? await renderPhotoCard({ photo: p.bytes, headline, businessName: user?.businessName ?? null, brand, dims }) : null
      if (img) return { ...(await storePostImage(userId, img, altFor("photo"), "blog_cover_photo")), alt: altFor("photo"), kind: "photo" }
    }
    // AI pictures only when the owner chose them (aiScene counts the image quota and needs the key).
    if (!house && s.style === "ai") {
      const scene = await aiScene({ topic, businessType: user?.businessType ?? null, city: user?.city ?? null, size: "wide" })
      const img = scene ? await renderPhotoCard({ photo: scene, headline, businessName: user?.businessName ?? null, brand, dims }) : null
      if (img) return { ...(await storePostImage(userId, img, altFor("ai"), "blog_cover_ai")), alt: altFor("ai"), kind: "ai" }
    }
  } catch (err) {
    console.error("[blog-cover]", s.style, err instanceof Error ? err.message : err)
  }
  const saved = s.cardStyle && (CARD_STYLES as readonly string[]).includes(s.cardStyle) ? s.cardStyle : undefined
  const svg = await wideCardSvg({ headline, businessName: user?.businessName ?? null, brand, style: saved, house }).catch(() => null)
  if (!svg) return null
  const alt = altFor("card")
  return { ...(await storePostImage(userId, toJpeg(svg), alt, "blog_cover_card")), alt, kind: "card" }
}
