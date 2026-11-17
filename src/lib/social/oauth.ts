// Signed OAuth state (who is connecting, which provider, when) and PKCE for X.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto"
import type { ConnectProvider } from "./types"

const secret = () => process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
export const redirectUri = (p: ConnectProvider) => `${APP()}/api/social/callback/${p}`
export const PKCE_COOKIE = "alphaa_pkce"

type State = { u: string; p: ConnectProvider; n: string; t: number }

export function signState(userId: string, p: ConnectProvider): string {
  const body = Buffer.from(JSON.stringify({ u: userId, p, n: randomBytes(8).toString("hex"), t: Date.now() } satisfies State)).toString("base64url")
  const sig = createHmac("sha256", secret()).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function readState(raw: string | null, p: ConnectProvider): State | null {
  if (!raw) return null
  const [body, sig] = raw.split(".")
  if (!body || !sig) return null
  const want = createHmac("sha256", secret()).update(body).digest("base64url")
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as State
    if (s.p !== p || Date.now() - s.t > 20 * 60_000) return null
    return s
  } catch {
    return null
  }
}

export function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url")
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") }
}

/** fetch + JSON with a readable error (platform messages pass through to the owner). */
export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(30_000) })
  const text = await r.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!r.ok) {
    const d = data as { error?: { message?: string } | string; message?: string; error_description?: string; detail?: string } | null
    const msg = (typeof d?.error === "object" ? d?.error?.message : d?.error_description ?? d?.detail ?? d?.message ?? (typeof d?.error === "string" ? d.error : null)) ?? `HTTP ${r.status}`
    throw new Error(String(msg).slice(0, 300))
  }
  return data as T
}
