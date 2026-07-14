import { getAuthenticatedClient, StoredIntegration } from './google'

export interface GmbLocation {
  accountId: string
  locationId: string
  locationName: string
  address: string
}

export interface GmbReviewData {
  reviewId: string
  authorName: string
  rating: number
  comment: string | null
  reply: string | null
  publishedAt: Date
}

export interface LocationInfo {
  name: string
  address: string
  phone: string | null
  website: string | null
  categories: string[]
}

const ACCOUNT_MANAGEMENT_BASE =
  'https://mybusinessaccountmanagement.googleapis.com/v1'
const BUSINESS_BASE = 'https://mybusiness.googleapis.com/v4'

async function gmbFetch<T>(
  accessToken: string,
  url: string,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `GMB API error ${response.status} for ${url}: ${errorBody}`,
    )
  }

  return response.json() as Promise<T>
}

async function resolveAccessToken(
  integration: StoredIntegration,
): Promise<string> {
  const client = await getAuthenticatedClient(integration)
  const tokenInfo = await client.getAccessToken()
  if (!tokenInfo.token) {
    throw new Error('Failed to obtain a valid access token for GMB')
  }
  return tokenInfo.token
}

export async function getLocationList(
  accessToken: string,
): Promise<GmbLocation[]> {
  try {
    const accountsRes = await gmbFetch<{
      accounts?: Array<{ name: string; accountName: string; type: string }>
    }>(accessToken, `${ACCOUNT_MANAGEMENT_BASE}/accounts`)

    const accounts = accountsRes.accounts ?? []
    const locations: GmbLocation[] = []

    for (const account of accounts) {
      // account.name is like "accounts/123456"
      const accountId = account.name.replace('accounts/', '')

      let pageToken: string | undefined

      do {
        const query = pageToken
          ? `?pageToken=${encodeURIComponent(pageToken)}`
          : ''

        const locRes = await gmbFetch<{
          locations?: Array<{
            name: string
            title: string
            storefrontAddress?: {
              addressLines?: string[]
              locality?: string
              administrativeArea?: string
              postalCode?: string
            }
          }>
          nextPageToken?: string
        }>(
          accessToken,
          `${ACCOUNT_MANAGEMENT_BASE}/accounts/${accountId}/locations${query}`,
        )

        for (const loc of locRes.locations ?? []) {
          const locationId = loc.name.split('/').pop() ?? loc.name
          const addr = loc.storefrontAddress
          const addressParts = [
            ...(addr?.addressLines ?? []),
            addr?.locality,
            addr?.administrativeArea,
            addr?.postalCode,
          ].filter(Boolean)

          locations.push({
            accountId,
            locationId,
            locationName: loc.title,
            address: addressParts.join(', '),
          })
        }

        pageToken = locRes.nextPageToken
      } while (pageToken)
    }

    return locations
  } catch (err) {
    // GMB API requires special enablement — surface a clear message but don't crash
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.includes('403') ||
      message.includes('disabled') ||
      message.includes('not enabled')
    ) {
      console.warn(
        '[GMB] Business Profile API is not enabled for this project:',
        message,
      )
      return []
    }
    console.error('[GMB] getLocationList error:', message)
    return []
  }
}

export async function getReviews(
  integration: StoredIntegration & {
    gmbAccountId?: string | null
    gmbLocationId?: string | null
  },
): Promise<GmbReviewData[]> {
  if (!integration.gmbAccountId || !integration.gmbLocationId) {
    return []
  }

  try {
    const accessToken = await resolveAccessToken(integration)

    const reviewsRes = await gmbFetch<{
      reviews?: Array<{
        reviewId: string
        reviewer?: { displayName?: string }
        starRating?: string
        comment?: string
        reviewReply?: { comment?: string }
        createTime?: string
      }>
    }>(
      accessToken,
      `${BUSINESS_BASE}/accounts/${integration.gmbAccountId}/locations/${integration.gmbLocationId}/reviews`,
    )

    const starRatingMap: Record<string, number> = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
      FIVE: 5,
    }

    return (reviewsRes.reviews ?? []).map((r) => ({
      reviewId: r.reviewId,
      authorName: r.reviewer?.displayName ?? 'Anonymous',
      rating: starRatingMap[r.starRating ?? ''] ?? 0,
      comment: r.comment ?? null,
      reply: r.reviewReply?.comment ?? null,
      publishedAt: r.createTime ? new Date(r.createTime) : new Date(),
    }))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[GMB] getReviews error:', message)
    return []
  }
}

// Posts (or updates) the owner's reply on a Google review.
// GMB v4: PUT accounts/{account}/locations/{location}/reviews/{reviewId}/reply
export async function postReviewReply(
  integration: StoredIntegration & {
    gmbAccountId?: string | null
    gmbLocationId?: string | null
  },
  reviewId: string,
  comment: string,
): Promise<{ success: boolean; error?: string }> {
  if (!integration.gmbAccountId || !integration.gmbLocationId) {
    return {
      success: false,
      error: 'Google Business Profile location is not configured',
    }
  }

  try {
    const accessToken = await resolveAccessToken(integration)
    const url = `${BUSINESS_BASE}/accounts/${integration.gmbAccountId}/locations/${integration.gmbLocationId}/reviews/${reviewId}/reply`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[GMB] postReviewReply error:', response.status, errorBody)
      return { success: false, error: `GMB API error ${response.status}` }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[GMB] postReviewReply unexpected error:', message)
    return { success: false, error: message }
  }
}

export async function getLocationInfo(
  integration: StoredIntegration & {
    gmbAccountId?: string | null
    gmbLocationId?: string | null
  },
): Promise<LocationInfo | null> {
  if (!integration.gmbAccountId || !integration.gmbLocationId) {
    return null
  }

  try {
    const accessToken = await resolveAccessToken(integration)

    const loc = await gmbFetch<{
      title?: string
      storefrontAddress?: {
        addressLines?: string[]
        locality?: string
        administrativeArea?: string
        postalCode?: string
      }
      phoneNumbers?: { primaryPhone?: string }
      websiteUri?: string
      categories?: {
        primaryCategory?: { displayName?: string }
        additionalCategories?: Array<{ displayName?: string }>
      }
    }>(
      accessToken,
      `${BUSINESS_BASE}/accounts/${integration.gmbAccountId}/locations/${integration.gmbLocationId}`,
    )

    const addr = loc.storefrontAddress
    const addressParts = [
      ...(addr?.addressLines ?? []),
      addr?.locality,
      addr?.administrativeArea,
      addr?.postalCode,
    ].filter(Boolean)

    const categories: string[] = []
    if (loc.categories?.primaryCategory?.displayName) {
      categories.push(loc.categories.primaryCategory.displayName)
    }
    for (const cat of loc.categories?.additionalCategories ?? []) {
      if (cat.displayName) categories.push(cat.displayName)
    }

    return {
      name: loc.title ?? '',
      address: addressParts.join(', '),
      phone: loc.phoneNumbers?.primaryPhone ?? null,
      website: loc.websiteUri ?? null,
      categories,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[GMB] getLocationInfo error:', message)
    return null
  }
}
