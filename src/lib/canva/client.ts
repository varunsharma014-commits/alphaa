// Canva Connect API: the owner connects their own Canva account (OAuth 2 + PKCE S256), then I
// can list their designs, export one as a JPG for a post, upload my image to their Canva so
// they can edit it there, and fill their brand template (Canva Pro/Teams/Enterprise) with a
// headline and photo. Hidden until CANVA_CLIENT_ID + CANVA_CLIENT_SECRET exist.
// Docs: https://www.canva.dev/docs/connect/ (checked 2026-11-18).
//   authorize  https://www.canva.com/api/oauth/authorize
//   token      POST https://api.canva.com/rest/v1/oauth/token (form, Basic client_id:secret)
//              refresh tokens are single use: every refresh returns a new one, always saved.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto"
import { enc, dec } from "@/lib/social/store"
import { getCanvaAccount, saveCanvaAccount, removeCanvaAccount, type CanvaAccount } from "./store"

const API = "https://api.canva.com/rest/v1"
const AUTH = "https://www.canva.com/api/oauth/authorize"
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
export const CANVA_REDIRECT = () => `${APP()}/api/canva/callback`
export const CANVA_PKCE_COOKIE = "alphaa_canva_pkce"
// Every scope must also be ticked in the Canva Developer Portal (Scopes tab).
export const CANVA_SCOPES = () => process.env.CANVA_SCOPES || "design:meta:read design:content:read design:content:write asset:read asset:write brandtemplate:meta:read brandtemplate:content:read profile:read"

export const canvaConfigured = () => !!(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET)

// ── OAuth ──────────────────────────────────────────────────────────────────────
const secret = () => process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"
export type CanvaBack = "voice" | "channels"
type State = { u: string; n: string; t: number; b: CanvaBack }

export function signCanvaState(userId: string, back: CanvaBack): string {
  const body = Buffer.from(JSON.stringify({ u: userId, n: randomBytes(8).toString("hex"), t: Date.now(), b: back } satisfies State)).toString("base64url")
  return `${body}.${createHmac("sha256", secret()).update(`canva:${body}`).digest("base64url")}`
}
export function readCanvaState(raw: string | null): State | null {
  const [body, sig] = (raw ?? "").split(".")
  if (!body || !sig) return null
  const want = createHmac("sha256", secret()).update(`canva:${body}`).digest("base64url")
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as State
    return Date.now() - s.t > 60 * 60_000 ? null : s
  } catch {
    return null
  }
}
export function canvaPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url") // 64 chars (43-128 allowed)
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") }
}
export function canvaAuthUrl(state: string, challenge: string): string {
  const q = new URLSearchParams({ code_challenge: challenge, code_challenge_method: "S256", scope: CANVA_SCOPES(), response_type: "code", client_id: process.env.CANVA_CLIENT_ID!, state, redirect_uri: CANVA_REDIRECT() })
  return `${AUTH}?${q}`
}

type TokenRes = { access_token: string; refresh_token?: string; expires_in?: number; scope?: string }
async function tokenCall(form: Record<string, string>): Promise<TokenRes> {
  const basic = Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64")
  const r = await fetch(`${API}/oauth/token`, { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form), signal: AbortSignal.timeout(20_000) })
  const data = (await r.json().catch(() => ({}))) as TokenRes & { error?: string; error_description?: string; message?: string }
  if (!r.ok || !data.access_token) throw new Error(data.error_description ?? data.message ?? data.error ?? `Canva said ${r.status}`)
  return data
}

/** Code → tokens, saved encrypted on the owner's Canva row. */
export async function connectCanva(userId: string, code: string, verifier: string): Promise<CanvaAccount> {
  const t = await tokenCall({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: CANVA_REDIRECT() })
  await saveCanvaAccount(userId, {
    tokenEnc: enc(t.access_token),
    refreshEnc: t.refresh_token ? enc(t.refresh_token) : null,
    expiresAt: new Date(Date.now() + (t.expires_in ?? 14_400) * 1000).toISOString(),
    scope: t.scope ?? CANVA_SCOPES(),
    connectedAt: new Date().toISOString(),
  })
  // Name + brand-template access, best effort.
  const name = await canvaApi<{ profile?: { display_name?: string } }>(userId, "/users/me/profile").then((p) => p.profile?.display_name ?? null).catch(() => null)
  const templates = await hasBrandTemplates(userId)
  return saveCanvaAccount(userId, { name, templates })
}

/** Revoke (best effort) and forget the tokens. */
export async function disconnectCanva(userId: string): Promise<void> {
  const a = await getCanvaAccount(userId)
  if (!a) return
  const basic = Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64")
  if (a.refreshEnc) await fetch(`${API}/oauth/revoke`, { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token: dec(a.refreshEnc) }), signal: AbortSignal.timeout(10_000) }).catch(() => null)
  await removeCanvaAccount(userId)
}

