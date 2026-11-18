export const dynamic = "force-dynamic"

import { currentUser } from "@/lib/connector/user"
import { thumbBytes } from "@/lib/library/store"

// Owner-only: the small preview of a brand library file (the file itself stays in Drive / Dropbox).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })
  const bytes = await thumbBytes(user.id, (await params).id)
  if (!bytes) return new Response("Not found", { status: 404 })
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" } })
}
