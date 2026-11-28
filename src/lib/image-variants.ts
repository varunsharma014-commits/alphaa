// One picture per post, every size each platform wants. A post_image row made by the card renderer
// (lib/social-card.ts) or the photo overlay (lib/post-images.ts) carries a `recipe`; from it this
// draws the same picture as 4:5, 9:16, 16:9 or the 1200×675 link image, saves it once as its own
// post_image row (`variantOf`, `format`) and remembers it on the original (`variants`), so posting
// again reuses it. Pictures without a recipe (Canva designs, older posts) are used as they are.
import { db } from "@/lib/db"
import { ensureBrandKit } from "@/lib/brand-kit"
import { renderCardJpeg, type CardRecipe } from "@/lib/social-card"
import { renderPhotoCard } from "@/lib/photo-render"
import { IMAGE_FORMATS, type ImageFormat } from "@/lib/image-formats"
import { IMAGE_SOURCE } from "@/lib/post-images"

export type PhotoRecipe = { v: 1; src: "photo"; headline: string; sourceId: string }
type Meta = { b64?: string; mime?: string; alt?: string; kind?: string; format?: ImageFormat; recipe?: CardRecipe | PhotoRecipe; variants?: Partial<Record<ImageFormat, string>>; variantOf?: string }

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

async function make(userId: string, imageId: string, format: ImageFormat): Promise<Variant | null> {
  if (!IMAGE_FORMATS.includes(format)) return null
  const row = await db.mockActivity.findFirst({ where: { id: imageId, userId, type: "post_image" }, select: { id: true, metadata: true } })
  const m = (row?.metadata ?? null) as Meta | null
  if (!row || !m?.b64) return null
  const own: Variant = { id: row.id, bytes: Buffer.from(m.b64, "base64"), format: m.format ?? "square", drawn: false }
  if ((m.format ?? (m.recipe ? "square" : null)) === format) return own
  const saved = m.variants?.[format]
  if (saved) {
    const v = await db.mockActivity.findFirst({ where: { id: saved, userId, type: "post_image" }, select: { id: true, metadata: true } })
    const b64 = (v?.metadata as Meta | null)?.b64
    if (v && b64) return { id: v.id, bytes: Buffer.from(b64, "base64"), format, drawn: false }
  }
  if (!m.recipe) return own

  const [brand, user] = await Promise.all([ensureBrandKit(userId).catch(() => null), db.user.findUnique({ where: { id: userId }, select: { businessName: true } })])
  let jpeg: Buffer | null = null
  if (m.recipe.src === "card") {
    const r = m.recipe
    jpeg = await renderCardJpeg({ headline: r.headline, subline: r.subline, style: r.style ?? undefined, house: r.house, businessName: user?.businessName ?? null, brand }, format)
  } else {
    const src = await db.mockActivity.findFirst({ where: { id: m.recipe.sourceId, userId, type: IMAGE_SOURCE }, select: { metadata: true } })
    const b64 = (src?.metadata as { b64?: string } | null)?.b64
    if (b64) jpeg = await renderPhotoCard({ photo: Buffer.from(b64, "base64"), headline: m.recipe.headline, businessName: user?.businessName ?? null, brand, size: format })
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
