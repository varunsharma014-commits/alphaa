import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getGoogleAuthUrl } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const state = Buffer.from(
      JSON.stringify({ userId: clerkId, nonce: crypto.randomUUID() }),
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
