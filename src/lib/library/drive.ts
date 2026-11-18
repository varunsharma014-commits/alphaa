// Google Drive for the brand library. Scope drive.file ONLY (non-sensitive): we can read just
// the files the owner picks in the Google Picker (the Picker's appId = our Cloud project number
// grants them to our app). A separate Google grant from the Search Console / Business Profile
// one, so that grant's scopes never change. The refresh token is kept encrypted in a
// MockActivity "drive_account" row; access tokens are minted from it when needed.
import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"
const TYPE = "drive_account"
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
export const driveRedirectUri = () => `${APP()}/api/library/drive/callback`
const secret = () => process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"

/** Hidden until the Picker's browser key exists (and the Google OAuth client, which we already have). */
export const driveConfigured = () => !!(process.env.GOOGLE_PICKER_API_KEY && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
export const pickerConfig = () => ({ apiKey: process.env.GOOGLE_PICKER_API_KEY ?? "", appId: process.env.GOOGLE_CLOUD_PROJECT_NUMBER || "501685903093" })

// ── OAuth (server code flow) ────────────────────────────────────────────────
type State = { u: string; n: string; t: number }
export function signDriveState(userId: string): string {
  const body = Buffer.from(JSON.stringify({ u: userId, n: randomBytes(8).toString("hex"), t: Date.now() } satisfies State)).toString("base64url")
  return `${body}.${createHmac("sha256", secret()).update(`drive:${body}`).digest("base64url")}`
}
export function readDriveState(raw: string | null): State | null {
  const [body, sig] = (raw ?? "").split(".")
  if (!body || !sig) return null
  const want = createHmac("sha256", secret()).update(`drive:${body}`).digest("base64url")
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as State
    return Date.now() - s.t > 60 * 60_000 ? null : s
  } catch {
    return null
  }
}

export function driveAuthUrl(state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: driveRedirectUri(),
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    // Off on purpose (same reason as lib/google.ts): folding in older grants can bring back an
    // unverified scope and Google's "unverified app" screen. This grant is drive.file alone.
    include_granted_scopes: "false",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
}

export type DriveAccount = { id: string; refreshEnc: string; scope: string; connectedAt: string; status?: "active" | "expired" }

export async function getDriveAccount(userId: string): Promise<DriveAccount | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: TYPE }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<DriveAccount, "id">), id: r.id } : null
}

