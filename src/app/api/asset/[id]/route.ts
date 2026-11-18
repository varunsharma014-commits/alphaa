export const dynamic = "force-dynamic"
export const maxDuration = 300

import { checkAssetSig, MissingFile, openAsset } from "@/lib/library/open"
import { getAssetAnyUser } from "@/lib/library/store"

// Public but signed (HMAC, a few hours): Facebook and Instagram pull a brand library video from
// here when we post it. The bytes stream straight from the owner's Drive / Dropbox and are never
// stored. Range requests pass through, so players and Meta's fetcher can seek.
const PASS = ["content-length", "content-range", "accept-ranges", "last-modified", "etag"]

async function serve(req: Request, params: Promise<{ id: string }>, method: "GET" | "HEAD"): Promise<Response> {
  const id = (await params).id.replace(/\.(mp4|mov|jpe?g|png)$/i, "")
  const u = new URL(req.url)
  if (!checkAssetSig(id, u.searchParams.get("e"), u.searchParams.get("s"))) return new Response("Not found", { status: 404 })
  const row = await getAssetAnyUser(id)
  if (!row || row.asset.status === "missing" || row.asset.kind === "brandbook") return new Response("Not found", { status: 404 })
  const range = req.headers.get("range")
  if (range && !/^bytes=\d*-\d*(,\s*\d*-\d*)*$/.test(range)) return new Response("Bad range", { status: 416 })
  let up: Response
  try {
    up = await openAsset(row.userId, row.asset, { range, method })
  } catch (err) {
    if (err instanceof MissingFile) {
      const { markMissing } = await import("@/lib/library/ingest")
      await markMissing(row.userId, row.asset, err.message).catch(() => null)
      return new Response("Not found", { status: 404 })
    }
    console.error("[asset]", err instanceof Error ? err.message : err)
    return new Response("Upstream error", { status: 502 })
  }
  if (!up.ok && up.status !== 206) return new Response("Upstream error", { status: up.status === 416 ? 416 : 502 })
  const h = new Headers({ "Content-Type": row.asset.mime || up.headers.get("content-type") || "application/octet-stream", "Cache-Control": "private, no-store", "Accept-Ranges": "bytes", "X-Robots-Tag": "noindex" })
  for (const k of PASS) { const v = up.headers.get(k); if (v) h.set(k, v) }
  return new Response(method === "HEAD" ? null : up.body, { status: up.status, headers: h })
}

export function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return serve(req, params, "GET")
}
export function HEAD(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return serve(req, params, "HEAD")
}
