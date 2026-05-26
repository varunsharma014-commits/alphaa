import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/business.manage',
  'openid',
  'email',
]

function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
  )
}

export function getGoogleAuthUrl(state: string): string {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  })
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string
  refreshToken: string | null
  expiresAt: Date
}> {
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)

  if (!tokens.access_token) {
    throw new Error('No access token returned from Google')
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000)

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: Date
}> {
  const client = createOAuth2Client()
  client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error('Failed to refresh Google access token')
  }

  const expiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 3600 * 1000)

  return {
    accessToken: credentials.access_token,
    expiresAt,
  }
}

export interface StoredIntegration {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}

export async function getAuthenticatedClient(
  integration: StoredIntegration,
): Promise<OAuth2Client> {
  const client = createOAuth2Client()

  const isExpired =
    !integration.expiresAt ||
    integration.expiresAt.getTime() < Date.now() + 60_000

  if (isExpired && integration.refreshToken) {
    const { accessToken, expiresAt } = await refreshAccessToken(
      integration.refreshToken,
    )
    client.setCredentials({
      access_token: accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: expiresAt.getTime(),
    })
  } else {
    client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken ?? undefined,
      expiry_date: integration.expiresAt?.getTime(),
    })
  }

  return client
}
