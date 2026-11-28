// "Waiting for review" on the Briefing: items a creator sent for review or a reviewer approved,
// that haven't gone live yet. Empty for brands without a team (no team_review rows).
import { db } from "@/lib/db"
import { markLabel, reviewMarks, type ReviewKind, type ReviewState } from "./review"

export type QueueItem = { kind: ReviewKind; id: string; state: ReviewState; label: string; title: string; at: string }

const short = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s)

export async function teamQueue(brandId: string, max = 6): Promise<QueueItem[]> {
  const marks = await reviewMarks(brandId)
  if (!marks.size) return []
  const out: QueueItem[] = []
  for (const [key, m] of marks) {
    if (out.length >= max) break
    const i = key.indexOf(":")
    const kind = key.slice(0, i) as ReviewKind
    const id = key.slice(i + 1)
    const title = await openTitle(brandId, kind, id).catch(() => null)
    if (!title) continue // gone, or already live
    out.push({ kind, id, state: m.state, label: markLabel(m) ?? "", title, at: m.at })
  }
  return out
}

/** The item's title while it is still waiting; null once it's live or gone. */
async function openTitle(brandId: string, kind: ReviewKind, id: string): Promise<string | null> {
  if (kind === "site") {
    const d = await db.mockActivity.findFirst({ where: { id, userId: brandId, type: "post_draft" }, select: { metadata: true } })
    const m = (d?.metadata ?? null) as { title?: string; status?: string } | null
    return m && m.status !== "published" && m.status !== "scheduled" ? short(m.title || "A website post") : null
  }
  if (kind === "gbp") {
    const g = await db.gbpPost.findFirst({ where: { id, userId: brandId }, select: { content: true, status: true } })
    return g && g.status !== "posted" && g.status !== "scheduled" ? short(g.content) : null
  }
  if (kind === "review") {
    const r = await db.gmbReview.findFirst({ where: { id, userId: brandId }, select: { authorName: true, reply: true } })
    return r && !r.reply ? `Reply to ${r.authorName}’s review` : null
  }
  if (kind === "social") {
    const { getPost } = await import("@/lib/social/store")
    const p = await getPost(brandId, id)
    return p && p.status === "draft" ? short(p.text || "A social post") : null
  }
  return null
}
