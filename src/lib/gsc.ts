import { google } from 'googleapis'
import { getAuthenticatedClient, StoredIntegration } from './google'

export interface KeywordRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function getTopKeywords(
  integration: StoredIntegration & { gscSiteUrl?: string | null },
  days = 28,
): Promise<KeywordRow[]> {
  if (!integration.gscSiteUrl) {
    throw new Error('No GSC site URL configured for this integration')
  }

  const auth = await getAuthenticatedClient(integration)
  const webmasters = google.webmasters({ version: 'v3', auth })

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const fmt = (d: Date): string => d.toISOString().split('T')[0]

  const response = await webmasters.searchanalytics.query({
    siteUrl: integration.gscSiteUrl,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['query'],
      rowLimit: 50,
    },
  })

  const rows = response.data.rows ?? []

  // Sort client-side by impressions descending (API default may vary)
  rows.sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))

  return rows.map((row) => ({
    query: row.keys?.[0] ?? '',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }))
}

export async function getSiteList(accessToken: string): Promise<string[]> {
  const auth = await getAuthenticatedClient({
    accessToken,
    refreshToken: null,
    expiresAt: null,
  })
  const webmasters = google.webmasters({ version: 'v3', auth })

  const response = await webmasters.sites.list()
  const sites = response.data.siteEntry ?? []

  return sites
    .filter((s): s is typeof s & { siteUrl: string } => s.siteUrl != null)
    .map((s) => s.siteUrl)
}

// ---------------------------------------------------------------------------
// Page-level stats (SEO decay, lib/seo/page-stats.ts). Two back-to-back 28-day
// windows, so a page's last 4 weeks can be compared with the 4 before.

export interface PageRow {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type GscWindow = { start: string; end: string }

const ymd = (d: Date): string => d.toISOString().slice(0, 10)

/**
 * The current and previous 28-day windows. Search Console data lags ~2-3 days, so the
 * current window ends 3 days ago, rounded back to the latest Sunday: one stable pair of
 * windows per week (daily syncs refresh the same snapshot instead of writing a new one).
 */
export function gscWindows(now = new Date()): { cur: GscWindow; prev: GscWindow } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3))
  end.setUTCDate(end.getUTCDate() - end.getUTCDay()) // back to Sunday
  const day = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)
  const curStart = day(end, -27)
  const prevEnd = day(curStart, -1)
  const prevStart = day(prevEnd, -27)
  return { cur: { start: ymd(curStart), end: ymd(end) }, prev: { start: ymd(prevStart), end: ymd(prevEnd) } }
}

/** Clicks / impressions / position per page for one window (top pages by clicks, then impressions). */
export async function getPageStats(
  integration: StoredIntegration & { gscSiteUrl?: string | null },
  win: GscWindow,
  rowLimit = 250,
): Promise<PageRow[]> {
  if (!integration.gscSiteUrl) throw new Error('No GSC site URL configured for this integration')
  const auth = await getAuthenticatedClient(integration)
  const webmasters = google.webmasters({ version: 'v3', auth })
  const response = await webmasters.searchanalytics.query({
    siteUrl: integration.gscSiteUrl,
    requestBody: { startDate: win.start, endDate: win.end, dimensions: ['page'], rowLimit, searchType: 'web' },
  })
  return (response.data.rows ?? []).map((row) => ({
    page: row.keys?.[0] ?? '',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  })).filter((r) => r.page)
}

/** The search terms one page showed up for in a window (for a refresh draft). */
export async function getPageQueries(
  integration: StoredIntegration & { gscSiteUrl?: string | null },
  page: string,
  win: GscWindow,
  rowLimit = 40,
): Promise<KeywordRow[]> {
  if (!integration.gscSiteUrl) throw new Error('No GSC site URL configured for this integration')
  const auth = await getAuthenticatedClient(integration)
  const webmasters = google.webmasters({ version: 'v3', auth })
  const response = await webmasters.searchanalytics.query({
    siteUrl: integration.gscSiteUrl,
    requestBody: {
      startDate: win.start,
      endDate: win.end,
      dimensions: ['query'],
      dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: page }] }],
      rowLimit,
    },
  })
  return (response.data.rows ?? []).map((row) => ({
    query: row.keys?.[0] ?? '',
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  })).filter((r) => r.query)
}
