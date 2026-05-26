import { google } from 'googleapis'
import { getAuthenticatedClient, StoredIntegration } from './google'

export interface TopPage {
  path: string
  views: number
  sessions: number
}

export interface TrafficSource {
  source: string
  sessions: number
  percentage: number
}

export interface AnalyticsData {
  sessions: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  organicSessions: number
  topPages: TopPage[]
  trafficSources: TrafficSource[]
}

export async function getAnalyticsSnapshot(
  integration: StoredIntegration & { gaPropertyId?: string | null },
  days = 28,
): Promise<AnalyticsData> {
  if (!integration.gaPropertyId) {
    throw new Error('No GA property ID configured for this integration')
  }

  const auth = await getAuthenticatedClient(integration)
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth })

  const endDate = 'today'
  const startDate = `${days}daysAgo`
  const propertyPath = `properties/${integration.gaPropertyId}`

  // Fetch overview metrics, top pages, and traffic sources in parallel
  const [overviewResponse, pagesResponse, sourcesResponse, organicResponse] =
    await Promise.all([
      analyticsdata.properties.runReport({
        property: propertyPath,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        },
      }),
      analyticsdata.properties.runReport({
        property: propertyPath,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
          orderBys: [
            { metric: { metricName: 'screenPageViews' }, desc: true },
          ],
          limit: '10',
        },
      }),
      analyticsdata.properties.runReport({
        property: propertyPath,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '10',
        },
      }),
      analyticsdata.properties.runReport({
        property: propertyPath,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
          metrics: [{ name: 'sessions' }],
          dimensionFilter: {
            filter: {
              fieldName: 'sessionDefaultChannelGrouping',
              stringFilter: {
                value: 'Organic Search',
                matchType: 'EXACT',
              },
            },
          },
        },
      }),
    ])

  // Parse overview metrics
  const overviewRow = overviewResponse.data.rows?.[0]
  const mv = overviewRow?.metricValues ?? []
  const sessions = parseInt(mv[0]?.value ?? '0', 10)
  const pageViews = parseInt(mv[1]?.value ?? '0', 10)
  const bounceRate = parseFloat(mv[2]?.value ?? '0')
  const avgSessionDuration = parseFloat(mv[3]?.value ?? '0')

  // Parse organic sessions
  const organicSessions = parseInt(
    organicResponse.data.rows?.[0]?.metricValues?.[0]?.value ?? '0',
    10,
  )

  // Parse top pages
  const topPages: TopPage[] = (pagesResponse.data.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? '/',
    views: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
    sessions: parseInt(row.metricValues?.[1]?.value ?? '0', 10),
  }))

  // Parse traffic sources with percentage
  const sourceRows = sourcesResponse.data.rows ?? []
  const totalSourceSessions = sourceRows.reduce(
    (sum, row) => sum + parseInt(row.metricValues?.[0]?.value ?? '0', 10),
    0,
  )
  const trafficSources: TrafficSource[] = sourceRows.map((row) => {
    const s = parseInt(row.metricValues?.[0]?.value ?? '0', 10)
    return {
      source: row.dimensionValues?.[0]?.value ?? 'Unknown',
      sessions: s,
      percentage:
        totalSourceSessions > 0
          ? Math.round((s / totalSourceSessions) * 1000) / 10
          : 0,
    }
  })

  return {
    sessions,
    pageViews,
    bounceRate,
    avgSessionDuration,
    organicSessions,
    topPages,
    trafficSources,
  }
}

export async function getPropertyList(
  accessToken: string,
): Promise<{ id: string; name: string }[]> {
  const auth = await getAuthenticatedClient({
    accessToken,
    refreshToken: null,
    expiresAt: null,
  })

  const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth })
  const accountSummaries = await analyticsAdmin.accountSummaries.list({
    pageSize: 200,
  })

  const properties: { id: string; name: string }[] = []

  for (const account of accountSummaries.data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      if (prop.property && prop.displayName) {
        // prop.property is like "properties/123456789"
        const id = prop.property.replace('properties/', '')
        properties.push({ id, name: prop.displayName })
      }
    }
  }

  return properties
}
