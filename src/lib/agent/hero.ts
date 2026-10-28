// The number an owner opens the app for: how many people AI sent them in the
// last 30 days, and what that's worth. Only measured numbers: visits from AI
// assistants (Google Analytics, or our site tag / WordPress plugin). Nobody can
// see how often an AI recommended someone, so we never claim to count that;
// without visit data we fall back to how often the AIs named them in our checks.

import { db } from "@/lib/db"
import { getAiReferrals } from "@/lib/ga"
import { latestQuestionScan } from "@/lib/questions"
import { getCustomerValue, type CustomerValue } from "@/lib/customer-value"
import { PLAN_PRICES } from "@/lib/constants"

const DAY = 86_400_000

export type Hero = {
  visitors: { total: number; prev: number | null; bySource: Record<string, number>; via: "analytics" | "site" } | null
  named: { named: number; answers: number; questions: number } | null
  value: CustomerValue | null
  /** Months of Alphaa one new customer pays for. */
  paysFor: number | null
  /** Their monthly plan price, for re-working paysFor when they change the value. */
  price: number
}

export async function getHero(userId: string): Promise<Hero> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true, integration: true } })
  const integ = user?.integration
  const since = new Date(Date.now() - 30 * DAY)
  const [ga, gaPrev, siteNow, sitePrev, anySite, qs, value] = await Promise.all([
    integ?.gaPropertyId ? getAiReferrals(integ, 30) : Promise.resolve(null),
    integ?.gaPropertyId ? getAiReferrals(integ, 30, 31) : Promise.resolve(null),
    db.mockActivity.findMany({ where: { userId, type: "ai_visit", createdAt: { gte: since } }, select: { metadata: true } }),
    db.mockActivity.count({ where: { userId, type: "ai_visit", createdAt: { gte: new Date(Date.now() - 60 * DAY), lt: since } } }),
    db.mockActivity.count({ where: { userId, type: "ai_visit" } }),
    latestQuestionScan(userId).catch(() => null),
    getCustomerValue(userId),
  ])

  let visitors: Hero["visitors"] = null
  if (ga) visitors = { total: ga.total, prev: gaPrev?.total ?? null, bySource: ga.bySource, via: "analytics" }
  else if (anySite > 0) {
    const bySource: Record<string, number> = {}
    for (const v of siteNow) {
      const src = (v.metadata as { source?: string } | null)?.source ?? "AI"
      bySource[src] = (bySource[src] ?? 0) + 1
    }
    visitors = { total: siteNow.length, prev: sitePrev, bySource, via: "site" }
  }

  const named = qs && Date.now() - qs.at.getTime() < 14 * DAY ? { named: qs.scan.named, answers: qs.scan.answers, questions: qs.scan.questions.length } : null
  const price = /full/i.test(user?.plan ?? "") ? PLAN_PRICES.fullservice.monthly : /pro/i.test(user?.plan ?? "") ? PLAN_PRICES.pro.monthly : PLAN_PRICES.starter.monthly
  const paysFor = value ? Math.floor(value.amount / price) : null
  return { visitors, named, value, paysFor, price }
}
