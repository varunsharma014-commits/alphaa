// Search Console page-level snapshots for SEO decay. One MockActivity row (type "gsc_pages")
// per user per week: the current 28-day window + the 28 days before, per page, pulled in the
// daily sync (/api/integrations/sync → seo-sync cron). The same week's row is refreshed in
// place, so old weeks stay as history ("compare 4-week periods per page").
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { getPageStats, gscWindows } from "@/lib/gsc"
import type { StoredIntegration } from "@/lib/google"
import { mergeWindows, type PageSnapshot } from "@/lib/seo/decay"

export const GSC_PAGES = "gsc_pages"
const ROW_LIMIT = 250

export async function syncPageStats(userId: string, integ: StoredIntegration & { gscSiteUrl: string }): Promise<number> {
  const { cur, prev } = gscWindows()
  const [a, b] = await Promise.all([getPageStats(integ, cur, ROW_LIMIT), getPageStats(integ, prev, ROW_LIMIT)])
  const rows = mergeWindows(a, b, ROW_LIMIT)
  const snap: PageSnapshot & { site: string } = { cur, prev, at: new Date().toISOString(), site: integ.gscSiteUrl, rows }
  const metadata = snap as unknown as Prisma.InputJsonValue
  const existing = await db.mockActivity.findFirst({
    where: { userId, type: GSC_PAGES, metadata: { path: ["cur", "end"], equals: cur.end } },
    select: { id: true },
  })
  if (existing) await db.mockActivity.update({ where: { id: existing.id }, data: { metadata } })
  else await db.mockActivity.create({ data: { userId, type: GSC_PAGES, title: "Compared every page’s Google clicks with the 4 weeks before", metadata } })
  return rows.length
}

/** The newest weekly snapshot (null before the first sync with Search Console). */
export async function latestPageSnapshot(userId: string): Promise<(PageSnapshot & { site?: string }) | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: GSC_PAGES }, orderBy: { createdAt: "desc" }, select: { metadata: true } })
  const m = row?.metadata as (PageSnapshot & { site?: string }) | null
  return m && Array.isArray(m.rows) && m.cur?.end ? m : null
}
