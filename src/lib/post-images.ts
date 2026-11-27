// One place that makes the picture for a social post, in the style the owner picked in
// "Your brand & voice" → "How your images look":
//   card   their colour + headline + logo (lib/social-card.ts), the default
//   photo  one of their own photos (Google listing, website, uploads) + headline + logo
//   ai     an AI-made scene (no people, text or logos) + headline + logo, only with OPENAI_API_KEY
//   canva  their Canva brand template, filled with the headline (and a photo) via autofill
// Anything that fails falls back to the text card, so a post always gets an image.
import OpenAI from "openai"
import { db } from "@/lib/db"
import { imageUrl } from "@/lib/images"
import { ensureBrandKit } from "@/lib/brand-kit"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { renderSocialCard } from "@/lib/social-card"
import { normalizePhoto, renderPhotoCard, SIZE_PX, type ImageSize } from "@/lib/photo-render"
import { listPhotos, nextPhoto, photoBytes, refreshPhotos } from "@/lib/brand-photos"

export type ImageStyle = "card" | "photo" | "ai" | "canva"
export type ImageSettings = {
  style: ImageStyle
  /** Text card look (lib/social-card.ts CARD_STYLES), picked from Social Studio's Preview. */
  cardStyle?: import("@/lib/social-card").CardStyle
  /** photo / ai: square 1080×1080 or tall 1080×1350. The text card is always square. */
  size?: ImageSize
  /** One sample per style (post_image ids) for the panel. */
  samples?: Partial<Record<ImageStyle, string | null>>
  /** The Canva brand template to fill (style "canva"). */
  canvaTemplate?: { id: string; title: string; textField: string; imageField?: string | null } | null
  /** Pictures the owner picked from Canva for their next posts (post_image ids), used first. */
  canvaNext?: string[]
  photosSyncedAt?: string
  /** One-time note for the brand thread: how the last Canva connect went. */
  canvaNote?: string | null
  at?: string
}

export const aiImagesAvailable = () => !!process.env.OPENAI_API_KEY
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini"
export const SAMPLE_HEADLINE = "Your posts will look like this"

export async function imageSettings(userId: string): Promise<ImageSettings> {
  return (await getAgentSettings(userId)).images ?? { style: "card" }
}
export async function saveImageSettings(userId: string, patch: Partial<ImageSettings>): Promise<ImageSettings> {
  const next: ImageSettings = { ...(await imageSettings(userId)), ...patch, at: new Date().toISOString() }
  await saveAgentSettings(userId, { images: next })
  return next
}

/** Keep a finished JPEG as a post image (served signed by /api/img/[id]). */
export async function storePostImage(userId: string, jpeg: Buffer, alt: string, kind: string): Promise<{ id: string; url: string }> {
  const a = alt.trim().replace(/\s+/g, " ").slice(0, 120)
  const row = await db.mockActivity.create({ data: { userId, type: "post_image", title: `Made an image for “${a}”`, metadata: { b64: jpeg.toString("base64"), mime: "image/jpeg", alt: a, kind } } })
  return { id: row.id, url: imageUrl(row.id) }
}

/** An AI-made background scene. Null without a key, on refusal or timeout. */
export async function aiScene(input: { topic: string; businessType: string | null; city: string | null; size: ImageSize }): Promise<Buffer | null> {
  if (!aiImagesAvailable()) return null
  const prompt = `A realistic photograph-style scene for a social media post by a ${input.businessType || "local business"}${input.city ? ` in ${input.city}` : ""} about: ${input.topic.slice(0, 160)}. Show the place, objects, tools, food or setting, in natural light, warm and inviting, with calm empty space in the lower half.
Strict rules: no people, no faces, no hands, no bodies. No text, letters, numbers or signs. No logos, brand names, trademarks or product packaging from real brands. No watermarks. Not a famous landmark or a real business.`
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await client.images.generate({ model: MODEL, prompt, size: input.size === "portrait" ? "1024x1536" : "1024x1024", quality: "low", output_format: "jpeg", output_compression: 80, n: 1 }, { timeout: 90_000 })
    const b64 = res.data?.[0]?.b64_json
    return b64 ? Buffer.from(b64, "base64") : null
  } catch (err) {
    console.error("[post-images] ai", err instanceof Error ? err.message : err)
    return null
  }
}

type For = { headline: string; topic: string }
export type PostImage = { id: string; url: string; kind: ImageStyle | "canva_design" }

