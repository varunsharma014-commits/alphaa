import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

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
      select: {
        lastSyncedAt: true,
        gaPropertyId: true,
        gscSiteUrl: true,
        gmbLocationId: true,
        gmbLocationName: true,
      },
    })

    if (!integration) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      lastSyncedAt: integration.lastSyncedAt,
      gaPropertyId: integration.gaPropertyId,
      gscSiteUrl: integration.gscSiteUrl,
      gmbLocationId: integration.gmbLocationId,
      gmbLocationName: integration.gmbLocationName,
    })
  } catch (err) {
    console.error('[Google Status] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 },
    )
  }
}
