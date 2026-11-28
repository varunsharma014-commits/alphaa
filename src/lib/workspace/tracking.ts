// Tracking & Setup: every connection the agent relies on, read from real state, split into
// "Needs you" (broken or not connected) and "Watching on my own" (working), with optional ones
// apart. Each working row says when it was last verified or last used, from stored data only.
// Onboarding steps that aren't connections (voice, brand, autopilot) live in Your rules / setup.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { healthItems, type HealthItem } from "@/lib/tracking-health"
import { eventDays, EVENT_KINDS } from "@/lib/tracking-events"
import { listAccounts, listPosts } from "@/lib/social/store"
import { PLATFORM_NAME } from "@/lib/social/types"
import { getAccess, listCampaigns as metaCampaigns, listLeads } from "@/lib/metaads/store"
import { getGadsAccount } from "@/lib/gads/store"
import { hasGrowth, hasPro } from "@/lib/billing"
import type { Chip } from "@/lib/agent/types"
import { ago, within } from "./common"
import { displayName } from "@/lib/display-name"
import { issueText } from "@/lib/humanize"

export type Act = { label: string; href?: string; topic?: string; chip?: Chip }
export type Conn = {
  key: string
  name: string
  sum: string
  /** "ok" working · "needs" broken or not connected · "optional" not used and not needed. */
  state: "ok" | "needs" | "optional"
  /** Amber parent: e.g. "1 needs attention" when a sub-connection is broken. */
  warn?: string | null
  act?: Act
  /** Real last-verified / last-used time, ISO, with its verb ("Checked", "Synced", "Last posted"). */
  verified?: { verb: string; at: string } | null
  detail: string
}
export type Signal = { src: string; ev: string; t: string; at: string; tone: "g" | "b" | "p" | "a" }
export type TrackingData = {
  conns: Conn[]
  health: HealthItem[]
  trackingOn: boolean
  signals: Signal[]
  growth: boolean
  /** Lead tracking is off and a website is connected: the one action inside the signals box. */
  turnOn: { platform: string; auto: boolean } | null
  needs: number
}

const KIND_TEXT: Record<string, string> = { phone: "Phone tap", email: "Email tap", form: "Form sent", hubspot: "HubSpot form sent", typeform: "Typeform sent", calendly: "Calendly booking", test: "Test lead (self-check)" }
const PLATFORM_LABEL: Record<string, string> = { wordpress: "WordPress", webflow: "Webflow", shopify: "Shopify", wix: "Wix" }