export async function removeDriveAccount(userId: string): Promise<void> {
  const a = await getDriveAccount(userId)
  await db.mockActivity.deleteMany({ where: { userId, type: TYPE } })
  tokens.delete(userId)
  // Tell Google too, so the grant disappears from the owner's Google account.
  if (a) {
    try { await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decryptSecret(a.refreshEnc))}`, { method: "POST", signal: AbortSignal.timeout(10_000) }) } catch { /* already gone */ }
  }
}

/** Exchange the code and keep the refresh token (encrypted). Throws an owner-readable message. */
export async function connectDrive(userId: string, code: string): Promise<void> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: driveRedirectUri(), grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(20_000),
  })
  const t = (await r.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error_description?: string }
  if (!r.ok || !t.access_token) throw new Error(t.error_description || "Google didn’t accept the connection.")
  if (!(t.scope ?? "").split(/\s+/).includes(DRIVE_SCOPE)) throw new Error("Google didn’t give access to the files you pick. Tick the box when Google asks.")
  const existing = await getDriveAccount(userId)
  const refresh = t.refresh_token ?? (existing ? decryptSecret(existing.refreshEnc) : null)
  if (!refresh) throw new Error("Google didn’t send a long-lasting key. Try again.")
  const meta = { refreshEnc: encryptSecret(refresh), scope: t.scope ?? DRIVE_SCOPE, connectedAt: new Date().toISOString(), status: "active" as const }
  if (existing) await db.mockActivity.update({ where: { id: existing.id }, data: { metadata: meta } })
  else await db.mockActivity.create({ data: { userId, type: TYPE, title: "Connected Google Drive (only the files you pick)", metadata: meta } })
  tokens.set(userId, { token: t.access_token, exp: Date.now() + (t.expires_in ?? 3600) * 1000 })
}

const tokens = new Map<string, { token: string; exp: number }>()

/** A fresh access token (drive.file). Null when not connected or the owner removed access. */
export async function driveAccessToken(userId: string): Promise<{ token: string; expiresIn: number } | null> {
  const c = tokens.get(userId)
  if (c && c.exp - Date.now() > 120_000) return { token: c.token, expiresIn: Math.floor((c.exp - Date.now()) / 1000) }
  const a = await getDriveAccount(userId)
  if (!a || a.status === "expired") return null
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, refresh_token: decryptSecret(a.refreshEnc), grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(20_000),
  })
  const t = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string }
  if (!r.ok || !t.access_token) {
    if (t.error === "invalid_grant") await db.mockActivity.update({ where: { id: a.id }, data: { metadata: { ...a, id: undefined, status: "expired" } as object } })
    console.error("[drive] refresh", r.status, t.error ?? "")
    return null
  }
  const exp = Date.now() + (t.expires_in ?? 3600) * 1000
  tokens.set(userId, { token: t.access_token, exp })
  return { token: t.access_token, expiresIn: t.expires_in ?? 3600 }
}

// ── Files ───────────────────────────────────────────────────────────────────
export type DriveFile = {
  id: string
  name: string
  mimeType: string
  size?: string
  trashed?: boolean
  thumbnailLink?: string
  imageMediaMetadata?: { width?: number; height?: number }
  videoMediaMetadata?: { width?: number; height?: number; durationMillis?: string }
}
const API = "https://www.googleapis.com/drive/v3/files"
const keyHeader = (resourceKey?: string | null, id?: string): Record<string, string> => (resourceKey && id ? { "X-Goog-Drive-Resource-Keys": `${id}/${resourceKey}` } : {})

export class MissingFile extends Error {}

/** Metadata for one picked file. Throws MissingFile when it's gone or access was removed. */
export async function driveFile(userId: string, id: string, resourceKey?: string | null): Promise<DriveFile> {
  const t = await driveAccessToken(userId)
  if (!t) throw new MissingFile("Google Drive isn’t connected any more.")
  const fields = "id,name,mimeType,size,trashed,thumbnailLink,imageMediaMetadata(width,height),videoMediaMetadata(width,height,durationMillis)"
  const r = await fetch(`${API}/${encodeURIComponent(id)}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${t.token}`, ...keyHeader(resourceKey, id) }, signal: AbortSignal.timeout(20_000) })
  if (r.status === 404 || r.status === 403 || r.status === 401) throw new MissingFile("I can’t open this file in your Google Drive any more (moved, deleted or access removed).")
  if (!r.ok) throw new Error(`Google Drive said ${r.status}`)
  const f = (await r.json()) as DriveFile
  if (f.trashed) throw new MissingFile("This file is in your Google Drive trash.")
  return f
}

/** The file's bytes as a stream response (Range passed through). Never stored. */
export async function driveMedia(userId: string, id: string, o: { resourceKey?: string | null; range?: string | null; method?: "GET" | "HEAD" } = {}): Promise<Response> {
  const t = await driveAccessToken(userId)
  if (!t) throw new MissingFile("Google Drive isn’t connected any more.")
  const r = await fetch(`${API}/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`, {
    method: o.method ?? "GET",
    headers: { Authorization: `Bearer ${t.token}`, ...keyHeader(o.resourceKey, id), ...(o.range ? { Range: o.range } : {}) },
    signal: AbortSignal.timeout(o.range || o.method === "HEAD" ? 60_000 : 120_000),
  })
  if (r.status === 404 || r.status === 403 || r.status === 401) throw new MissingFile("I can’t open this file in your Google Drive any more (moved, deleted or access removed).")
  return r
}

/** Drive's own preview picture (works for videos and PDFs too). Null when Drive has none. */
export async function driveThumb(userId: string, f: DriveFile): Promise<Buffer | null> {
  if (!f.thumbnailLink) return null
  const url = f.thumbnailLink.replace(/=s\d+$/, "=s800")
  for (const auth of [false, true]) {
    try {
      const t = auth ? await driveAccessToken(userId) : null
      const r = await fetch(url, { headers: t ? { Authorization: `Bearer ${t.token}` } : {}, signal: AbortSignal.timeout(15_000) })
      if (r.ok && /^image\//.test(r.headers.get("content-type") ?? "")) return Buffer.from(await r.arrayBuffer())
    } catch { /* try the other way */ }
  }
  return null
}
