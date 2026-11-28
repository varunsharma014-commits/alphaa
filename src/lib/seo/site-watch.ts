// The weekly site check (/api/cron/site-check): the same own-site crawl as "Check my site now"
// (lib/crawler.ts, links checked), run for every active brand once a week so broken links are found
// without a click. Polite: one brand at a time, robots.txt respected, a short pause between pages,
// 40 pages, the link checker's own per-host limits (lib/seo/links.ts) and a time cap per brand.
// New link problems since the brand's previous check → one `site_links` row (Briefing question +
// ledger) and the existing "Fix the links" drafts (lib/seo/refresh.ts draftLinkFix, no AI) for the
// pages with the most new problems.
import { db } from "@/lib/db"
import { crawlWebsite, type CrawlIssue } from "@/lib/crawler"
import { draftLinkFix } from "@/lib/seo/refresh"

export const SITE_LINKS = "site_links"
export const LINK_TYPES = ["broken_internal_link", "broken_outbound_link", "redirect_chain"] as const
/** A brand checked (weekly or by hand) within this long is skipped. */
export const RECHECK_MS = 5 * 86_400_000
const BRAND_CAP_MS = 150_000
const MAX_DRAFTS = 3

export type LinkProblem = { type: (typeof LINK_TYPES)[number]; target: string; status: number | null; sources: string[] }
export type SiteLinksMeta = { crawlId: string; prevCrawlId: string | null; checked: number | null; total: number; new: LinkProblem[]; drafts: { page: string; draftId: string }[]; /** Pages I couldn't fix in the page text, and why (the web person's job). */ skipped?: { page: string; why: string }[] }

const isLink = (i: CrawlIssue): i is CrawlIssue & { target: string } => (LINK_TYPES as readonly string[]).includes(i.type) && !!i.target
export const problemKey = (p: { type: string; target: string }) => `${p.type}|${p.target.replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase()}`

/** Link problems in a crawl's issues (pure). */
export function linkProblems(issues: unknown): LinkProblem[] {
  const list = Array.isArray(issues) ? (issues as CrawlIssue[]) : []
  return list.filter(isLink).map((i) => ({ type: i.type as LinkProblem["type"], target: i.target, status: i.status ?? null, sources: i.sources ?? [] }))
}

/** Problems in `cur` that weren't in `prev` (pure). No previous check = everything is new. */
export function newProblems(prev: LinkProblem[] | null, cur: LinkProblem[]): LinkProblem[] {
  if (!prev) return cur
  const had = new Set(prev.map(problemKey))
  return cur.filter((p) => !had.has(problemKey(p)))
}

