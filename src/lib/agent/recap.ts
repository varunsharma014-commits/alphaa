// "Your month with Alphaa": the monthly recap (dashboard card in the first
// week of a month, and an email on the 1st). Measured numbers only.

import { db } from "@/lib/db"
import { getAiReferrals } from "@/lib/ga"
import { getEngineEvidence } from "@/lib/engine-evidence"
import { getCustomerValue } from "@/lib/customer-value"
import { ENGINE_NAME, ENGINE_ORDER, LEDGER_TYPES, ledgerText } from "@/lib/agent/briefing"

const DAY = 86_400_000

export type Recap = {
  month: string // "October"
  visitors: number | null // people AI sent to the site that month (null = can't measure)
  jobs: number // distinct pieces of work done
  highlights: string[] // a few of the jobs, plain English
  firsts: string[] // "Claude recommended you for the first time"
  recommending: string[] // AIs naming them now
  value: number | null // what one new customer is worth (estimate or owner's)
}

/** The calendar month before `now` (UTC). */
export function lastMonth(now = new Date()): { start: Date; end: Date } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1))
  return { start, end }
}

export async function buildRecap(userId: string, range = lastMonth()): Promise<Recap | null> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { integration: true } })
  if (!user) return null
  const { start, end } = range
  const within = { gte: start, lt: end }
  const [work, wins, siteVisits, anySite, evidence, value] = await Promise.all([
    db.mockActivity.findMany({ where: { userId, type: { in: LEDGER_TYPES }, createdAt: within }, orderBy: { createdAt: "desc" }, take: 300 }),
    db.mockActivity.findMany({ where: { userId, type: "win", createdAt: within, metadata: { path: ["kind"], equals: "engine_appeared" } }, select: { metadata: true } }),
    db.mockActivity.count({ where: { userId, type: "ai_visit", createdAt: within } }),
    db.mockActivity.count({ where: { userId, type: "ai_visit" } }),
    getEngineEvidence({ id: user.id, email: user.email }),
    getCustomerValue(userId),
  ])

  let visitors: number | null = anySite > 0 ? siteVisits : null
  if (user.integration?.gaPropertyId) {
    const days = Math.round((end.getTime() - start.getTime()) / DAY)
    const endDaysAgo = Math.max(1, Math.round((Date.now() - end.getTime()) / DAY) + 1)
    const ga = await getAiReferrals(user.integration, days, endDaysAgo)
    if (ga) visitors = ga.total
  }

  const texts = new Set<string>()
  for (const w of work) {
    const t = ledgerText(w.type, w.title, (w.metadata ?? {}) as Record<string, unknown>)
    if (t) texts.add(`${w.createdAt.toISOString().slice(0, 10)}|${t}`)
  }
  const highlights = [...new Set([...texts].map((t) => t.split("|")[1]))].slice(0, 5)
  const firsts = [...new Set(wins.map((w) => (w.metadata as { engine?: string } | null)?.engine).filter((e): e is string => !!e))]
    .map((e) => `${ENGINE_NAME[e as keyof typeof ENGINE_NAME] ?? e} recommended you for the first time`)
  const recommending = ENGINE_ORDER.filter((e) => evidence[e]?.state === "found" || evidence[e]?.state === "partial").map((e) => ENGINE_NAME[e])

  return { month: start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }), visitors, jobs: texts.size, highlights, firsts, recommending, value: value?.amount ?? null }
}
