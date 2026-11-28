// Instagram data through Meta's own Graph API, used ONLY when the brand has a connected Instagram
// account whose token has the permissions for that call (checked with debug_token, cached 6h):
//
//   Business Discovery   another Business/Creator account's followers, media count and recent posts'
//                        like / comment / view counts. Needs instagram_basic +
//                        instagram_manage_insights + pages_read_engagement (Meta App Review round 2,
//                        docs/meta-app-review-submission.md "Round 2 additions").
//   Hashtag search       ig_hashtag_search + top_media for the niche hashtags. Needs instagram_basic +
//                        pages_read_engagement AND the "Instagram Public Content Access" feature,
//                        which a token can't show, so it also waits for META_HASHTAG_SEARCH=1 (set it
//                        once Meta approves). Meta allows 30 unique hashtags per IG account per 7 days:
//                        counted in agent settings `igHashtags`, ids reused (they're global).
//   Own posts            the owner's own recent Instagram posts (instagram_basic, round 1).
//
// Other accounts' captions and images are never requested or stored: counts, links, type, date.
// Nothing here throws; every call returns null / [] on failure.
import { createHash } from "crypto"
import { listAccounts, dec } from "@/lib/social/store"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"

const G = "https://graph.facebook.com/v27.0"
const DAY = 86_400_000
export const HASHTAG_CAP = 30
export const HASHTAG_WINDOW_MS = 7 * DAY

export const DISCOVERY_SCOPES = ["instagram_basic", "instagram_manage_insights", "pages_read_engagement"]
export const HASHTAG_SCOPES = ["instagram_basic", "pages_read_engagement"]
export const OWN_MEDIA_SCOPES = ["instagram_basic"]

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null)

// ── Pure parts (scripts/test-dataforseo.ts tests them) ──────────────────────────────────────────

/** Granted scopes from a debug_token answer ({ data: { is_valid, scopes } }). Empty when invalid. */
export function scopesOf(debug: unknown): string[] {
  const d = isObj(debug) && isObj(debug.data) ? debug.data : null
  if (!d || d.is_valid === false) return []
  return Array.isArray(d.scopes) ? d.scopes.filter((s): s is string => typeof s === "string") : []
}
export const hasAll = (scopes: string[], need: string[]) => need.every((s) => scopes.includes(s))

export type IgMedia = { url: string; type: string | null; product: string | null; likes: number | null; comments: number | null; views: number | null; postedAt: string | null }
export type IgDiscovery = { username: string; name: string | null; bio: string | null; website: string | null; followers: number | null; mediaCount: number | null; media: IgMedia[] }

