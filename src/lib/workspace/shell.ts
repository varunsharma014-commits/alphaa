// What the workspace shell needs on every page: sidebar badges, the status island and the
// chat greeting. Cheap DB reads only (no outside calls), so every page stays fast.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasGrowth, hasPro } from "@/lib/billing"
import { listAccounts, listPosts } from "@/lib/social/store"
import { getContacts } from "@/lib/email-campaigns/store"
import { getAccess } from "@/lib/metaads/store"
import { getGadsAccount } from "@/lib/gads/store"
import { healthItems } from "@/lib/tracking-health"
import { eventDays } from "@/lib/tracking-events"
import { getDone } from "./briefing"
import { getTrackingData } from "./tracking"
import { scheduledSitePosts } from "./site-posts"
import { PRO_RE } from "@/lib/agent/autopilot"
import { consentCurrent } from "@/lib/auto-approve-text"

export type ShellData = {
  businessName: string
  firstName: string | null
  pro: boolean
  /** Pro plan or higher by plan name (auto-publishing Google + website posts). */
  planPro: boolean
  growth: boolean
  autopilot: boolean
  /** Autopilot is on under an older declaration wording: ask again (lib/auto-approve-text.ts). */
  consentStale: boolean
  /** Scheduled posts in the next 7 days. */
  goingOut: number
  socialScheduled: number
  channels: number
  /** Lead-tracking checks that pass / all (Growth with tracking on), else null. */
  signals: { ok: number; total: number } | null
  /** Rows under "Needs you" on Tracking & Setup (same function as that page). */
  trackingNeeds: number
  doneThisWeek: number
}

export async function getShellData(user: User): Promise<ShellData> {
  const pro = hasPro(user)
  const growth = hasGrowth(user)
  const week = new Date(Date.now() + 7 * 86_400_000)
  const [s, integ, accounts, posts, gbpSoon, contacts, meta, gacc, done] = await Promise.all([
    getAgentSettings(user.id),
    db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true, gaPropertyId: true, gscSiteUrl: true } }),
    pro ? listAccounts(user.id).catch(() => []) : Promise.resolve([]),
    pro ? listPosts(user.id, 30).catch(() => []) : Promise.resolve([]),
    db.gbpPost.count({ where: { userId: user.id, status: "scheduled", scheduledFor: { gte: new Date(), lte: week } } }),
    growth ? getContacts(user.id).catch(() => []) : Promise.resolve([]),
    growth ? getAccess(user.id).catch(() => null) : Promise.resolve(null),
    growth ? getGadsAccount(user.id).catch(() => null) : Promise.resolve(null),
    getDone(user.id).then((d) => d.length).catch(() => 0),
  ])
  const sitePosts = (await scheduledSitePosts(user.id).catch(() => [])).filter((p) => Date.parse(p.m.scheduledFor!) < week.getTime()).length
  const socialScheduled = posts.filter((p) => p.status === "scheduled" && p.scheduledFor && Date.parse(p.scheduledFor) > Date.now() && Date.parse(p.scheduledFor) < week.getTime()).length
  const channels = [
    !!integ?.gmbLocationId,
    !!(integ?.gaPropertyId || integ?.gscSiteUrl),
    !!(s.wp || s.site?.platform),
    accounts.length > 0,
    contacts.length > 0,
    !!meta,
    !!gacc?.customerId,
  ].filter(Boolean).length
  let signals: ShellData["signals"] = null
  if (growth && s.tracking?.on) {
    const items = healthItems(s, s.tracking.check, await eventDays(user.id, 30).catch(() => [])).filter((i) => !i.soft)
    if (items.length) signals = { ok: items.filter((i) => i.ok).length, total: items.length }
  }
  return {
    businessName: user.businessName?.trim() || user.websiteUrl || "your business",
    firstName: user.fullName?.trim().split(/\s+/)[0] || null,
    pro,
    planPro: PRO_RE.test(user.plan),
    growth,
    autopilot: !!s.autoApprove,
    consentStale: !!s.autoApprove && !consentCurrent(s),
    goingOut: socialScheduled + gbpSoon + sitePosts,
    socialScheduled,
    channels,
    signals,
    doneThisWeek: done,
    trackingNeeds: await getTrackingData(user).then((d) => d.needs).catch(() => 0),
  }
}