/** The pages to fix first: most new problems, then most problems overall (pure). */
export function pagesToFix(problems: LinkProblem[], max = MAX_DRAFTS): string[] {
  const count = new Map<string, number>()
  for (const p of problems) for (const s of p.sources) count.set(s, (count.get(s) ?? 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([page]) => page)
}

/** Was the site checked recently (weekly run or "Check my site now", links included)? */
export async function checkedRecently(userId: string, now = Date.now()): Promise<boolean> {
  const rows = await db.crawlResult.findMany({ where: { userId, crawledAt: { gte: new Date(now - RECHECK_MS) } }, select: { metaIssues: true }, take: 5 })
  return rows.some((r) => typeof (r.metaIssues as { linksChecked?: unknown } | null)?.linksChecked === "number")
}

type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

/** One brand: crawl, store the result, compare with the previous link check, note + draft what's new. */
export async function weeklySiteCheck(user: U): Promise<{ status: "checked" | "skipped" | "no_site" | "timeout"; newProblems?: number; drafts?: number }> {
  if (!user.websiteUrl) return { status: "no_site" }
  if (await checkedRecently(user.id)) return { status: "skipped" }
  const prev = await db.crawlResult.findFirst({ where: { userId: user.id }, orderBy: { crawledAt: "desc" }, select: { id: true, issues: true, metaIssues: true } })
  const prevHadLinks = typeof (prev?.metaIssues as { linksChecked?: unknown } | null)?.linksChecked === "number"

  const output = await Promise.race([
    crawlWebsite(user.websiteUrl, 40, { checkLinks: true, respectRobots: true, pageGapMs: 400 }),
    new Promise<null>((r) => setTimeout(() => r(null), BRAND_CAP_MS)),
  ])
  if (!output) return { status: "timeout" }
  const crawl = await db.crawlResult.create({
    data: { userId: user.id, url: user.websiteUrl, pagesScanned: output.pagesScanned, issues: output.issues, schemaFound: output.schemaFound, schemaMissing: output.schemaMissing, metaIssues: output.metaIssues },
  })
  const cur = linkProblems(output.issues)
  const fresh = newProblems(prevHadLinks ? linkProblems(prev?.issues) : null, cur)
  if (!fresh.length) return { status: "checked", newProblems: 0, drafts: 0 }

  // The existing "Fix the links" drafts for the pages with the most new problems (no AI; one page read each).
  const drafts: SiteLinksMeta["drafts"] = []
  const skipped: { page: string; why: string }[] = []
  for (const page of pagesToFix(fresh)) {
    // A link-fix draft still waiting from an older check doesn't have this week's problems: it's
    // replaced by a new one (draftLinkFix would otherwise hand back the old draft).
    const old = await db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft", createdAt: { lt: crawl.crawledAt }, metadata: { path: ["refresh", "url"], equals: page } }, select: { id: true, metadata: true } })
    for (const o of old) {
      const om = o.metadata as { status?: string; refresh?: { kind?: string } }
      if (om.refresh?.kind === "links" && om.status === "ready") await db.mockActivity.update({ where: { id: o.id }, data: { metadata: { ...(o.metadata as object), status: "superseded" } } })
    }
    const r = await draftLinkFix(user, page).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) }))
    if (r.ok) drafts.push({ page, draftId: r.draftId })
    else skipped.push({ page, why: r.error })
  }
  const meta: SiteLinksMeta = { crawlId: crawl.id, prevCrawlId: prevHadLinks ? prev!.id : null, checked: output.metaIssues.linksChecked ?? null, total: cur.length, new: fresh.slice(0, 40), drafts, ...(skipped.length ? { skipped } : {}) }
  const n = fresh.length
  await db.mockActivity.create({ data: { userId: user.id, type: SITE_LINKS, title: `Found ${n} new link problem${n === 1 ? "" : "s"} on your site`, metadata: meta as object } })
  return { status: "checked", newProblems: n, drafts: drafts.length }
}

export type LinkNews = { id: string; count: number; pages: number; drafts: number; at: string }

/**
 * For the Briefing: the newest weekly finding (7 days) that still matters. Problems a newer check no
 * longer finds drop out, and it's done once every draft it made was published, sent or undone.
 */
export async function pendingLinkNews(userId: string): Promise<LinkNews | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: SITE_LINKS, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } }, orderBy: { createdAt: "desc" } })
  const m = row?.metadata as SiteLinksMeta | null
  if (!row || !m?.new?.length) return null
  const latest = await db.crawlResult.findFirst({ where: { userId }, orderBy: { crawledAt: "desc" }, select: { id: true, issues: true } })
  let still = m.new
  if (latest && latest.id !== m.crawlId) {
    const now = new Set(linkProblems(latest.issues).map(problemKey))
    still = m.new.filter((p) => now.has(problemKey(p)))
  }
  if (!still.length) return null
  if (m.drafts.length) {
    const rows = await db.mockActivity.findMany({ where: { userId, id: { in: m.drafts.map((d) => d.draftId) } }, select: { metadata: true } })
    const waiting = rows.filter((r) => ["ready", "scheduled"].includes((r.metadata as { status?: string } | null)?.status ?? "")).length
    if (!waiting) return null
  }
  return { id: row.id, count: still.length, pages: new Set(still.flatMap((p) => p.sources)).size, drafts: m.drafts.length, at: row.createdAt.toISOString() }
}