export async function getTrackingData(user: User, opts: { wait?: boolean } = {}): Promise<TrackingData> {
  // Lead tracking is Pro and up (2026-11-26); the ad accounts stay Growth.
  const growth = hasGrowth(user)
  const pro = hasPro(user)
  const [s, integ, accounts, meta, gacc, days, visits, leads, snap, rank, review, posts, mCamps] = await Promise.all([
    getAgentSettings(user.id),
    db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true, gaPropertyId: true, gscSiteUrl: true } }),
    pro ? listAccounts(user.id).catch(() => []) : Promise.resolve([]),
    getAccess(user.id).catch(() => null),
    getGadsAccount(user.id).catch(() => null),
    eventDays(user.id, 14).catch(() => []),
    db.mockActivity.findMany({ where: { userId: user.id, type: "ai_visit", createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 10, select: { metadata: true, createdAt: true } }),
    listLeads(user.id, { take: 5, sinceDays: 14 }).catch(() => []),
    db.analyticsSnapshot.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    db.keywordRanking.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    db.gmbReview.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    pro ? listPosts(user.id, 30).catch(() => []) : Promise.resolve([]),
    growth ? metaCampaigns(user.id, 10).catch(() => []) : Promise.resolve([]),
  ])
  const google = { href: "/api/integrations/google/connect?go=1", label: "Connect Google" }
  const site = !!(s.wp || s.site?.platform)
  const platform = s.wp ? "wordpress" : s.site?.platform ?? null
  const conns: Conn[] = []

  conns.push({
    key: "gbp", name: "Google Business Profile", state: integ?.gmbLocationId ? "ok" : "needs",
    sum: integ?.gmbLocationId ? "Calls, direction requests and reviews come in from here." : "Not connected. I can’t count calls from Google or reply to reviews yet.",
    act: integ?.gmbLocationId ? undefined : google,
    verified: integ?.gmbLocationId && review ? { verb: "Reviews synced", at: review.createdAt.toISOString() } : null,
    detail: "Your Google listing: I post updates, reply to reviews and read the calls and direction requests Google reports.",
  })
  conns.push({
    key: "ga", name: "Google Analytics", state: integ?.gaPropertyId ? "ok" : "needs",
    sum: integ?.gaPropertyId ? "Website visits, and visits sent by AI assistants." : "Not connected. I can’t see your website visits yet.",
    act: integ?.gaPropertyId ? undefined : { label: integ ? "Pick your property" : "Connect Google", href: integ ? "/dashboard/settings/integrations" : google.href },
    verified: integ?.gaPropertyId && snap ? { verb: "Synced", at: snap.createdAt.toISOString() } : null,
    detail: "Google Analytics tells me how many people visit your site and where they came from. I sync it every morning.",
  })
  conns.push({
    key: "gsc", name: "Google Search Console", state: integ?.gscSiteUrl ? "ok" : "needs",
    sum: integ?.gscSiteUrl ? "What people search on Google to find you." : "Not connected. I can’t see your Google searches yet.",
    act: integ?.gscSiteUrl ? undefined : { label: integ ? "Pick your site" : "Connect Google", href: integ ? "/dashboard/settings/integrations" : google.href },
    verified: integ?.gscSiteUrl && rank ? { verb: "Synced", at: rank.createdAt.toISOString() } : null,
    detail: "Search Console shows the searches you appear for and how often people click. I sync it every morning.",
  })
  conns.push({
    key: "site", name: "Your website", state: site ? "ok" : "needs",
    sum: site ? `Connected${platform ? ` (${PLATFORM_LABEL[platform] ?? platform})` : ""}. I publish approved posts and fixes myself.` : "Not connected. I email your web person instead of publishing myself.",
    act: site ? undefined : { label: "Connect my website", chip: { label: "Connect my website", action: { type: "wp-connect" } } },
    verified: s.wp?.lastSeenAt ? { verb: "Plugin checked in", at: s.wp.lastSeenAt } : null,
    detail: "With your website connected I publish posts and fixes myself, and every change has an Undo.",
  })
  const health = pro ? healthItems(s, s.tracking?.check, days) : []
  if (pro) {
    const on = !!s.tracking?.on
    const broken = health.filter((h) => !h.ok && !h.soft).length
    conns.push({
      key: "leads", name: "Lead tracking on your site", state: on && !broken ? "ok" : "needs",
      warn: on && broken ? `${broken} check${broken === 1 ? "" : "s"} need${broken === 1 ? "s" : ""} attention` : null,
      sum: on ? "Phone taps, email taps and form sends are counted." : "Off. Calls, forms and bookings from your website aren’t counted yet.",
      act: { label: on ? (broken ? "Fix it" : "Check it now") : "Turn it on", topic: "tracking" },
      verified: on && s.tracking?.check?.at ? { verb: "Checked", at: s.tracking.check.at } : null,
      detail: "I add Google Analytics and the Meta Pixel to your site, count every phone tap, email tap and form send, and test it myself every morning.",
    })
  }
  if (pro) {
    const bad = accounts.filter((a) => a.status === "expired" || (!!a.expiresAt && Date.parse(a.expiresAt) < Date.now() && !a.refreshEnc))
    const provider = (p: string) => (p === "facebook" || p === "instagram" ? "meta" : p)
    const lastPosted = posts.map((p) => p.publishedAt).filter((x): x is string => !!x).sort().pop() ?? null
    conns.push({
      key: "social", name: "Social accounts",
      state: !accounts.length ? "needs" : bad.length ? "needs" : "ok",
      warn: bad.length ? `${bad.length} need${bad.length === 1 ? "s" : ""} attention` : null,
      sum: accounts.length ? accounts.map((a) => `${PLATFORM_NAME[a.platform]}: ${displayName(a.name)}${bad.includes(a) ? " (login expired)" : ""}`).join(" · ") : "None connected. I write your posts, but I can’t post them yet.",
      act: bad.length ? { label: `Reconnect ${PLATFORM_NAME[bad[0].platform]}`, href: `/api/social/connect/${provider(bad[0].platform)}` } : accounts.length ? undefined : { label: "Connect", topic: "social" },
      verified: !bad.length && lastPosted ? { verb: "Last posted", at: lastPosted } : null,
      detail: "Facebook, Instagram and LinkedIn accounts I post to. I read each account’s login state before every post.",
    })
  }
  if (growth) {
    const metaUsed = mCamps.some((c) => c.status !== "dismissed")
    const lastPoll = mCamps.map((c) => c.lastLeadPollAt).filter((x): x is string => !!x).sort().pop() ?? null
    conns.push({
      key: "meta", name: "Meta ads account", state: meta ? "ok" : metaUsed ? "needs" : "optional",
      sum: meta ? "Connected. I read results and leads from the campaigns I build." : "Not connected. Only needed if you run ads on Facebook & Instagram.",
      act: meta ? undefined : { label: "Connect", topic: "ads" },
      verified: meta && lastPoll ? { verb: "Leads checked", at: lastPoll } : null,
      detail: "Your Facebook & Instagram ad account, for the campaigns I build and their results.",
    })
    conns.push({
      key: "gads", name: "Google Ads account", state: gacc?.customerId ? "ok" : gacc ? "needs" : "optional",
      sum: gacc?.customerId ? `Connected${gacc.customerName ? `: ${gacc.customerName}` : ""}.` : gacc ? "Signed in, but no ad account picked yet." : "Not connected. Only needed if you run ads on Google.",
      act: gacc?.customerId ? undefined : { label: gacc ? "Pick the account" : "Connect", topic: "ads" },
      verified: null,
      detail: "Your Google Ads account: spend, clicks and conversions, and the search campaign I build.",
    })
    conns.push(await salesRow(user, !!meta || !!gacc?.customerId, !!opts.wait))
  }

  // Signals that actually arrived: lead counters per day, AI visits (time, source, page) and ad leads.
  const signals: Signal[] = []
  for (const d of days.slice(0, 7)) {
    for (const k of EVENT_KINDS) {
      const c = d.counts?.[k]
      if (!c) continue
      const at = `${d.day}T12:00:00.000Z`
      signals.push({ src: "Website", ev: `${KIND_TEXT[k] ?? k} × ${c}`, t: d.day === new Date().toISOString().slice(0, 10) ? "today" : new Date(at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), at, tone: k === "test" ? "b" : "g" })
    }
  }
  for (const v of visits) {
    const m = (v.metadata ?? {}) as { source?: string; path?: string }
    signals.push({ src: "AI answers", ev: `Visit${m.path ? ` on ${m.path}` : ""} · from ${m.source ?? "an AI assistant"}`, t: ago(v.createdAt.toISOString()), at: v.createdAt.toISOString(), tone: "b" })
  }
  for (const l of leads) signals.push({ src: "Meta ad", ev: "New lead from your ad form", t: ago(l.createdTime), at: l.createdTime, tone: "p" })
  signals.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  const trackingOn = !!s.tracking?.on
  return {
    conns,
    health,
    trackingOn,
    signals: signals.slice(0, 12),
    // `growth` here = lead tracking is on the plan (Pro and up since 2026-11-26).
    growth: pro,
    // WordPress (plugin 1.3.0+) installs it itself; other builders need the Alphaa tag pasted once.
    turnOn: pro && !trackingOn && site ? { platform: PLATFORM_LABEL[platform ?? ""] ?? "your website", auto: platform === "wordpress" } : null,
    needs: conns.filter((c) => c.state === "needs").length,
  }
}

