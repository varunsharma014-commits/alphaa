// Search volume from Google's own Keyword Planner (KeywordPlanIdeaService), free, through
// ALPHAA'S Google Ads connection: the founder's own connected Google Ads login (a comped
// account's gads_account row), never a customer's account. Alphaa's Google Cloud project
// (alphaa-497512) has Basic access, which covers Keyword Planner.
//
// Env (optional):
//   GADS_PLANNER_USER_ID           the brand row whose Google Ads connection to use (else the newest
//                                  active connection on a comped/founder account)
//   GADS_PLANNER_CUSTOMER_ID       the ad account to call on (else that connection's chosen account)
//   GADS_PLANNER_LOGIN_CUSTOMER_ID a manager account id to send as login-customer-id
//   KEYWORD_PLANNER=0              turns this off (DataForSEO's Google Ads volume is the fallback)
import { db } from "@/lib/db"
import { compedEmailWhere } from "@/lib/billing"
import { accessToken } from "@/lib/gads/client"
import { getGadsAccount } from "@/lib/gads/store"
import * as api from "@/lib/gads/api"

export type PlannerConn = { userId: string; customerId: string; loginCustomerId: string | null; token: string }

let cachedOwner: { userId: string; at: number } | null = null

async function plannerOwner(): Promise<string | null> {
  if (process.env.GADS_PLANNER_USER_ID) return process.env.GADS_PLANNER_USER_ID
  if (cachedOwner && Date.now() - cachedOwner.at < 60 * 60_000) return cachedOwner.userId
  const rows = await db.mockActivity.findMany({
    where: { type: "gads_account", user: { OR: compedEmailWhere() } },
    orderBy: { createdAt: "desc" },
    select: { userId: true, metadata: true },
    take: 10,
  })
  const hit = rows.find((r) => {
    const m = r.metadata as { status?: string; refreshEnc?: string; customerId?: string } | null
    return m?.status === "active" && !!m.refreshEnc && !!m.customerId
  })
  cachedOwner = hit ? { userId: hit.userId, at: Date.now() } : null
  return hit?.userId ?? null
}

/** Alphaa's own Keyword Planner connection, or null when there isn't one (or it's turned off). */
export async function plannerConnection(): Promise<PlannerConn | null> {
  if (process.env.KEYWORD_PLANNER === "0") return null
  const userId = await plannerOwner()
  if (!userId) return null
  const acc = await getGadsAccount(userId)
  const customerId = process.env.GADS_PLANNER_CUSTOMER_ID || acc?.customerId
  if (!acc || !customerId) return null
  const token = await accessToken(userId, acc)
  return { userId, customerId, loginCustomerId: process.env.GADS_PLANNER_LOGIN_CUSTOMER_ID || null, token }
}

const geoCache = new Map<string, string | null>()

/** Geo target constant for the brand's city (falls back to the country). Cached in memory. */
export async function plannerGeo(c: PlannerConn, city: string | null, country: "US" | "CA" | null): Promise<string[]> {
  const COUNTRY: Record<string, string> = { US: "geoTargetConstants/2840", CA: "geoTargetConstants/2124" }
  if (city) {
    const key = `${city.toLowerCase()}|${country ?? ""}`
    if (!geoCache.has(key)) {
      const g = await api.suggestGeoTarget(city, country, { token: c.token, loginCustomerId: c.loginCustomerId }).catch(() => null)
      geoCache.set(key, g)
    }
    const g = geoCache.get(key)
    if (g) return [g]
  }
  return country ? [COUNTRY[country]] : []
}

/** Historical metrics for up to 1,000 keywords per call (Google allows 10,000; we stay small). */
export async function plannerHistorical(c: PlannerConn, keywords: string[], geoTargets: string[], language: string | null): Promise<api.HistoricalMetric[]> {
  const out: api.HistoricalMetric[] = []
  for (let i = 0; i < keywords.length; i += 1000) {
    const body = api.historicalMetricsBody({ keywords: keywords.slice(i, i + 1000), language, geoTargets })
    out.push(...(await api.generateKeywordHistoricalMetrics(c.customerId, body, { token: c.token, loginCustomerId: c.loginCustomerId })))
  }
  return out
}
