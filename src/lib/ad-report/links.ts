// Report links stored in agent settings `adReports` (newest first, max MAX_LINKS; revoked and
// expired ones are pruned after 30 days) and the optional monthly email (`adReportMail`).
import { createElement } from "react"
import type { User } from "@prisma/client"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { sendEmail } from "@/lib/resend"
import AdReportEmail from "@/emails/AdReportEmail"
import { adReportFor } from "./data"
import { fmtDay, makeReportToken, MAX_LINKS, newLinkId, rangeFor, reportUrl, type ReportLink, type ReportRange } from "./token"

export type LinkView = ReportLink & { url: string | null; live: boolean }

const prune = (links: ReportLink[], now = Date.now()) =>
  links.filter((l) => !(l.revokedAt || Date.parse(l.expiresAt) < now) || now - Date.parse(l.revokedAt ?? l.expiresAt) < 30 * 86_400_000).slice(0, MAX_LINKS)

export function linkUrl(userId: string, l: ReportLink): string | null {
  const t = makeReportToken(userId, l.id, new Date(l.expiresAt))
  return t ? reportUrl(t) : null
}

export async function listLinks(userId: string): Promise<LinkView[]> {
  const s = await getAgentSettings(userId)
  const now = Date.now()
  return (s.adReports ?? []).map((l) => {
    const live = !l.revokedAt && Date.parse(l.expiresAt) > now
    return { ...l, live, url: live ? linkUrl(userId, l) : null }
  })
}

export async function createLink(userId: string, range: ReportRange, ttlDays: number, by: ReportLink["by"] = "owner"): Promise<LinkView | null> {
  const s = await getAgentSettings(userId)
  const now = new Date()
  const link: ReportLink = { id: newLinkId(), from: range.from, to: range.to, label: range.label, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlDays * 86_400_000).toISOString(), revokedAt: null, by }
  const url = linkUrl(userId, link)
  if (!url) return null // no signing secret: no links
  await saveAgentSettings(userId, { adReports: prune([link, ...(s.adReports ?? [])]) })
  return { ...link, url, live: true }
}

export async function revokeLink(userId: string, id: string): Promise<boolean> {
  const s = await getAgentSettings(userId)
  const links = s.adReports ?? []
  if (!links.some((l) => l.id === id && !l.revokedAt)) return false
  await saveAgentSettings(userId, { adReports: links.map((l) => (l.id === id ? { ...l, revokedAt: new Date().toISOString() } : l)) })
  return true
}

/** Plain email check for the one extra address the owner may type. */
export const cleanEmail = (s: string | null | undefined) => {
  const e = (s ?? "").trim().toLowerCase()
  return /^[^\s@<>,;"]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/.test(e) ? e : null
}

export async function setMonthly(userId: string, monthly: boolean, to: string | null): Promise<void> {
  const s = await getAgentSettings(userId)
  await saveAgentSettings(userId, { adReportMail: { monthly, to, lastSent: s.adReportMail?.lastSent ?? null, at: new Date().toISOString() } })
}

/** The monthly email: last month's report link to the owner (+ the one address they typed). Once per month. */
export async function sendMonthly(user: User, now = new Date()): Promise<"sent" | "skipped"> {
  const s = await getAgentSettings(user.id)
  const mail = s.adReportMail
  const month = now.toISOString().slice(0, 7)
  if (!mail?.monthly || mail.lastSent === month) return "skipped"
  const range = rangeFor("month", now)
  const report = await adReportFor(user.id, { id: `monthly-${month}`, ...range })
  // Nothing ran last month: no email (nothing to report).
  if (!report.rows.length && !report.changes.length) {
    await saveAgentSettings(user.id, { adReportMail: { ...mail, lastSent: month } })
    return "skipped"
  }
  const link = await createLink(user.id, range, 90, "monthly")
  if (!link?.url) return "skipped"
  // Mark first so a crash mid-send never sends twice.
  await saveAgentSettings(user.id, { adReportMail: { ...mail, lastSent: month } })
  const to = [user.email, cleanEmail(mail.to)].filter((x): x is string => !!x)
  for (const addr of Array.from(new Set(to))) {
    await sendEmail({ to: addr, subject: `Your ad report for ${range.label}`, react: createElement(AdReportEmail, { businessName: report.business, period: range.label, summary: report.summary, url: link.url, expires: fmtDay(link.expiresAt.slice(0, 10)) }) })
  }
  return "sent"
}
