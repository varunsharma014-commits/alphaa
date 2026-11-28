// Everything scheduled or published, across channels, for the content calendar. Real rows only:
//   social   social_post (lib/social/store), one item per post, per platform it goes to
//   google   GbpPost (scheduled by the week run / approvals, published by /api/cron/due + gbp-posts)
//   website  post_draft rows (scheduled site posts, published by /api/cron/site-posts)
//   email    email_campaign rows (scheduled sends go out from /api/cron/due)
// Drafts with no time sit in the "waiting" tray; dropping one on the calendar schedules it.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { getAgentSettings, type AgentSettings } from "@/lib/agent/settings"
import { consentCurrent } from "@/lib/auto-approve-text"
import { listAccounts } from "@/lib/social/store"
import type { SocialPlatform, SocialPost } from "@/lib/social/types"
import { PLATFORM_NAME } from "@/lib/social/types"
import { getContacts, listCampaigns } from "@/lib/email-campaigns/store"
import { imageUrl } from "@/lib/images"
import { headlineOf, short } from "@/lib/workspace/common"
import { statsLine } from "@/lib/social/stats"
import { windowEndFor } from "./rules"
import type { Channel } from "./best-time"

export type CalKind = "social" | "gbp" | "site" | "email"
export type CalStatus = "scheduled" | "planned" | "draft" | "published" | "failed" | "sending"
export type CalItem = {
  key: string
  kind: CalKind
  id: string
  channels: Channel[]
  title: string
  text: string
  image: string | null
  status: CalStatus
  /** ISO time it goes out / went out; null = waiting in the tray. */
  at: string | null
  movable: boolean
  /** Why it can't be moved (shown in the picker). */
  why: string | null
  ownerOk: boolean
  /** Autopilot stop window end, when one applies (scheduled by Autopilot, not yet OK'd by the owner). */
  windowEnd: string | null
  links: { label: string; url: string }[]
  result: string | null
}

const BRACKETS = /\[[^\]]{2,}\]/
const WAITING_DAYS = 45

type SiteMeta = { title?: string; markdown?: string; status?: string; scheduledFor?: string; publishedAt?: string; url?: string; imageId?: string | null; ownerOk?: boolean; stopUntil?: string | null; scheduleError?: string | null }

export const autopilotOn = (s: AgentSettings) => !!(s.autoApprove && consentCurrent(s))

/** GbpPost has no metadata column: the ids the owner OK'd on the calendar live in settings. */
export const gbpOk = (s: AgentSettings, id: string) => !!s.calendar?.okGbp?.includes(id)

/** Social posts with their row's createdAt (the stop-window fallback). */
export async function socialRows(userId: string, take = 200, id?: string): Promise<(SocialPost & { createdAt: Date })[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "social_post", ...(id ? { id } : {}) }, orderBy: { createdAt: "desc" }, take })
  return rows.map((r) => ({ ...(r.metadata as Omit<SocialPost, "id">), id: r.id, createdAt: r.createdAt }))
}

