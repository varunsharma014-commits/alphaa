export const dynamic = "force-dynamic"

import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { demoImgSig } from "@/lib/demo-week"

// Signed image for the public first-week preview (stored on the ScanLead).
export async function GET(req: Request) {
  const u = new URL(req.url)
  const id = u.searchParams.get("id") ?? ""
  const n = Number(u.searchParams.get("n"))
  const s = u.searchParams.get("s") ?? ""
  if (!id || !Number.isInteger(n) || n < 0 || n > 5) return new Response("Not found", { status: 404 })
  const want = Buffer.from(demoImgSig(id, n))
  if (s.length !== want.length || !timingSafeEqual(Buffer.from(s), want)) return new Response("Not found", { status: 404 })
  const lead = await db.scanLead.findUnique({ where: { id }, select: { ogData: true } })
  const imgs = (lead?.ogData as { demoWeekImages?: string[] } | null)?.demoWeekImages
  const b64 = imgs?.[n]
  if (!b64) return new Response("Not found", { status: 404 })
  return new Response(Buffer.from(b64, "base64"), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } })
}
