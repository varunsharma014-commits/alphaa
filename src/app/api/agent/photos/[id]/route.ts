export const dynamic = "force-dynamic"

import { currentUser } from "@/lib/connector/user"
import { photoBytes } from "@/lib/brand-photos"

// One photo from the signed-in owner's library (for the "Your photos" list). Owner only.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })
  const bytes = await photoBytes(user.id, (await params).id)
  if (!bytes) return new Response("Not found", { status: 404 })
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" } })
}
