import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getGoogleAuthUrl } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Whitelisted return destination — where the callback should send the user
    // after OAuth completes. Defaults to the settings integrations page.
    const returnToParam = request.nextUrl.searchParams.get('returnTo')
    const returnTo: 'onboarding' | 'integrations' =
      returnToParam === 'onboarding' ? 'onboarding' : 'integrations'

    const state = Buffer.from(
      JSON.stringify({ userId: clerkId, nonce: crypto.randomUUID(), returnTo }),
    ).toString('base64url')

    const authUrl = getGoogleAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (err) {
    console.error('[Google Connect] Error generating auth URL:', err)
    return NextResponse.json(
      { error: 'Failed to generate Google auth URL' },
      { status: 500 },
    )
  }
}
