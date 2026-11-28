export const dynamic = "force-dynamic"
export const maxDuration = 180

// The originality check for one website draft (lib/originality.ts):
//   get     {draftId} → the saved result + whether it still matches the saved text
//   check   {draftId} → runs it (the saved result is reused while the text is unchanged)
//   rewrite {draftId} → rewrites only the flagged lines (saved as an AI version), checks again
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { checkDraft, rewriteFlagged, storedOriginality } from "@/lib/originality"
import { getDraft } from "@/lib/draft-versions"
import { once } from "@/lib/draft-dedupe"

const body = z.object({ op: z.enum(["get", "check", "rewrite"]), draftId: z.string().min(5).max(40) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  if (input.op === "get") {
    const s = await storedOriginality(user.id, input.draftId)
    return s ? NextResponse.json(s) : NextResponse.json({ error: "That draft isn’t here any more." }, { status: 404 })
  }
  if (input.op === "check") {
    try {
      const result = await once(`orig:${user.id}:${input.draftId}`, () => checkDraft(user.id, input.draftId))
      return NextResponse.json({ result, fresh: true, checkable: result !== null })
    } catch (err) {
      console.error("[workspace/originality] check", err instanceof Error ? err.message : err)
      return NextResponse.json({ error: "I couldn’t run the check just now. Try again in a minute." }, { status: 502 })
    }
  }
  const r = await once(`orig-rw:${user.id}:${input.draftId}`, () => rewriteFlagged(user, input.draftId))
  if (!r.ok) return NextResponse.json({ error: r.error, ...(r.quota ? { quota: true, buy: true } : {}) }, { status: r.quota ? 429 : 409 })
  return NextResponse.json({ result: r.result, fresh: true, checkable: true, changed: r.changed, draft: await getDraft(user.id, input.draftId) })
}