/** "Track sales from your ads": which revenue sources feed ROAS (lib/roas/sources.ts) and the one next step. */
async function salesRow(user: User, adsConnected: boolean, wait: boolean): Promise<Conn> {
  const base = { key: "sales", name: "Track sales from your ads", detail: "Return on ad spend needs real sales: purchase values from your Meta Pixel or Google Ads tags, purchases in Google Analytics, WooCommerce orders through the plugin, or leads you mark as won on the Ads page. I use one source per ad platform so a sale is never counted twice, and I label my estimate from your customer value apart from real sales." }
  if (!adsConnected) return { ...base, state: "optional", sum: "Only needed once you run ads. Then I show what each dollar of ads brings back.", verified: null }
  const { getRoas, peekRoas } = await import("@/lib/roas/sources")
  // The sidebar badge (shell) never waits on ad platforms: it uses what's cached and warms it.
  const r = wait ? await within(getRoas(user), 7000, null) : await peekRoas(user)
  if (!r && !wait) return { ...base, state: "optional", sum: "Checking your sales sources.", verified: null }
  if (!r) return { ...base, state: "needs", sum: "I couldn’t read your sales sources just now. I’ll retry.", act: { label: "Open Ads", href: "/dashboard/ads" }, verified: null }
  const live = r.sources.filter((x) => x.state === "data")
  const update = r.sources.find((x) => x.state === "update")
  const spent = r.windows[30].platforms.some((p) => p.spend > 0)
  if (!live.length && !spent) return { ...base, state: "optional", sum: "Once your ads spend, I show what each dollar brings back. " + (r.next ?? ""), act: { label: "Open Ads", href: "/dashboard/ads" }, verified: null, detail: `${base.detail} ${r.sources.map((x) => x.text).join(" ")}` }
  return {
    ...base,
    state: live.length ? "ok" : "needs",
    warn: live.length && update ? update.text : null,
    sum: live.length ? live.map((x) => x.text).join(" ") : r.next ?? "No sales tracked from your ads yet.",
    act: live.length ? undefined : { label: "Mark leads won", href: "/dashboard/ads" },
    verified: live.length ? { verb: "Checked", at: r.at } : null,
    detail: `${base.detail} ${r.sources.map((x) => x.text).join(" ")}`,
  }
}

