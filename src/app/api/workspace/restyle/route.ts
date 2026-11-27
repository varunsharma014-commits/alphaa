export const dynamic = "force-dynamic"
export const maxDuration = 60

// Social Studio → Preview → style swatch: re-render this post's image in the chosen card style,
// put it on the post, and save the style for the next posts ("How your images look" = card).
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { getPost, savePost } from "@/lib/social/store"
import { CARD_STYLES, renderSocialCard } from "@/lib/social-card"
import { ensureBrandKit } from "@/lib/brand-kit"
import { saveImageSettings } from "@/lib/post-images"

const body = z.object({ id: z.string().min(5).max(40), style: z.enum(CARD_STYLES) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPro(user)) return NextResponse.json({ error: "Social media comes with the Pro plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const p = await getPost(user.id, input.id)
  if (!p) return NextResponse.json({ error: "That post isn’t here any more." }, { status: 404 })
  if (p.status === "published" || p.status === "partial" || p.status === "publishing") return NextResponse.json({ error: "It already went out, so its picture can’t change." }, { status: 409 })
  const headline = (p.title?.trim() || p.text.split(/\n+/)[0] || "").split(/\s+/).slice(0, 6).join(" ")
  const brand = await ensureBrandKit(user.id).catch(() => null)
  const card = await renderSocialCard(user.id, { headline, businessName: user.businessName, brand, style: input.style })
  if (!card) return NextResponse.json({ error: "I couldn’t draw that headline. Try another style." }, { status: 422 })
  p.imageId = card.id
  await savePost(user.id, p)
  await saveImageSettings(user.id, { style: "card", cardStyle: input.style })
  return NextResponse.json({ ok: true, image: card.url })
}
