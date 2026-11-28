export const dynamic = "force-dynamic"
export const maxDuration = 120

// "Pages to refresh" / "Broken links" (components/workspace/SiteUpkeep.tsx):
//   draft    {url}      → write the refreshed page (lib/seo/refresh.ts draftRefresh), a post_draft
//   links    {url}      → the same page with its broken links fixed (no AI)
//   get      {draftId}  → a refresh draft, for the preview
//   publish  {draftId}  → approveSitePost → an UPDATE of the same page (Undo = /api/connect/wp/undo)
//   schedule {draftId}  → Autopilot: "Going out soon" (+72h stop window), same as new posts
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { approveSitePost } from "@/lib/approvals"
import { scheduleSitePost } from "@/lib/workspace/site-posts"
import { draftLinkFix, draftRefresh, type RefreshDraftMeta } from "@/lib/seo/refresh"
import { getAgentSettings } from "@/lib/agent/settings"
import { updateBlocker } from "@/lib/connector/publish"

const body = z.object({
  op: z.enum(["draft", "links", "get", "publish", "schedule"]),
  url: z.string().url().max(800).optional(),
  draftId: z.string().min(5).max(40).optional(),
})

function view(id: string, m: RefreshDraftMeta, blocker: string | null) {
  return { draftId: id, title: m.title, html: m.html, excerpt: m.excerpt, status: m.status, url: m.url ?? m.refresh.url, changeId: m.changeId ?? null, refresh: m.refresh, blocker }
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 })
  }
  const blockerFor = async (url: string) => {
    const s = await getAgentSettings(user.id)
    return s.wp || s.site ? updateBlocker(s, url) : "Your website isn’t connected, so I can’t update it myself."
  }

  if (input.op === "draft" || input.op === "links") {
    if (!input.url) return NextResponse.json({ error: "Which page?" }, { status: 400 })
    const r = input.op === "draft" ? await draftRefresh(user, input.url) : await draftLinkFix(user, input.url)
    if (!r.ok) return NextResponse.json({ error: r.error, ...(r.quota ? { quota: true, buy: true } : {}) }, { status: r.quota ? 429 : 409 })
    return NextResponse.json(view(r.draftId, r.meta, await blockerFor(r.meta.refresh.url)))
  }

  if (!input.draftId) return NextResponse.json({ error: "Which draft?" }, { status: 400 })
  const row = await db.mockActivity.findFirst({ where: { id: input.draftId, userId: user.id, type: "post_draft" } })
  const m = row?.metadata as RefreshDraftMeta | null
  if (!row || !m?.refresh?.url) return NextResponse.json({ error: "That draft isn’t here any more." }, { status: 404 })

  if (input.op === "get") return NextResponse.json(view(row.id, m, await blockerFor(m.refresh.url)))
  if (input.op === "schedule") {
    const r = await scheduleSitePost(user.id, row.id)
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 409 })
  }
  const r = await approveSitePost(user.id, row.id)
  if (!r.ok) return NextResponse.json({ error: r.error, ...(r.quota ? { quota: true, buy: true } : {}) }, { status: r.quota ? 429 : 409 })
  const after = await db.mockActivity.findUnique({ where: { id: row.id } })
  const am = after?.metadata as RefreshDraftMeta | null
  return NextResponse.json({ ok: true, url: r.url ?? null, changeId: am?.changeId ?? null })
}