// ── Site health (Tracking → Site health; replaced /dashboard/audit and /dashboard/speed) ──────
// The newest website check (CrawlResult), grouped once per problem type with the pages it was
// found on. Link problems live in SiteUpkeep ("Links to fix") and speed in SiteVitals, so they're
// left out here. Read from the database only: nothing here waits on Google.
export type HealthGroup = { key: string; title: string; why: string; fix: string; severity: "bad" | "warn" | "idle"; urls: string[] }
export type SiteHealth = {
  at: string | null
  pages: number | null
  serious: number
  smaller: number
  groups: HealthGroup[]
  aiBlocks: { engine: string; fix: string }[]
  site: string | null
}

const LINK_TYPES = new Set(["broken_internal_link", "broken_outbound_link", "redirect_chain"])
const SEV: Record<string, HealthGroup["severity"]> = { critical: "bad", warning: "warn", improvement: "idle" }
const SEV_RANK: Record<HealthGroup["severity"], number> = { bad: 0, warn: 1, idle: 2 }

export async function getSiteHealth(user: User): Promise<SiteHealth> {
  const site = user.websiteUrl?.trim() ? (/^https?:\/\//i.test(user.websiteUrl.trim()) ? user.websiteUrl.trim() : `https://${user.websiteUrl.trim()}`) : null
  const crawl = await db.crawlResult.findFirst({ where: { userId: user.id }, orderBy: { crawledAt: "desc" }, select: { crawledAt: true, pagesScanned: true, issues: true } }).catch(() => null)
  if (!crawl) return { at: null, pages: null, serious: 0, smaller: 0, groups: [], aiBlocks: [], site }
  type Raw = { type?: string; code?: string; severity?: string; url?: string; engine?: string; fix?: string; description?: string }
  const raw = (Array.isArray(crawl.issues) ? crawl.issues : []) as Raw[]
  const aiBlocks: SiteHealth["aiBlocks"] = []
  const byType = new Map<string, HealthGroup>()
  for (const i of raw) {
    const type = String(i.type ?? i.code ?? "")
    if (!type || LINK_TYPES.has(type)) continue
    if (type === "ai_crawler_blocked") {
      const engine = String(i.engine ?? "An AI assistant")
      if (!aiBlocks.some((b) => b.engine === engine)) aiBlocks.push({ engine, fix: `In your robots.txt file, allow ${engine} to read your site (change its “Disallow: /” to “Allow: /”, or remove that rule). If someone else manages your site, send them this.` })
      continue
    }
    const t = issueText(type)
    if (!t) continue
    const g = byType.get(type) ?? { key: type, ...t, severity: SEV[i.severity ?? ""] ?? "warn", urls: [] }
    const url = !i.url || i.url === "sitewide" ? site : i.url
    if (url && !g.urls.includes(url)) g.urls.push(url)
    if (SEV_RANK[SEV[i.severity ?? ""] ?? "warn"] < SEV_RANK[g.severity]) g.severity = SEV[i.severity ?? ""] ?? g.severity
    byType.set(type, g)
  }
  const groups = [...byType.values()].filter((g) => g.urls.length).sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.urls.length - a.urls.length)
  return {
    at: crawl.crawledAt.toISOString(),
    pages: crawl.pagesScanned ?? null,
    serious: groups.filter((g) => g.severity === "bad").length + aiBlocks.length,
    smaller: groups.filter((g) => g.severity !== "bad").length,
    groups,
    aiBlocks,
    site,
  }
}
