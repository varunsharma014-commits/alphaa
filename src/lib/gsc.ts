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
