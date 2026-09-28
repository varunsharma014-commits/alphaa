export const dynamic = "force-dynamic"

import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { imageSig } from "@/lib/images"

// Public, signed: website platforms fetch featured images from here when a
// post is published. The signature stops anyone enumerating other images.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id.replace(/\.jpe?g$/i, "")
  const s = new URL(req.url).searchParams.get("s") ?? ""
  const want = Buffer.from(imageSig(id))
  if (s.length !== want.length || !timingSafeEqual(Buffer.from(s), want)) return new Response("Not found", { status: 404 })
  const row = await db.mockActivity.findFirst({ where: { id, type: "post_image" } })
  const m = row?.metadata as { b64?: string; mime?: string } | null
  if (!m?.b64) return new Response("Not found", { status: 404 })
  return new Response(Buffer.from(m.b64, "base64"), { headers: { "Content-Type": m.mime ?? "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } })
}
