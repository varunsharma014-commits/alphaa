import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exchangeCodeForTokens } from '@/lib/google'

export const dynamic = 'force-dynamic'

type ReturnTo = 'onboarding' | 'integrations'

function buildRedirect(returnTo: ReturnTo, params: Record<string, string>) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const url = new URL(
    returnTo === 'onboarding' ? '/onboarding' : '/dashboard/settings/integrations',
    base,
  )
  if (returnTo === 'onboarding') url.searchParams.set('step', '3')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url.toString()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Try to recover returnTo from state even on error paths so the user lands
  // back where they started. Defaults to the settings integrations page.
  let returnTo: ReturnTo = 'integrations'
  let clerkId: string | null = null
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString()) as {
        userId: string
        nonce: string
        returnTo?: string
      }
      clerkId = parsed.userId
      if (parsed.returnTo === 'onboarding') returnTo = 'onboarding'
    } catch {
      // invalid state — handled below
    }
  }

  if (error) {
    console.error('[Google Callback] OAuth error from Google:', error)
    return NextResponse.redirect(
      buildRedirect(returnTo, { error: encodeURIComponent(error) }),
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(buildRedirect(returnTo, { error: 'missing_params' }))
  }

  if (!clerkId) {
    return NextResponse.redirect(buildRedirect(returnTo, { error: 'invalid_state' }))
  }

  try {
    const { accessToken, refreshToken, expiresAt } =
      await exchangeCodeForTokens(code)

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.redirect(
        buildRedirect(returnTo, { error: 'user_not_found' }),
      )
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

    return NextResponse.redirect(buildRedirect(returnTo, { connected: 'true' }))
  } catch (err) {
    console.error('[Google Callback] Token exchange / DB error:', err)
    return NextResponse.redirect(
      buildRedirect(returnTo, { error: 'token_exchange_failed' }),
    )
  }
}
