export const dynamic = "force-dynamic"
export const maxDuration = 60

// Social Studio → Preview → size switcher: this post's picture in one size (4:5, 9:16, 1200×675),
// drawn once from its recipe and kept (lib/image-variants.ts), the same file posting uses.
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { getPost, savePost } from "@/lib/social/store"
import { imageUrl } from "@/lib/images"
import { imageKind, refreshHousePost, variantFor } from "@/lib/image-variants"
import { IMAGE_FORMATS, type ImageFormat } from "@/lib/image-formats"

const body = z.object({ id: z.string().min(5).max(40), format: z.enum(IMAGE_FORMATS as [ImageFormat, ...ImageFormat[]]) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPro(user)) return NextResponse.json({ error: "Social media comes with the Pro plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const found = await getPost(user.id, input.id)
  if (!found?.imageId) return NextResponse.json({ error: "This post has no picture." }, { status: 404 })
  // alphaa.app's own waiting posts: a retired black & white house card is redrawn in colour first.
  const p = await refreshHousePost(user.id, found, (x) => savePost(user.id, x)).catch(() => found)
  const imageId = p.imageId!
  const v = await variantFor(user.id, imageId, input.format).catch(() => null)
  if (!v) return NextResponse.json({ error: "I couldn’t draw that size. Try again." }, { status: 422 })
  // `exact` = false when the picture can't be redrawn (a Canva design, an older photo post): the
  // frame shows it whole (letterboxed) and `fixed` says why.
  const exact = v.format === input.format
  const fixed = exact ? null : (await imageKind(user.id, imageId).catch(() => null))?.fixed ?? "other"
  return NextResponse.json({ image: imageUrl(v.id), format: v.format, exact, fixed, post: imageUrl(imageId) })
}