function media(m: unknown): IgMedia | null {
  if (!isObj(m)) return null
  const url = str(m.permalink)
  if (!url || !/^https:\/\/(www\.)?instagram\.com\//.test(url)) return null
  return { url, type: str(m.media_type), product: str(m.media_product_type), likes: num(m.like_count), comments: num(m.comments_count), views: num(m.view_count), postedAt: str(m.timestamp) }
}

/** The business_discovery part of GET /{ig-user-id}?fields=business_discovery.username(x){…}. */
export function parseDiscovery(j: unknown): IgDiscovery | null {
  const b = isObj(j) && isObj(j.business_discovery) ? j.business_discovery : null
  if (!b) return null
  const username = str(b.username)
  if (!username) return null
  const list = isObj(b.media) && Array.isArray(b.media.data) ? b.media.data : []
  return {
    username, name: str(b.name), bio: str(b.biography), website: str(b.website),
    followers: num(b.followers_count), mediaCount: num(b.media_count),
    media: list.map(media).filter((x): x is IgMedia => !!x),
  }
}

/** A media list ({ data: [...] }): hashtag top_media or an account's own /media. */
export function parseMediaList(j: unknown): IgMedia[] {
  const list = isObj(j) && Array.isArray(j.data) ? j.data : []
  return list.map(media).filter((x): x is IgMedia => !!x)
}

export type HashtagLog = { tag: string; id: string | null; at: string }[]

/**
 * Can this IG account look up `tag` now? A tag already looked up in the last 7 days reuses its id
 * and doesn't count again; a new one needs fewer than 30 unique tags in the window.
 */
export function hashtagRoom(log: HashtagLog, tag: string, now = Date.now()): { ok: boolean; id: string | null; isNew: boolean; used: number } {
  const recent = log.filter((x) => now - Date.parse(x.at) < HASHTAG_WINDOW_MS)
  const unique = new Set(recent.map((x) => x.tag))
  const hit = recent.find((x) => x.tag === tag)
  if (hit) return { ok: true, id: hit.id, isNew: false, used: unique.size }
  return { ok: unique.size < HASHTAG_CAP, id: null, isNew: true, used: unique.size }
}

// ── Access ──────────────────────────────────────────────────────────────────────────────────────

export type IgAccess = { igUserId: string; handle: string | null; token: string; scopes: string[] }
export type IgState = {
  /** none = no Instagram connected; pending = connected, but Meta hasn't granted what this needs; on = ready. */
  state: "none" | "pending" | "on"
  access: IgAccess | null
  can: { discovery: boolean; hashtags: boolean; ownMedia: boolean }
}

async function graph(path: string, params: Record<string, string>, token: string): Promise<unknown | null> {
  try {
    const r = await fetch(`${G}${path}?${new URLSearchParams({ ...params, access_token: token })}`, { signal: AbortSignal.timeout(15_000) })
    const j = (await r.json().catch(() => null)) as { error?: { code?: number; message?: string } } | null
    if (!r.ok || !j || j.error) {
      // Never log the URL: it carries the token.
      console.error(`[meta-insights] ${path.split("?")[0].replace(/\/\d+/g, "/:id")} ${r.status} ${j?.error?.code ?? ""} ${j?.error?.message?.slice(0, 120) ?? ""}`)
      return null
    }
    return j
  } catch (err) {
    console.error("[meta-insights]", err instanceof Error ? err.message : "failed")
    return null
  }
}

const scopeCache = new Map<string, { at: number; scopes: string[] }>()
async function grantedScopes(token: string): Promise<string[]> {
  const key = createHash("sha256").update(token).digest("hex").slice(0, 16)
  const hit = scopeCache.get(key)
  if (hit && Date.now() - hit.at < 6 * 3_600_000) return hit.scopes
  const app = process.env.META_APP_ID && process.env.META_APP_SECRET ? `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}` : null
  if (!app) return []
  const j = await graph("/debug_token", { input_token: token }, app)
  const scopes = scopesOf(j)
  if (j) scopeCache.set(key, { at: Date.now(), scopes })
  return scopes
}

/** The brand's Instagram account and what its token allows. */
export async function igAccess(userId: string): Promise<IgState> {
  const none: IgState = { state: "none", access: null, can: { discovery: false, hashtags: false, ownMedia: false } }
  try {
    const ig = (await listAccounts(userId)).find((a) => a.platform === "instagram" && a.status === "active")
    if (!ig) return none
    // The business-login user token (kept for ads) carries the user's grants; the Page token is the fallback.
    let token = dec(ig.tokenEnc)
    try {
      const { getAccess, decToken } = await import("@/lib/metaads/store")
      const a = await getAccess(userId)
      if (a && a.status === "active") token = decToken(a)
    } catch { /* page token it is */ }
    const scopes = await grantedScopes(token)
    const can = {
      discovery: hasAll(scopes, DISCOVERY_SCOPES),
      hashtags: hasAll(scopes, HASHTAG_SCOPES) && process.env.META_HASHTAG_SEARCH === "1",
      ownMedia: hasAll(scopes, OWN_MEDIA_SCOPES),
    }
    return { state: can.discovery || can.hashtags ? "on" : "pending", access: { igUserId: ig.externalId, handle: ig.handle ?? null, token, scopes }, can }
  } catch (err) {
    console.error("[meta-insights] access", err instanceof Error ? err.message : err)
    return none
  }
}

// ── Calls ───────────────────────────────────────────────────────────────────────────────────────

const MEDIA_FIELDS = "like_count,comments_count,view_count,permalink,media_type,media_product_type,timestamp"

/** Another Business/Creator account's public numbers (no captions). Null when not allowed or not found. */
export async function businessDiscovery(st: IgState, username: string, mediaLimit = 12): Promise<IgDiscovery | null> {
  if (!st.access || !st.can.discovery) return null
  const u = username.replace(/^@/, "").trim()
  if (!/^[A-Za-z0-9_.]{1,30}$/.test(u)) return null
  const j = await graph(`/${st.access.igUserId}`, { fields: `business_discovery.username(${u}){username,name,biography,website,followers_count,media_count,media.limit(${Math.min(25, mediaLimit)}){${MEDIA_FIELDS}}}` }, st.access.token)
  return parseDiscovery(j)
}

/** Top posts for a hashtag (no captions), inside Meta's 30-tags-a-week limit for this IG account. */
export async function hashtagTopMedia(userId: string, st: IgState, tag: string): Promise<IgMedia[]> {
  if (!st.access || !st.can.hashtags) return []
  const t = tag.replace(/^#/, "").toLowerCase()
  if (!/^[\p{L}\p{N}_]{2,60}$/u.test(t)) return []
  const s = await getAgentSettings(userId)
  const all = s.igHashtags ?? {}
  const log: HashtagLog = all[st.access.igUserId] ?? []
  const room = hashtagRoom(log, t)
  if (!room.ok) { console.warn(`[meta-insights] hashtag cap: ${room.used} tags this week`); return [] }
  let id = room.id
  if (!id) {
    const j = await graph("/ig_hashtag_search", { user_id: st.access.igUserId, q: t }, st.access.token)
    id = isObj(j) && Array.isArray(j.data) && isObj(j.data[0]) ? str(j.data[0].id) : null
    // Meta counts the lookup even when it fails, so it's logged either way.
    const keep = log.filter((x) => Date.now() - Date.parse(x.at) < HASHTAG_WINDOW_MS)
    await saveAgentSettings(userId, { igHashtags: { ...all, [st.access.igUserId]: [...keep, { tag: t, id, at: new Date().toISOString() }] } }).catch(() => null)
  }
  if (!id) return []
  const j = await graph(`/${id}/top_media`, { user_id: st.access.igUserId, fields: "media_type,comments_count,like_count,permalink,timestamp", limit: "25" }, st.access.token)
  return parseMediaList(j)
}

/** The owner's own recent posts, with their own captions (their content, used in their own emails). */
export async function ownMedia(st: IgState, limit = 3): Promise<(IgMedia & { caption: string | null })[]> {
  if (!st.access || !st.can.ownMedia) return []
  const j = await graph(`/${st.access.igUserId}/media`, { fields: `caption,${MEDIA_FIELDS}`, limit: String(Math.min(25, limit)) }, st.access.token)
  const list = isObj(j) && Array.isArray(j.data) ? j.data : []
  return list.flatMap((m) => { const x = media(m); return x ? [{ ...x, caption: isObj(m) ? str(m.caption) : null }] : [] })
}

/** For the profiles check: the owner's own Instagram profile read through Business Discovery. */
export async function igProfile(userId: string, username: string): Promise<IgDiscovery | null> {
  const st = await igAccess(userId)
  return businessDiscovery(st, username, 1)
}