// One refresh at a time per brand: a refresh token works once, so two at once would break it.
const refreshing = new Map<string, Promise<string>>()
async function accessToken(userId: string): Promise<string> {
  const a = await getCanvaAccount(userId)
  if (!a) throw new CanvaError("not_connected", "Connect your Canva account first.")
  if (a.expiresAt && Date.parse(a.expiresAt) > Date.now() + 60_000) return dec(a.tokenEnc)
  if (!a.refreshEnc) throw new CanvaError("expired", "Your Canva connection expired. Connect it again.")
  const inflight = refreshing.get(userId)
  if (inflight) return inflight
  const p = (async () => {
    try {
      const t = await tokenCall({ grant_type: "refresh_token", refresh_token: dec(a.refreshEnc!) })
      await saveCanvaAccount(userId, { tokenEnc: enc(t.access_token), refreshEnc: t.refresh_token ? enc(t.refresh_token) : null, expiresAt: new Date(Date.now() + (t.expires_in ?? 14_400) * 1000).toISOString(), status: "active" })
      return t.access_token
    } catch (err) {
      await saveCanvaAccount(userId, { status: "expired" })
      throw new CanvaError("expired", `Your Canva connection expired. Connect it again. (${err instanceof Error ? err.message : "refresh failed"})`)
    } finally {
      refreshing.delete(userId)
    }
  })()
  refreshing.set(userId, p)
  return p
}

export class CanvaError extends Error {
  constructor(public code: string, message: string, public status = 0) { super(message) }
}

/** Authenticated Canva call. Error messages are Canva's own, short. */
export async function canvaApi<T>(userId: string, path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = await accessToken(userId)
  const { json, ...rest } = init
  const r = await fetch(`${API}${path}`, {
    ...rest,
    headers: { Authorization: `Bearer ${token}`, ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    signal: rest.signal ?? AbortSignal.timeout(30_000),
  })
  const text = await r.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!r.ok) {
    const d = data as { code?: string; message?: string } | null
    throw new CanvaError(d?.code ?? String(r.status), String(d?.message ?? `Canva said ${r.status}`).slice(0, 240), r.status)
  }
  return data as T
}

async function poll<T>(fn: () => Promise<T>, done: (x: T) => boolean, ms = 60_000): Promise<T> {
  const until = Date.now() + ms
  let x = await fn()
  while (!done(x) && Date.now() < until) {
    await new Promise((r) => setTimeout(r, 1500))
    x = await fn()
  }
  return x
}

// ── Designs ────────────────────────────────────────────────────────────────────
export type CanvaDesign = { id: string; title: string; thumbnail: string | null; editUrl: string | null; updatedAt: number }
type RawDesign = { id: string; title?: string; thumbnail?: { url?: string }; urls?: { edit_url?: string; view_url?: string }; updated_at?: number }
const toDesign = (d: RawDesign): CanvaDesign => ({ id: d.id, title: (d.title || "Untitled design").slice(0, 80), thumbnail: d.thumbnail?.url ?? null, editUrl: d.urls?.edit_url ?? null, updatedAt: d.updated_at ?? 0 })

export async function listDesigns(userId: string, limit = 6): Promise<CanvaDesign[]> {
  const r = await canvaApi<{ items?: RawDesign[] }>(userId, `/designs?sort_by=modified_descending&ownership=any&limit=${limit}`)
  return (r.items ?? []).map(toDesign)
}
export async function getDesign(userId: string, id: string): Promise<CanvaDesign | null> {
  const r = await canvaApi<{ design?: RawDesign }>(userId, `/designs/${encodeURIComponent(id)}`).catch(() => null)
  return r?.design ? toDesign(r.design) : null
}

/** Export page 1 as a 1080-wide JPG and download it (the links last 24h, so we keep the bytes). */
export async function exportDesignJpeg(userId: string, designId: string): Promise<Buffer> {
  const start = await canvaApi<{ job: { id: string; status: string } }>(userId, "/exports", { method: "POST", json: { design_id: designId, format: { type: "jpg", quality: 90, width: 1080, pages: [1] } } })
  const job = await poll(() => canvaApi<{ job: { status: string; urls?: string[]; error?: { message?: string } } }>(userId, `/exports/${encodeURIComponent(start.job.id)}`).then((r) => r.job), (j) => j.status !== "in_progress", 90_000)
  if (job.status !== "success" || !job.urls?.[0]) throw new CanvaError("export_failed", job.error?.message ?? "Canva is still making the picture. Try again in a minute.")
  const r = await fetch(job.urls[0], { signal: AbortSignal.timeout(30_000) })
  if (!r.ok) throw new CanvaError("download_failed", "I couldn’t download it from Canva.")
  return Buffer.from(await r.arrayBuffer())
}

