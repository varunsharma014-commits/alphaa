export const dynamic = "force-dynamic"

import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { demoImgSig } from "@/lib/demo-week"

// Signed image for the public first-week preview (stored on the ScanLead).
export async function GET(req: Request) {
  const u = new URL(req.url)
  const id = u.searchParams.get("id") ?? ""
  const raw = u.searchParams.get("n")
  const teaser = raw === "t"
  const n = teaser ? "t" : Number(raw)
  const s = u.searchParams.get("s") ?? ""
  if (!id || (!teaser && (!Number.isInteger(n) || (n as number) < 0 || (n as number) > 5))) return new Response("Not found", { status: 404 })
  const want = Buffer.from(demoImgSig(id, n))
  if (s.length !== want.length || !timingSafeEqual(Buffer.from(s), want)) return new Response("Not found", { status: 404 })
  const lead = await db.scanLead.findUnique({ where: { id }, select: { ogData: true } })
  const og = lead?.ogData as { demoWeekImages?: string[]; demoTeaserImage?: string } | null
  const b64 = teaser ? og?.demoTeaserImage : og?.demoWeekImages?.[n as number]
  if (!b64) return new Response("Not found", { status: 404 })
  return new Response(Buffer.from(b64, "base64"), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } })
}
