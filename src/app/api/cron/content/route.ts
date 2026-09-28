export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activeUsers, authorized } from "@/lib/cron/users"
import { writePost } from "@/lib/content"
import { generatePostImage } from "@/lib/images"
import { getAgentSettings } from "@/lib/agent/settings"
import { publishContent } from "@/lib/connector/publish"

// Fresh content on the plan's schedule: Starter 2 posts a month (1st, 15th),
// Pro / Full Service 4 (1st, 8th, 15th, 22nd). Each is a draft waiting for the
// owner's approval in "Posts & Pages" — nothing publishes on its own.
const DAYS: Record<string, number[]> = { starter: [1, 15], pro: [1, 8, 15, 22] }

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const day = new Date().getUTCDate()
  const users = (await activeUsers()).filter((u) => (DAYS[/pro|full/i.test(u.plan) ? "pro" : "starter"]).includes(day))
  void (async () => {
    for (const u of users) {
      const already = await db.mockActivity.findFirst({ where: { userId: u.id, type: "post_draft", createdAt: { gte: new Date(Date.now() - 3 * 86_400_000) } } })
      if (already) continue
      const user = await db.user.findUnique({ where: { id: u.id } })
      if (!user) continue
      try {
        // Pro owners can let posts go live without asking — only when the site is
        // connected and the post has no facts left for the owner to fill in.
        const s = await getAgentSettings(u.id)
        const auto = !!s.autoPublishPosts && /pro|full/i.test(user.plan) && (!!s.wp || !!s.site)
        const p = await writePost(user, undefined, { noPlaceholders: auto })
        const img = await generatePostImage(u.id, { title: p.title, businessType: user.businessType, city: user.city })
        const draft = await db.mockActivity.create({ data: { userId: u.id, type: "post_draft", title: `Drafted a post: “${p.title}”`, metadata: { ...p, status: "ready", imageId: img?.id ?? null } } })
        if (auto && !/\[[^\]]{2,}\]/.test(p.markdown)) {
          try {
            const r = await publishContent(u.id, { kind: "post", title: p.title, markdown: p.markdown, excerpt: p.excerpt, imageId: img?.id }, `Published “${p.title}” automatically`)
            await db.mockActivity.update({ where: { id: draft.id }, data: { metadata: { ...p, status: "published", auto: true, url: r.url, changeId: r.changeId, imageId: img?.id ?? null } } })
          } catch (err) {
            console.error(`[cron/content] auto-publish ${u.id}`, err instanceof Error ? err.message : err)
          }
        }
      } catch (err) {
        console.error(`[cron/content] ${u.id}`, err instanceof Error ? err.message : err)
      }
    }
  })()
  return NextResponse.json({ due: users.length })
}
