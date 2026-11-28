// Data for the "Pages to refresh" + "Broken links" fix items (Tracking & Setup, Website health).
// Real rows only: the newest Search Console page snapshot (lib/seo/page-stats.ts), the newest
// crawl's link issues (lib/crawler.ts), the pages Alphaa published, and waiting refresh drafts.
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { consentCurrent } from "@/lib/auto-approve-text"
import { PLATFORM_NAME, updateBlocker } from "@/lib/connector/publish"
import { latestPageSnapshot } from "@/lib/seo/page-stats"
import { detectDecay, evidenceLines, pathOf, winLabel } from "@/lib/seo/decay"
import type { CrawlIssue } from "@/lib/crawler"
import type { RefreshDraftMeta } from "@/lib/seo/refresh"

type U = { id: string; websiteUrl: string | null }

export type UpkeepDraft = { id: string; status: string; kind: "refresh" | "links"; changeId?: string; url?: string }
export type DecayRow = { page: string; path: string; evidence: string[]; lostClicks: number; ours: boolean; blocker: string | null; draft: UpkeepDraft | null }
export type LinkRow = { type: "broken_internal_link" | "broken_outbound_link" | "redirect_chain"; target: string; status: number | null; sources: string[]; finalUrl?: string; hops: number; text: string }
export type LinkPage = { page: string; path: string; count: number; ours: boolean; blocker: string | null; draft: UpkeepDraft | null }

export type Upkeep = {
  gsc: { connected: boolean; checked: number; span: string | null; at: string | null; pages: DecayRow[] }
  links: { crawledAt: string | null; checked: number | null; outboundChecked: number | null; items: LinkRow[]; pages: LinkPage[] }
  siteConnected: boolean
  platform: string | null
  autopilot: boolean
  webPersonEmail: string | null
}

const key = (u: string) => u.replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase()

export async function getUpkeep(user: U): Promise<Upkeep> {
  const [s, integ, snap, crawl, changes, drafts] = await Promise.all([
    getAgentSettings(user.id),
    db.integration.findUnique({ where: { userId: user.id }, select: { gscSiteUrl: true } }),
    latestPageSnapshot(user.id),
    db.crawlResult.findFirst({ where: { userId: user.id }, orderBy: { crawledAt: "desc" } }),
    db.mockActivity.findMany({ where: { userId: user.id, type: "site_change" }, orderBy: { createdAt: "desc" }, take: 300, select: { metadata: true } }),
    db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, metadata: true, createdAt: true } }),
  ])

  // Pages Alphaa published (posts/pages it created and didn't undo).
  const ours = new Set<string>()
  for (const c of changes) {
    const m = (c.metadata ?? {}) as { op?: string; url?: string; undone?: boolean }
    if ((m.op === "post" || m.op === "page") && m.url && !m.undone) ours.add(key(m.url))
  }
  for (const d of drafts) {
    const m = (d.metadata ?? {}) as { status?: string; url?: string; refresh?: unknown }
    if (m.status === "published" && m.url && !m.refresh) ours.add(key(m.url))
  }
  // The newest refresh draft per page + kind (waiting, scheduled or just published).
  const draftFor = new Map<string, UpkeepDraft>()
  for (const d of drafts) {
    const m = d.metadata as RefreshDraftMeta | null
    if (!m?.refresh?.url) continue
    const k = `${m.refresh.kind}|${key(m.refresh.url)}`
    if (draftFor.has(k)) continue
    if (m.status === "undone" || (m.status === "published" && Date.now() - d.createdAt.getTime() > 14 * 86_400_000)) continue
    draftFor.set(k, { id: d.id, status: m.status, kind: m.refresh.kind, changeId: m.changeId, url: m.url })
  }
  const connected = !!(s.wp || s.site)
  const blocker = (url: string) => (connected ? updateBlocker(s, url) : "Your website isn’t connected, so I can’t update it myself.")

  const decay = snap ? detectDecay(snap) : []
  const gsc: Upkeep["gsc"] = {
    connected: !!integ?.gscSiteUrl,
    checked: snap?.rows.length ?? 0,
    span: snap ? `${winLabel(snap.prev)} vs ${winLabel(snap.cur)}` : null,
    at: snap?.at ?? null,
    pages: decay.map((p) => ({
      page: p.page,
      path: p.path,
      evidence: evidenceLines(p, snap!),
      lostClicks: p.lostClicks,
      ours: ours.has(key(p.page)),
      blocker: blocker(p.page),
      draft: draftFor.get(`refresh|${key(p.page)}`) ?? null,
    })),
  }

  const issues = (Array.isArray(crawl?.issues) ? (crawl!.issues as unknown as CrawlIssue[]) : []).filter(
    (i) => (i.type === "broken_internal_link" || i.type === "broken_outbound_link" || i.type === "redirect_chain") && i.target,
  )
  const items: LinkRow[] = issues.map((i) => ({
    type: i.type as LinkRow["type"],
    target: i.target!,
    status: i.status ?? null,
    sources: i.sources ?? [],
    finalUrl: i.finalUrl,
    hops: i.hops?.length ?? 0,
    text: i.description,
  }))
  const perPage = new Map<string, number>()
  for (const it of items) for (const src of it.sources) perPage.set(src, (perPage.get(src) ?? 0) + 1)
  const meta = (crawl?.metaIssues ?? {}) as { linksChecked?: number; outboundChecked?: number }
  const links: Upkeep["links"] = {
    crawledAt: crawl?.crawledAt.toISOString() ?? null,
    checked: typeof meta.linksChecked === "number" ? meta.linksChecked : null,
    outboundChecked: typeof meta.outboundChecked === "number" ? meta.outboundChecked : null,
    items,
    pages: [...perPage.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([page, count]) => ({ page, path: pathOf(page), count, ours: ours.has(key(page)), blocker: blocker(page), draft: draftFor.get(`links|${key(page)}`) ?? null })),
  }

  return {
    gsc,
    links,
    siteConnected: connected,
    platform: s.wp ? "WordPress" : s.site ? PLATFORM_NAME[s.site.platform] : null,
    autopilot: !!s.autoApprove && consentCurrent(s),
    webPersonEmail: s.webPersonEmail ?? null,
  }
}
