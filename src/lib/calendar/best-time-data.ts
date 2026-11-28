// Loads the real data behind "best time to post" and caches the result for a day in agent
// settings `calendar.best`: LinkedIn company Page post stats (lib/social/stats.ts saves them on
// each post result) and GA4 sessions by weekday + hour (all visits, and visits from social).
// Anything without enough data falls back to labelled general guidance (best-time.ts `typical`).
import { google } from "googleapis"
import { db } from "@/lib/db"
import { getAuthenticatedClient } from "@/lib/google"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { listPosts } from "@/lib/social/store"
import { CHANNELS, fromPosts, fromTraffic, MIN_SOCIAL_SESSIONS, shiftGrid, typical, type Best, type BestTimes, type Channel, type PostPoint, type TrafficGrid } from "./best-time"
import { DEFAULT_TZ, isValidTz, offsetMinutes } from "./tz"

const TTL_MS = 24 * 3_600_000

export async function ownerTz(userId: string): Promise<string> {
  const s = await getAgentSettings(userId)
  return isValidTz(s.calendar?.timezone) ? s.calendar!.timezone! : DEFAULT_TZ
}

/** Saves the owner's zone (from the browser on first visit, or the picker). */
export async function saveOwnerTz(userId: string, tz: string): Promise<boolean> {
  if (!isValidTz(tz)) return false
  const s = await getAgentSettings(userId)
  if (s.calendar?.timezone === tz) return true
  // A new zone changes every local hour, so the cached best times are recomputed.
  await saveAgentSettings(userId, { calendar: { ...(s.calendar ?? {}), timezone: tz, tzAt: new Date().toISOString(), best: undefined } })
  return true
}

/** Website sessions by weekday × hour over 8 weeks, in the GA property's zone, all and from social. */
async function gaGrids(userId: string): Promise<{ tz: string; all: TrafficGrid; social: TrafficGrid } | null> {
  const integ = await db.integration.findUnique({ where: { userId }, select: { accessToken: true, refreshToken: true, expiresAt: true, gaPropertyId: true } })
  if (!integ?.gaPropertyId) return null
  try {
    const auth = await getAuthenticatedClient(integ)
    const data = google.analyticsdata({ version: "v1beta", auth })
    const res = await data.properties.runReport({
      property: `properties/${integ.gaPropertyId}`,
      requestBody: {
        dateRanges: [{ startDate: "56daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "dayOfWeek" }, { name: "hour" }, { name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        limit: "5000",
      },
    }, { timeout: 12_000 })
    const blank = (): TrafficGrid => Array.from({ length: 7 }, () => Array(24).fill(0))
    const all = blank(), social = blank()
    for (const r of res.data.rows ?? []) {
      const d = Number(r.dimensionValues?.[0]?.value), h = Number(r.dimensionValues?.[1]?.value)
      const ch = r.dimensionValues?.[2]?.value ?? ""
      const n = parseInt(r.metricValues?.[0]?.value ?? "0", 10) || 0
      if (!(d >= 0 && d < 7 && h >= 0 && h < 24)) continue
      all[d][h] += n
      if (/social/i.test(ch)) social[d][h] += n
    }
    const tz = res.data.metadata?.timeZone && isValidTz(res.data.metadata.timeZone) ? res.data.metadata.timeZone : DEFAULT_TZ
    return { tz, all, social }
  } catch (err) {
    console.warn("[best-time] GA", userId, err instanceof Error ? err.message : err)
    return null
  }
}

/** LinkedIn company Page posts with stats, as points (other platforms don't report stats to us yet). */
async function linkedinPoints(userId: string): Promise<PostPoint[]> {
  const posts = await listPosts(userId, 200).catch(() => [])
  const out: PostPoint[] = []
  for (const p of posts) {
    if (!p.publishedAt) continue
    for (const r of p.results ?? []) {
      if (!r.ok || r.platform !== "linkedin" || !r.stats?.impressions) continue
      const s = r.stats
      out.push({ at: Date.parse(p.publishedAt), impressions: s.impressions ?? 0, engagements: (s.likes ?? 0) + (s.comments ?? 0) + (s.shares ?? 0) + (s.clicks ?? 0) })
    }
  }
  return out
}

export async function computeBestTimes(userId: string, tz: string): Promise<BestTimes> {
  const [li, ga] = await Promise.all([linkedinPoints(userId), gaGrids(userId)])
  const channels: Partial<Record<Channel, Best>> = {}
  const liBest = fromPosts("linkedin", li, tz, "LinkedIn Page")
  if (liBest) channels.linkedin = liBest
  if (ga) {
    const now = Date.now()
    const shift = (offsetMinutes(now, tz) - offsetMinutes(now, ga.tz)) / 60
    const all = shiftGrid(ga.all, shift), social = shiftGrid(ga.social, shift)
    for (const c of ["google", "site", "email"] as const) {
      const b = fromTraffic(c, all, "When people visit your website (Google Analytics, last 8 weeks)")
      if (b) channels[c] = b
    }
    for (const c of ["facebook", "instagram", "linkedin", "tiktok", "x"] as const) {
      if (channels[c]) continue
      const b = fromTraffic(c, social, "When people reach your website from social media (Google Analytics, last 8 weeks)", MIN_SOCIAL_SESSIONS)
      if (b) channels[c] = b
    }
  }
  for (const c of CHANNELS) if (!channels[c]) channels[c] = typical(c)
  return { at: new Date().toISOString(), tz, channels }
}

/** Cached for a day per brand (and per zone). Never throws: worst case is the typical guidance. */
export async function getBestTimes(userId: string, opts: { tz?: string; fresh?: boolean } = {}): Promise<BestTimes> {
  const s = await getAgentSettings(userId)
  const tz = opts.tz ?? (isValidTz(s.calendar?.timezone) ? s.calendar!.timezone! : DEFAULT_TZ)
  const cached = s.calendar?.best
  if (!opts.fresh && cached && cached.tz === tz && Date.now() - Date.parse(cached.at) < TTL_MS) return cached
  try {
    const best = await computeBestTimes(userId, tz)
    const cur = await getAgentSettings(userId)
    await saveAgentSettings(userId, { calendar: { ...(cur.calendar ?? {}), best } })
    return best
  } catch (err) {
    console.warn("[best-time]", userId, err instanceof Error ? err.message : err)
    const channels: Partial<Record<Channel, Best>> = {}
    for (const c of CHANNELS) channels[c] = typical(c)
    return { at: new Date().toISOString(), tz, channels }
  }
}
