// Competitor ad rows for the ad plan, the pure part (lib/ad-strategy/competitor-ads.ts fetches).
import type { TransparencyAd } from "@/lib/dataforseo-parse"

const DAY = 86_400_000

export type CompetitorAd = {
  page: string
  /** The ad's own words read from Google's picture of it; "" when they couldn't be read (video, image ads). */
  text: string
  title: string | null
  format: "text" | "video" | "image" | "carousel" | "other"
  since: string | null
  daysRunning: number | null
  url: string
  /** Where it runs. Older plans (before 2026-11-28) only had Meta ads and no platform. */
  platform?: "google" | "meta"
  /** The advertiser's verified name on Google. */
  advertiser?: string | null
  lastShown?: string | null
}

/** Why the plan has no Meta ads of competitors (shown with the plan). */
export const META_ADS_NOTE = "I can’t see your competitors’ Facebook and Instagram ads: Meta only shares political ads in the US and Canada. Your Meta ads use the hook types that work best in your industry instead."


/** Still running = Google showed it in the last 30 days. Newest first. */
export function activeAds(ads: TransparencyAd[], now = Date.now()): TransparencyAd[] {
  return ads
    .filter((a) => a.lastShown && now - Date.parse(a.lastShown) < 30 * DAY)
    .sort((a, b) => Date.parse(b.firstShown ?? "0") - Date.parse(a.firstShown ?? "0"))
}

export function toCompetitorAd(a: TransparencyAd, page: string, text: string): CompetitorAd {
  const start = a.firstShown ? Date.parse(a.firstShown) : NaN
  const end = a.lastShown ? Date.parse(a.lastShown) : NaN
  return {
    page, text: text.replace(/\s+/g, " ").trim().slice(0, 400), title: null, format: a.format,
    since: Number.isFinite(start) ? new Date(start).toISOString().slice(0, 10) : null,
    daysRunning: Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.floor((end - start) / DAY)) : null,
    url: a.url, platform: "google", advertiser: a.advertiser, lastShown: a.lastShown,
  }
}
