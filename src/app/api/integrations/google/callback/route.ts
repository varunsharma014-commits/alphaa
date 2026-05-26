import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exchangeCodeForTokens } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const redirectBase = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations`

  if (error) {
    console.error('[Google Callback] OAuth error from Google:', error)
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?error=missing_params`)
  }

  let clerkId: string
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString()) as {
      userId: string
      nonce: string
    }
    clerkId = parsed.userId
  } catch {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`)
  }

  try {
    const { accessToken, refreshToken, expiresAt } =
      await exchangeCodeForTokens(code)

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.redirect(`${redirectBase}?error=user_not_found`)
    }

    await db.integration.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        accessToken,
        refreshToken,
        expiresAt,
        connectedAt: new Date(),
      },
      update: {
        accessToken,
        refreshToken: refreshToken ?? undefined,
        expiresAt,
        connectedAt: new Date(),
        // Reset property selections on reconnect so user picks fresh
        gaPropertyId: null,
        gaPropertyName: null,
        gscSiteUrl: null,
        gmbAccountId: null,
        gmbLocationId: null,
        gmbLocationName: null,
        lastSyncedAt: null,
      },
    })

    return NextResponse.redirect(`${redirectBase}?connected=true`)
  } catch (err) {
    console.error('[Google Callback] Token exchange / DB error:', err)
    return NextResponse.redirect(`${redirectBase}?error=token_exchange_failed`)
  }
}
