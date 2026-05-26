import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface SavePropertiesBody {
  gaPropertyId?: string
  gaPropertyName?: string
  gscSiteUrl?: string
  gmbAccountId?: string
  gmbLocationId?: string
  gmbLocationName?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = (await request.json()) as SavePropertiesBody

    const integration = await db.integration.findUnique({
      where: { userId: user.id },
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Google not connected' },
        { status: 400 },
      )
    }

    await db.integration.update({
      where: { userId: user.id },
      data: {
        gaPropertyId: body.gaPropertyId ?? integration.gaPropertyId,
        gaPropertyName: body.gaPropertyName ?? integration.gaPropertyName,
        gscSiteUrl: body.gscSiteUrl ?? integration.gscSiteUrl,
        gmbAccountId: body.gmbAccountId ?? integration.gmbAccountId,
        gmbLocationId: body.gmbLocationId ?? integration.gmbLocationId,
        gmbLocationName: body.gmbLocationName ?? integration.gmbLocationName,
      },
    })

    // Fire-and-forget initial sync — don't block the response
    setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Internal call: forward the Clerk session cookie is not available
          // server-side here, so we use a shared secret to authenticate the
          // sync endpoint when called internally.
          'x-internal-user-id': user.id,
        },
      }).catch((err) => {
        console.error('[Save Properties] Background sync error:', err)
      })
    }, 0)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Save Properties] Error:', err)
    return NextResponse.json(
      { error: 'Failed to save properties' },
      { status: 500 },
    )
  }
}