/** Upload a picture to the owner's Canva (their uploads). Returns the asset id. */
export async function uploadAsset(userId: string, bytes: Buffer, name: string): Promise<string> {
  const meta = JSON.stringify({ name_base64: Buffer.from(name.slice(0, 50) || "Alphaa image").toString("base64") })
  const start = await canvaApi<{ job: { id: string; status: string; asset?: { id: string } } }>(userId, "/asset-uploads", { method: "POST", headers: { "Content-Type": "application/octet-stream", "Asset-Upload-Metadata": meta }, body: new Uint8Array(bytes) })
  const job = start.job.status === "in_progress"
    ? await poll(() => canvaApi<{ job: { status: string; asset?: { id: string }; error?: { message?: string } } }>(userId, `/asset-uploads/${encodeURIComponent(start.job.id)}`).then((r) => r.job), (j) => j.status !== "in_progress")
    : start.job
  if (job.status !== "success" || !job.asset?.id) throw new CanvaError("upload_failed", (job as { error?: { message?: string } }).error?.message ?? "Canva didn’t take the picture.")
  return job.asset.id
}

/** A new design, the size of the post, with our picture on it. Returns its id and edit link. */
export async function designFromAsset(userId: string, assetId: string, title: string, size: { w: number; h: number }): Promise<CanvaDesign> {
  const r = await canvaApi<{ design: RawDesign }>(userId, "/designs", { method: "POST", json: { type: "type_and_asset", design_type: { type: "custom", width: size.w, height: size.h }, asset_id: assetId, title: title.slice(0, 255) || "Social post" } })
  return toDesign(r.design)
}

// ── Brand templates + autofill (Canva Pro / Teams / Enterprise) ─────────────────
export type BrandTemplate = { id: string; title: string; thumbnail: string | null; textField: string | null; imageField: string | null }

/** True when the account can see brand templates. Any error = no access (skip quietly). */
export async function hasBrandTemplates(userId: string): Promise<boolean> {
  try {
    await canvaApi(userId, "/brand-templates?limit=1")
    return true
  } catch {
    return false
  }
}

/** Templates I can fill: one text field (the headline) and, if there is one, an image field. */
export async function listBrandTemplates(userId: string, limit = 8): Promise<BrandTemplate[]> {
  const r = await canvaApi<{ items?: { id: string; title?: string; thumbnail?: { url?: string } }[] }>(userId, `/brand-templates?dataset=non_empty&sort_by=modified_descending&limit=${limit}`).catch(() => null)
  const out: BrandTemplate[] = []
  for (const t of r?.items ?? []) {
    const ds = await canvaApi<{ dataset?: Record<string, { type: string }> }>(userId, `/brand-templates/${encodeURIComponent(t.id)}/dataset`).catch(() => null)
    const fields = Object.entries(ds?.dataset ?? {})
    const pick = (type: string) => (fields.find(([k, v]) => v.type === type && /head|title|text|caption/i.test(k)) ?? fields.find(([, v]) => v.type === type))?.[0] ?? null
    const textField = pick("text")
    if (!textField) continue
    out.push({ id: t.id, title: (t.title || "Brand template").slice(0, 80), thumbnail: t.thumbnail?.url ?? null, textField, imageField: pick("image") })
  }
  return out
}

/** Fill the template with the headline (and a photo, uploaded first) and export it as a JPG. */
export async function autofillJpeg(userId: string, tpl: { id: string; textField: string; imageField?: string | null }, input: { headline: string; title: string; photo?: Buffer | null }): Promise<{ jpeg: Buffer; designId: string }> {
  const data: Record<string, unknown> = { [tpl.textField]: { type: "text", text: input.headline } }
  if (tpl.imageField && input.photo) data[tpl.imageField] = { type: "image", asset_id: await uploadAsset(userId, input.photo, input.title) }
  const start = await canvaApi<{ job: { id: string } }>(userId, "/autofills", { method: "POST", json: { brand_template_id: tpl.id, data, title: input.title.slice(0, 255) } })
  const job = await poll(() => canvaApi<{ job: { status: string; result?: { design?: { id: string } }; error?: { message?: string } } }>(userId, `/autofills/${encodeURIComponent(start.job.id)}`).then((r) => r.job), (j) => j.status !== "in_progress", 90_000)
  const designId = job.result?.design?.id
  if (job.status !== "success" || !designId) throw new CanvaError("autofill_failed", job.error?.message ?? "Canva couldn’t fill the template.")
  return { jpeg: await exportDesignJpeg(userId, designId), designId }
}
