// One picture per post, every size each platform wants. A post_image row made by the card renderer
// (lib/social-card.ts) or the photo overlay (lib/post-images.ts) carries a `recipe`; from it this
// draws the same picture as 4:5, 9:16, 16:9 or the 1200×675 link image, saves it once as its own
// post_image row (`variantOf`, `format`) and remembers it on the original (`variants`), so posting
// again reuses it. Text cards made before recipes existed (square, kind social_card, headline = alt)
// get one rebuilt from the row (`legacyRecipe`), so they are redrawn too. Pictures that can't be
// redrawn (Canva designs, older photo posts) are used as they are; `fixedKind` says which.
import { db } from "@/lib/db"
import { ensureBrandKit } from "@/lib/brand-kit"
import { CARD_STYLES, isHouse, renderCardJpeg, renderSocialCard, type CardRecipe, type CardStyle } from "@/lib/social-card"
import { renderPhotoCard } from "@/lib/photo-render"
import { IMAGE_FORMATS, type ImageFormat } from "@/lib/image-formats"
import { IMAGE_SOURCE } from "@/lib/post-images"

export type PhotoRecipe = { v: 1; src: "photo"; headline: string; sourceId: string }
type Meta = { b64?: string; mime?: string; alt?: string; kind?: string; format?: ImageFormat; recipe?: CardRecipe | PhotoRecipe; variants?: Partial<Record<ImageFormat, string>>; variantOf?: string; houseRedraw?: string }

export type Variant = { id: string; bytes: Buffer; format: ImageFormat; drawn: boolean }

const inFlight = new Map<string, Promise<Variant | null>>()

/** The post's picture in `format`: the original when it already is, a saved variant, or a new one. */
export function variantFor(userId: string, imageId: string, format: ImageFormat): Promise<Variant | null> {
  const key = `${imageId}:${format}`
  const hit = inFlight.get(key)
  if (hit) return hit
  const p = make(userId, imageId, format).finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
}

/** Why a picture can't be redrawn: a Canva design, a photo post from before sizes, or anything else. */
export type FixedKind = "canva" | "photo" | "other"
export function fixedKind(kind: string | undefined): FixedKind {
  if (/canva/i.test(kind ?? "")) return "canva"
  if (/photo|ai_scene/i.test(kind ?? "")) return "photo"
  return "other"
}

/** A text card we drew before recipes were stored: always square, its alt is the headline. */
const isLegacyCard = (m: Meta) => !m.recipe && !m.variantOf && m.kind === "social_card" && !!m.alt?.trim()

async function legacyRecipe(userId: string, m: Meta): Promise<CardRecipe | null> {
  if (!isLegacyCard(m)) return null
  const [u, st] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true } }),
    db.mockActivity.findFirst({ where: { userId, type: "agent_settings" }, orderBy: { createdAt: "desc" }, select: { metadata: true } }),
  ])
  const saved = ((st?.metadata as { images?: { cardStyle?: string } } | null)?.images?.cardStyle ?? null) as CardStyle | null
  return { v: 1, src: "card", headline: m.alt!.trim().replace(/\s+/g, " ").slice(0, 80), subline: null, style: saved && CARD_STYLES.includes(saved) ? saved : null, house: isHouse(u?.websiteUrl) }
}

/** What kind of picture this is, for the size preview's note. */
export async function imageKind(userId: string, imageId: string): Promise<{ redrawable: boolean; fixed: FixedKind | null }> {
  const row = await db.mockActivity.findFirst({ where: { id: imageId, userId, type: "post_image" }, select: { metadata: true } })
  const m = (row?.metadata ?? {}) as Meta
  const redrawable = !!m.recipe || isLegacyCard(m)
  return { redrawable, fixed: redrawable ? null : fixedKind(m.kind) }
}

const houseInFlight = new Map<string, Promise<string>>()

/**
 * alphaa.app's own waiting posts: a house card drawn before 2026-11-26 is the retired black & white
 * one (no recipe). Redraw it once in the colour house style and return the new picture's id (kept
 * on the old row as `houseRedraw`). Anything else returns the same id. Callers only pass pictures
 * of posts/ads that haven't gone out; published posts are never touched.
 */