export async function calendarItems(user: User, from: Date, to: Date): Promise<CalItem[]> {
  const userId = user.id
  const pro = hasPro(user)
  const [s, accounts, posts, gbp, drafts, campaigns, integ, contacts] = await Promise.all([
    getAgentSettings(userId),
    pro ? listAccounts(userId).catch(() => []) : Promise.resolve([]),
    pro ? socialRows(userId).catch(() => []) : Promise.resolve([]),
    db.gbpPost.findMany({
      where: { userId, OR: [{ scheduledFor: { gte: from, lte: to } }, { postedAt: { gte: from, lte: to } }, { status: "draft", scheduledFor: null, createdAt: { gte: new Date(Date.now() - WAITING_DAYS * 86_400_000) } }] },
      orderBy: { createdAt: "desc" }, take: 200,
    }),
    db.mockActivity.findMany({ where: { userId, type: "post_draft" }, orderBy: { createdAt: "desc" }, take: 150, select: { id: true, createdAt: true, metadata: true } }),
    pro ? listCampaigns(userId, 40).catch(() => []) : Promise.resolve([]),
    db.integration.findUnique({ where: { userId }, select: { gmbAccountId: true, gmbLocationId: true } }),
    pro ? getContacts(userId).catch(() => []) : Promise.resolve([]),
  ])
  const inRange = (iso: string | null | undefined) => { if (!iso) return false; const t = Date.parse(iso); return t >= from.getTime() && t <= to.getTime() }
  const recent = (d: Date) => Date.now() - d.getTime() < WAITING_DAYS * 86_400_000
  const auto = autopilotOn(s)
  const out: CalItem[] = []
  const byId = new Map(accounts.map((a) => [a.id, a]))

  // Social
  for (const p of posts) {
    const plats = Array.from(new Set(p.accountIds.map((id) => byId.get(id)?.platform).filter((x): x is SocialPlatform => !!x)))
    const done = p.status === "published" || p.status === "partial"
    const at = done ? p.publishedAt ?? p.scheduledFor ?? null : p.scheduledFor ?? null
    const status: CalStatus = done ? "published" : p.status === "failed" ? "failed" : p.status === "publishing" ? "sending" : p.status === "scheduled" ? "scheduled" : at ? "planned" : "draft"
    if (at ? !inRange(at) : !(status === "draft" && recent(p.createdAt))) continue
    const waitingOk = status === "scheduled" || status === "planned" || status === "draft"
    const why = !waitingOk ? (done ? "It already went out." : status === "sending" ? "It’s going out right now." : "It didn’t post. Open Social Studio to try again.") : !plats.length ? "Connect a social account first, then I can post it." : null
    const ok = (p.results ?? []).filter((r) => r.ok)
    const stats = ok.map((r) => statsLine(r.stats)).filter(Boolean)
    out.push({
      key: `social:${p.id}`, kind: "social", id: p.id, channels: plats.length ? plats : ["facebook"],
      title: p.title?.trim() || headlineOf(p.text), text: short(p.text, 220), image: p.imageId ? imageUrl(p.imageId) : null,
      status, at, movable: !why, why, ownerOk: !!p.ownerOk,
      windowEnd: status === "scheduled" && auto && !p.ownerOk ? new Date(windowEndFor(p.stopUntil, p.createdAt)).toISOString() : null,
      links: ok.filter((r) => r.url).map((r) => ({ label: PLATFORM_NAME[r.platform], url: r.url! })),
      result: stats.length ? stats.join(" · ") : null,
    })
  }

  // Google listing
  const listing = !!(integ?.gmbAccountId && integ.gmbLocationId)
  for (const g of gbp) {
    const done = g.status === "posted"
    const at = done ? (g.postedAt ?? g.scheduledFor)?.toISOString() ?? null : g.scheduledFor?.toISOString() ?? null
    const status: CalStatus = done ? "published" : g.status === "failed" ? "failed" : g.status === "scheduled" ? "scheduled" : at ? "planned" : "draft"
    if (at ? !inRange(at) : !(status === "draft" && recent(g.createdAt))) continue
    const why = done ? "It already went out." : status === "failed" ? "Google didn’t accept it. Open it in chat to fix it." : !pro ? "Google listing posts come with the Pro plan." : !listing ? "Connect your Google listing first." : BRACKETS.test(g.content) ? "It still has [bracketed] facts only you know. Fill them in first." : null
    const ok = gbpOk(s, g.id)
    out.push({
      key: `gbp:${g.id}`, kind: "gbp", id: g.id, channels: ["google"], title: headlineOf(g.content), text: short(g.content, 220), image: null,
      status, at, movable: !why, why, ownerOk: ok,
      windowEnd: status === "scheduled" && auto && !ok ? new Date(windowEndFor(null, g.createdAt)).toISOString() : null,
      links: [], result: null,
    })
  }

  // Website posts
  const site = !!(s.wp || s.site)
  let waitingSite = 0
  for (const r of drafts) {
    const m = (r.metadata ?? {}) as SiteMeta
    const done = m.status === "published"
    // Published rows from before 2026-11-28 have no publishedAt: their schedule time, else when the draft was made.
    const at = done ? m.publishedAt ?? m.scheduledFor ?? r.createdAt.toISOString() : m.status === "scheduled" ? m.scheduledFor ?? null : null
    const status: CalStatus = done ? "published" : m.status === "scheduled" ? "scheduled" : "draft"
    if (at ? !inRange(at) : !(status === "draft" && m.status === "ready" && recent(r.createdAt) && waitingSite++ < 12)) continue
    const why = done ? "It’s already live." : !site ? "Connect your website first, so I can publish it there." : BRACKETS.test(m.markdown ?? "") ? "This draft still has [bracketed] facts only you know. Fill them in first." : null
    out.push({
      key: `site:${r.id}`, kind: "site", id: r.id, channels: ["site"], title: m.title?.trim() || "New post", text: short((m.markdown ?? "").replace(/[#*_>`]/g, ""), 220), image: m.imageId ? imageUrl(m.imageId) : null,
      status, at, movable: !why, why, ownerOk: !!m.ownerOk,
      windowEnd: status === "scheduled" && auto && !m.ownerOk ? new Date(windowEndFor(m.stopUntil, r.createdAt)).toISOString() : null,
      links: done && m.url ? [{ label: "Live post", url: m.url }] : [], result: m.scheduleError && status === "draft" ? `Didn’t publish: ${m.scheduleError}` : null,
    })
  }

  // Email
  for (const r of campaigns) {
    const c = r.c
    const at = c.status === "sent" ? c.sentAt ?? c.startedAt ?? null : c.status === "sending" || c.status === "failed" ? c.startedAt ?? null : c.status === "scheduled" ? c.scheduledFor ?? null : null
    const status: CalStatus = c.status === "sent" ? "published" : c.status === "sending" ? "sending" : c.status === "failed" ? "failed" : c.status === "scheduled" ? "scheduled" : "draft"
    if (at ? !inRange(at) : !(status === "draft" && recent(r.createdAt))) continue
    const why = status === "published" ? "It already went out." : status === "sending" ? "It’s sending right now." : status === "failed" ? "It didn’t send." : !s.emailOutreach?.address ? "Add your business mailing address first (the law requires it on every email)." : !contacts.length ? "Add your customers first." : null
    out.push({
      key: `email:${r.id}`, kind: "email", id: r.id, channels: ["email"], title: c.subject, text: short(c.preview || c.paragraphs?.[0] || "", 220), image: null,
      status, at, movable: !why, why, ownerOk: status === "scheduled", windowEnd: null,
      links: [], result: status === "published" && c.sent != null ? `Sent to ${c.sent.toLocaleString("en-US")}` : c.error && status !== "published" ? c.error : null,
    })
  }

  return out.sort((a, b) => (a.at ? Date.parse(a.at) : Infinity) - (b.at ? Date.parse(b.at) : Infinity))
}