/** The picture for a social post, in the owner's style. Null only if even the text card can't be drawn. */
export async function postImageFor(userId: string, input: For): Promise<PostImage | null> {
  const [s, brand, user] = await Promise.all([
    imageSettings(userId),
    ensureBrandKit(userId).catch(() => null),
    db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true } }),
  ])
  const size = s.size ?? "square"
  const headline = input.headline.trim() || input.topic

  // 1. A design the owner picked from Canva for their next post.
  while (s.canvaNext?.length) {
    const id = s.canvaNext[0]
    await saveImageSettings(userId, { canvaNext: s.canvaNext.slice(1) })
    s.canvaNext = s.canvaNext.slice(1)
    const ok = await db.mockActivity.count({ where: { id, userId, type: "post_image" } })
    if (ok) return { id, url: imageUrl(id), kind: "canva_design" }
  }

  try {
    if (s.style === "canva" && s.canvaTemplate) {
      const { autofillJpeg } = await import("@/lib/canva/client")
      const photo = s.canvaTemplate.imageField ? (await nextPhoto(userId))?.bytes ?? null : null
      const { jpeg } = await autofillJpeg(userId, s.canvaTemplate, { headline, title: input.topic, photo })
      const clean = await normalizePhoto(jpeg, 1350)
      if (clean) return { ...(await storePostImage(userId, clean.jpeg, headline, "canva_template")), kind: "canva" }
    }
    if (s.style === "photo") {
      await refreshPhotos(userId).catch(() => null)
      const p = await nextPhoto(userId, input.topic)
      const img = p ? await renderPhotoCard({ photo: p.bytes, headline, businessName: user?.businessName ?? null, brand, size }) : null
      if (img) return { ...(await storePostImage(userId, img, headline, "photo_card")), kind: "photo" }
    }
    if (s.style === "ai") {
      const scene = await aiScene({ topic: input.topic, businessType: user?.businessType ?? null, city: user?.city ?? null, size })
      const img = scene ? await renderPhotoCard({ photo: scene, headline, businessName: user?.businessName ?? null, brand, size }) : null
      if (img) return { ...(await storePostImage(userId, img, `AI-made picture: ${headline}`, "ai_scene")), kind: "ai" }
    }
  } catch (err) {
    console.error("[post-images]", s.style, err instanceof Error ? err.message : err)
  }
  const card = await renderSocialCard(userId, { headline, businessName: user?.businessName ?? null, brand }).catch(() => null)
  return card ? { ...card, kind: "card" } : null
}

/**
 * A sample of one style for the panel (saved in settings so it's drawn once). Photo samples use
 * the first photo without counting it as used; AI samples cost one image, so only on request.
 */
export async function styleSample(userId: string, style: ImageStyle, opts: { force?: boolean } = {}): Promise<string | null> {
  const s = await imageSettings(userId)
  if (style === "card") return (await ensureBrandKit(userId).catch(() => null))?.sampleId ?? null
  if (!opts.force && s.samples?.[style]) return s.samples[style] ?? null
  const [brand, user] = await Promise.all([ensureBrandKit(userId).catch(() => null), db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true } })])
  const size = s.size ?? "square"
  let id: string | null = null
  if (style === "photo") {
    const first = (await listPhotos(userId))[0]
    // No stored photos: a brand library one (Drive / Dropbox), without counting it as used.
    const bytes = first ? await photoBytes(userId, first.id) : (await import("@/lib/library/pick").then((m) => m.nextLibraryPhoto(userId, "", { peek: true })).catch(() => null))?.bytes ?? null
    const img = bytes ? await renderPhotoCard({ photo: bytes, headline: SAMPLE_HEADLINE, businessName: user?.businessName ?? null, brand, size }) : null
    if (img) id = (await storePostImage(userId, img, SAMPLE_HEADLINE, "photo_card")).id
  } else if (style === "ai") {
    const scene = await aiScene({ topic: `what a ${user?.businessType || "local business"} does every day`, businessType: user?.businessType ?? null, city: user?.city ?? null, size })
    const img = scene ? await renderPhotoCard({ photo: scene, headline: SAMPLE_HEADLINE, businessName: user?.businessName ?? null, brand, size }) : null
    if (img) id = (await storePostImage(userId, img, `AI-made picture: ${SAMPLE_HEADLINE}`, "ai_scene")).id
  } else if (style === "canva" && s.canvaTemplate) {
    try {
      const { autofillJpeg } = await import("@/lib/canva/client")
      const { jpeg } = await autofillJpeg(userId, s.canvaTemplate, { headline: SAMPLE_HEADLINE, title: "Alphaa sample" })
      const clean = await normalizePhoto(jpeg, 1350)
      if (clean) id = (await storePostImage(userId, clean.jpeg, SAMPLE_HEADLINE, "canva_template")).id
    } catch (err) {
      console.error("[post-images] canva sample", err instanceof Error ? err.message : err)
    }
  }
  if (id) await saveImageSettings(userId, { samples: { ...(s.samples ?? {}), [style]: id } })
  return id
}

export { SIZE_PX }
