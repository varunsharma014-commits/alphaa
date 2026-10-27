import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import { gaScopeAllowed, getGoogleAuthUrl } from '@/lib/google'

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

    const wantsGa = request.nextUrl.searchParams.get('analytics') === '1'
    const email = wantsGa ? (await currentUser())?.primaryEmailAddress?.emailAddress : null
    const authUrl = getGoogleAuthUrl(state, { analytics: wantsGa && gaScopeAllowed(email) })

    // Agent chips navigate here directly (?go=1) rather than fetching JSON.
    if (request.nextUrl.searchParams.get('go') === '1') return NextResponse.redirect(authUrl)

    return NextResponse.json({ authUrl })
  } catch (err) {
    console.error('[Google Connect] Error generating auth URL:', err)
    return NextResponse.json(
      { error: 'Failed to generate Google auth URL' },
      { status: 500 },
    )
  }
}
