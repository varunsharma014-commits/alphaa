import { db } from "@/lib/db"
import { generateLlmsTxt } from "@/lib/llms-txt"

export const dynamic = "force-dynamic"

// Public route — no auth, like robots.txt. Serves the generated llms.txt for a
// given user id as plain text. alphaa hosts this; users can optionally point
// their own domain's /llms.txt at it.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await db.user.findUnique({ where: { id } })

  if (!user) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    })
  }

  return new Response(generateLlmsTxt(user), {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  })
}
