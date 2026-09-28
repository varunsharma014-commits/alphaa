// "Is this paying for itself?" — the numbers an owner cares about, from the
// sources we can actually read. Every field is null when we can't measure it,
// so the briefing never shows a made-up zero.
import { db } from "@/lib/db"
import { getProfileActions, type ProfileActions } from "@/lib/gmb"
import { getAiReferrals, getTrafficSummary } from "@/lib/ga"
import { latestQuestionScan } from "@/lib/questions"

export type Roi = {
  /** Visitors from AI assistants, counted by the WordPress plugin. */
  pluginVisits: { total: number; prev: number; bySource: Record<string, number> } | null
  /** Same, from Google Analytics, when connected with the analytics scope. */
  gaVisits: { total: number; bySource: Record<string, number> } | null
  /** Google Business Profile actions over the last 7 days of available data, and the week before. */
  profile: { now: ProfileActions; prev: ProfileActions } | null
  /** How many of the four AIs named the business in the latest weekly check. */
  named: { count: number; of: number } | null
  /** Across every tracked customer question (the fuller measure). */
  questions: { named: number; answers: number; questions: number; wrongFacts: number } | null
  /** All website traffic from Google Analytics. */
  traffic: { sessions: number; prev: number; channels: { name: string; sessions: number }[] } | null
}

const DAY = 86_400_000

export async function getRoi(userId: string): Promise<Roi> {
  const [integ, settingsRow, visitsNow, visitsPrev, latestAudit] = await Promise.all([
    db.integration.findUnique({ where: { userId } }),
    db.mockActivity.findFirst({ where: { userId, type: "agent_settings" }, orderBy: { createdAt: "desc" } }),
    db.mockActivity.findMany({ where: { userId, type: "ai_visit", createdAt: { gte: new Date(Date.now() - 7 * DAY) } }, select: { metadata: true } }),
    db.mockActivity.count({ where: { userId, type: "ai_visit", createdAt: { gte: new Date(Date.now() - 14 * DAY), lt: new Date(Date.now() - 7 * DAY) } } }),
    db.audit.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, include: { aiEngineResults: { select: { engine: true, appeared: true } } } }),
  ])

  const wpConnected = !!(settingsRow?.metadata as { wp?: unknown } | null)?.wp
  let pluginVisits: Roi["pluginVisits"] = null
  if (wpConnected) {
    const bySource: Record<string, number> = {}
    for (const v of visitsNow) {
      const s = (v.metadata as { source?: string } | null)?.source ?? "AI"
      bySource[s] = (bySource[s] ?? 0) + 1
    }
    pluginVisits = { total: visitsNow.length, prev: visitsPrev, bySource }
  }

  // Google's performance data lags ~3 days; compare two full weeks ending then.
  let profile: Roi["profile"] = null
  if (integ?.gmbLocationId) {
    const end = new Date(Date.now() - 3 * DAY)
    const [now, prev] = await Promise.all([
      getProfileActions(integ, new Date(end.getTime() - 6 * DAY), end),
      getProfileActions(integ, new Date(end.getTime() - 13 * DAY), new Date(end.getTime() - 7 * DAY)),
    ])
    if (now && prev) profile = { now, prev }
  }

  const [gaVisits, traffic, qs] = await Promise.all([
    integ?.gaPropertyId ? getAiReferrals(integ, 7) : Promise.resolve(null),
    integ?.gaPropertyId ? getTrafficSummary(integ) : Promise.resolve(null),
    latestQuestionScan(userId).catch(() => null),
  ])
  const questions = qs && Date.now() - qs.at.getTime() < 10 * DAY
    ? { named: qs.scan.named, answers: qs.scan.answers, questions: qs.scan.questions.length, wrongFacts: qs.scan.facts.issues.length }
    : null

  let named: Roi["named"] = null
  const results = latestAudit?.aiEngineResults ?? []
  if (results.length) {
    const engines = new Map<string, boolean>()
    for (const r of results) engines.set(r.engine, (engines.get(r.engine) ?? false) || r.appeared)
    named = { count: [...engines.values()].filter(Boolean).length, of: engines.size }
  }

  return { pluginVisits, gaVisits, profile, named, questions, traffic }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const trend = (now: number, prev: number) => (prev === 0 ? "" : now > prev ? ` (up from ${prev})` : now < prev ? ` (down from ${prev})` : " (same as the week before)")

/** Plain sentences for the briefing, most persuasive first. Empty when nothing is measurable. */
export function roiLines(r: Roi): string[] {
  const lines: string[] = []
  const visits = r.gaVisits ?? (r.pluginVisits ? { total: r.pluginVisits.total, bySource: r.pluginVisits.bySource } : null)
  if (visits && visits.total > 0) {
    const top = Object.entries(visits.bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")
    lines.push(`AI assistants sent ${plural(visits.total, "person", "people")} to your website this week — ${top}.${r.pluginVisits && !r.gaVisits ? trend(r.pluginVisits.total, r.pluginVisits.prev) : ""}`)
  } else if (visits) {
    lines.push("No visitors came from an AI assistant this week yet. I count every one the moment it happens.")
  }
  if (r.profile) {
    const { now, prev } = r.profile
    if (now.calls || now.directions || now.websiteClicks) {
      lines.push(`From your Google listing: ${plural(now.calls, "call", "calls")}${trend(now.calls, prev.calls)}, ${plural(now.directions, "request", "requests")} for directions${trend(now.directions, prev.directions)} and ${plural(now.websiteClicks, "website visit", "website visits")}.`)
    }
  }
  if (r.questions && r.questions.answers > 0) {
    lines.push(`Across ${r.questions.questions} customer questions, the four AIs named you in ${r.questions.named} of ${r.questions.answers} answers.`)
    if (r.questions.wrongFacts) lines.push(`${plural(r.questions.wrongFacts, "AI answer gets", "AI answers get")} a fact about you wrong — I’ve flagged ${r.questions.wrongFacts === 1 ? "it" : "them"} below.`)
  } else if (r.named) lines.push(`${r.named.count} of ${r.named.of} AI assistants named you in my latest check.`)
  if (r.traffic && r.traffic.sessions > 0) {
    const top = r.traffic.channels.map((c) => `${c.name} ${c.sessions}`).join(", ")
    lines.push(`Your website had ${plural(r.traffic.sessions, "visit", "visits")} this week${trend(r.traffic.sessions, r.traffic.prev)} — ${top}.`)
  }
  return lines
}
