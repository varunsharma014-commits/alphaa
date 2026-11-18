// "Connect Google Ads": a separate Google sign-in that asks only for the Google Ads scope
// (incremental auth). The adwords scope is on the consent screen but not verified by Google
// yet, so it's offered only when GOOGLE_ADS_ENABLED=1 or to founders: normal customers never
// see Google's "unverified app" screen. The main Google connect (lib/google.ts) is untouched.
import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { isComped } from "@/lib/billing"

export const ADWORDS_SCOPE = "https://www.googleapis.com/auth/adwords"
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
// Never built from req.url: on Railway that's localhost:8080.
export const gadsRedirectUri = () => `${APP()}/api/gads/callback`

/** The Google OAuth client exists (same client as the main Google connect). */
export const gadsConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
/** Everyone, once Google verifies the scope (GOOGLE_ADS_ENABLED=1); until then founders only. */
export const gadsAllowed = (email: string | null | undefined) => process.env.GOOGLE_ADS_ENABLED === "1" || isComped(email)
export const gadsAvailable = (u: { email: string | null }) => gadsConfigured() && gadsAllowed(u.email)

const secret = () => process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"
type State = { u: string; p: "gads"; n: string; t: number }

export function signGadsState(userId: string): string {
  const body = Buffer.from(JSON.stringify({ u: userId, p: "gads", n: randomBytes(8).toString("hex"), t: Date.now() } satisfies State)).toString("base64url")
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`
}

/** The state if it's ours, untampered and under 60 minutes old. The caller checks it's the signed-in brand. */
export function readGadsState(raw: string | null): State | null {
  if (!raw) return null
  const [body, sig] = raw.split(".")
  if (!body || !sig) return null
  const want = createHmac("sha256", secret()).update(body).digest("base64url")
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as State
    if (s.p !== "gads" || Date.now() - s.t > 60 * 60_000) return null
    return s
  } catch {
    return null
  }
}

export function gadsAuthUrl(state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: gadsRedirectUri(),
    response_type: "code",
    scope: ADWORDS_SCOPE,
    access_type: "offline",
    prompt: "consent", // always returns a refresh token
    include_granted_scopes: "true",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string }

async function token(params: Record<string, string>): Promise<TokenResponse> {
  const go = () => fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", ...params }),
    signal: AbortSignal.timeout(20_000),
  })
  const r = await go().catch(() => go()).catch((err: unknown) => {
    const cause = err instanceof Error && err.cause instanceof Error ? `: ${err.cause.message}` : ""
    throw new Error(`Couldn’t reach Google sign-in${cause}`)
  })
  const data = (await r.json().catch(() => ({}))) as TokenResponse
  if (!r.ok || !data.access_token) {
    const e = new Error((data.error_description ?? data.error ?? `Google answered HTTP ${r.status}`).slice(0, 200)) as Error & { code?: string }
    e.code = data.error
    throw e
  }
  return data
}

export async function exchangeGadsCode(code: string) {
  const t = await token({ code, grant_type: "authorization_code", redirect_uri: gadsRedirectUri() })
  return { accessToken: t.access_token!, refreshToken: t.refresh_token ?? null, expiresAt: Date.now() + (t.expires_in ?? 3600) * 1000, scope: t.scope ?? "" }
}

export async function refreshGadsToken(refreshToken: string) {
  const t = await token({ refresh_token: refreshToken, grant_type: "refresh_token" })
  return { accessToken: t.access_token!, expiresAt: Date.now() + (t.expires_in ?? 3600) * 1000 }
}
