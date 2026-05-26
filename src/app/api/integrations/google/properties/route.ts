import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getPropertyList } from '@/lib/ga'
import { getSiteList } from '@/lib/gsc'
import { getLocationList } from '@/lib/gmb'
import { getAuthenticatedClient } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const integration = await db.integration.findUnique({
      where: { userId: user.id },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Google not connected' },
        { status: 400 },
      )
    }

    // Resolve a fresh access token once, then pass it to each list function
    const oauthClient = await getAuthenticatedClient({
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt,
    })
    const tokenRes = await oauthClient.getAccessToken()
    const accessToken = tokenRes.token ?? integration.accessToken

    const [gaProperties, gscSites, gmbLocations] = await Promise.allSettled([
      getPropertyList(accessToken),
      getSiteList(accessToken),
      getLocationList(accessToken),
    ])

    return NextResponse.json({
      gaProperties:
        gaProperties.status === 'fulfilled' ? gaProperties.value : [],
      gscSites: gscSites.status === 'fulfilled' ? gscSites.value : [],
      gmbLocations:
        gmbLocations.status === 'fulfilled' ? gmbLocations.value : [],
      errors: {
        gaProperties:
          gaProperties.status === 'rejected'
            ? (gaProperties.reason as Error).message
            : null,
        gscSites:
          gscSites.status === 'rejected'
            ? (gscSites.reason as Error).message
            : null,
        gmbLocations:
          gmbLocations.status === 'rejected'
            ? (gmbLocations.reason as Error).message
            : null,
      },
    })
  } catch (err) {
    console.error('[Google Properties] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch Google properties' },
      { status: 500 },
    )
  }
}