export async function houseImageFor(userId: string, imageId: string): Promise<string> {
  const [u, row] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true, businessName: true } }),
    db.mockActivity.findFirst({ where: { id: imageId, userId, type: "post_image" }, select: { id: true, metadata: true } }),
  ])
  if (!row || !isHouse(u?.websiteUrl)) return imageId
  const m = (row.metadata ?? {}) as Meta
  if (!isLegacyCard(m)) return imageId
  if (m.houseRedraw) {
    const ok = await db.mockActivity.count({ where: { id: m.houseRedraw, userId, type: "post_image" } })
    if (ok) return m.houseRedraw
  }
  const hit = houseInFlight.get(imageId)
  if (hit) return hit
  const p = (async () => {
    const brand = await ensureBrandKit(userId).catch(() => null)
    const card = await renderSocialCard(userId, { headline: m.alt!.trim(), businessName: u?.businessName ?? null, brand, house: true })
    if (!card) return imageId
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...m, houseRedraw: card.id } as object } })
    return card.id
  })().finally(() => houseInFlight.delete(imageId))
  houseInFlight.set(imageId, p)
  return p
}

/** houseImageFor for a waiting social post: swaps the picture on the post itself (published ones are left alone). */
export async function refreshHousePost<P extends { imageId?: string | null; status: string }>(userId: string, post: P, save: (p: P) => Promise<unknown>): Promise<P> {
  if (!post.imageId || ["published", "partial", "publishing"].includes(post.status)) return post
  const next = await houseImageFor(userId, post.imageId).catch(() => post.imageId!)
  if (next !== post.imageId) { post.imageId = next; await save(post) }
  return post
}

async function make(userId: string, imageId: string, format: ImageFormat): Promise<Variant | null> {
  if (!IMAGE_FORMATS.includes(format)) return null
  const row = await db.mockActivity.findFirst({ where: { id: imageId, userId, type: "post_image" }, select: { id: true, metadata: true } })
  const m = (row?.metadata ?? null) as Meta | null
  if (!row || !m?.b64) return null
  const own: Variant = { id: row.id, bytes: Buffer.from(m.b64, "base64"), format: m.format ?? "square", drawn: false }
  const recipe: CardRecipe | PhotoRecipe | null = m.recipe ?? (await legacyRecipe(userId, m))
  if ((m.format ?? (recipe ? "square" : null)) === format) return own
  const saved = m.variants?.[format]
  if (saved) {
    const v = await db.mockActivity.findFirst({ where: { id: saved, userId, type: "post_image" }, select: { id: true, metadata: true } })
    const b64 = (v?.metadata as Meta | null)?.b64
    if (v && b64) return { id: v.id, bytes: Buffer.from(b64, "base64"), format, drawn: false }
  }
  if (!recipe) return own

  const [brand, user] = await Promise.all([ensureBrandKit(userId).catch(() => null), db.user.findUnique({ where: { id: userId }, select: { businessName: true } })])
  let jpeg: Buffer | null = null
  if (recipe.src === "card") {
    const r = recipe
    jpeg = await renderCardJpeg({ headline: r.headline, subline: r.subline, style: r.style ?? undefined, house: r.house, businessName: user?.businessName ?? null, brand }, format)
  } else {
    const src = await db.mockActivity.findFirst({ where: { id: recipe.sourceId, userId, type: IMAGE_SOURCE }, select: { metadata: true } })
    const b64 = (src?.metadata as { b64?: string } | null)?.b64
    if (b64) jpeg = await renderPhotoCard({ photo: Buffer.from(b64, "base64"), headline: recipe.headline, businessName: user?.businessName ?? null, brand, size: format })
  }
  if (!jpeg) return own
  const v = await db.mockActivity.create({
    data: { userId, type: "post_image", title: `Made the ${format} size of “${(m.alt ?? "").slice(0, 60)}”`, metadata: { b64: jpeg.toString("base64"), mime: "image/jpeg", alt: m.alt ?? "", kind: m.kind ?? "social_card", format, variantOf: row.id } as object },
  })
  // Remember it on the original (read again so two sizes drawn at once don't overwrite each other).
  const fresh = await db.mockActivity.findUnique({ where: { id: row.id }, select: { metadata: true } })
  const fm = (fresh?.metadata ?? m) as Meta
  await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...fm, variants: { ...(fm.variants ?? {}), [format]: v.id } } as object } })
  return { id: v.id, bytes: jpeg, format, drawn: true }
}
