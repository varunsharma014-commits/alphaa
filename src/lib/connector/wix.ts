// Wix connector (self-managed Wix app, REST APIs).
//
// Auth (2026): new Wix apps use OAuth client credentials + the app instance ID. The legacy
// authorization-code / refresh-token flow ("custom authentication") is closed to new apps.
//   https://dev.wix.com/docs/build-apps/develop-your-app/auth/authenticate-using-oauth.md
//   https://dev.wix.com/docs/rest/app-management/oauth-2/create-access-token.md
// Install: external install flow → https://www.wix.com/app-installer?appId=…&postInstallationUrl=…
// Wix redirects back with appId, tenantId, instanceId, signedInstance + our own query params.
//   https://dev.wix.com/docs/build-apps/launch-your-app/app-distribution/install-your-app/about-the-external-install-flow.md
//   https://dev.wix.com/docs/build-apps/launch-your-app/app-distribution/install-your-app/set-up-the-external-install-flow.md
//   https://dev.wix.com/docs/build-apps/develop-your-app/auth/app-instances/parse-the-app-instance-query-parameter.md
// Blog:
//   https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/create-draft-post.md
//   https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/publish-draft-post.md
//   https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/update-draft-post.md (UPDATE_REVERT_TO_DRAFT)
//   https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/get-post.md
// Site + author:
//   https://dev.wix.com/docs/api-reference/app-management/app-instance/get-app-instance.md
//   https://dev.wix.com/docs/api-reference/crm/members-contacts/members/member-management/members/query-members.md
// Media: https://dev.wix.com/docs/api-reference/assets/media/media-manager/files/import-file.md
// SEO:   https://dev.wix.com/docs/api-reference/business-management/seo/item-seo-tags-v1/introduction.md
import { createHmac, timingSafeEqual } from "crypto"
import { decryptSecret } from "@/lib/checks/bing-webmaster"
import type { MetaInput, PublishInput, PublishResult, SiteConnection, SiteConnector } from "./types"

const API = "https://www.wixapis.com"

export const wixRedirectUri = () => `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/connect/wix/callback`

const PAGE_NOTE = "Wix can’t create standalone pages through its API, so this went into your blog."

export type WixTokens = { accessToken: string; refreshToken?: string; expiresAt?: number }

// ---------------------------------------------------------------------------
// HTTP

class WixError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

async function wx<T>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
      method: init.method ?? "GET",
      headers: {
        // Wix's docs pass the raw token (no "Bearer" prefix).
        Authorization: token,
        Accept: "application/json",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    })
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")
    throw new WixError(timeout ? "Wix took too long to answer. Try again in a minute." : "Couldn’t reach Wix. Try again in a minute.", 0)
  }
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) throw new WixError(wixErrorMessage(res.status, data), res.status)
  return data as T
}

export function wixErrorMessage(status: number, data: unknown): string {
  const d = (data ?? {}) as { message?: string; details?: { applicationError?: { description?: string; code?: string } } }
  const said = d.details?.applicationError?.description || d.message || ""
  const lead =
    status === 401 || status === 403
      ? "Wix refused the request — Alphaa may have been removed from the site or is missing a permission. Reconnect Wix."
      : status === 404
        ? "Wix couldn’t find that item — it may have been deleted in Wix."
        : status === 428
          ? "Your Wix site is missing something this needs (usually the Wix Blog app). Add it in Wix, then try again."
          : status === 429
            ? "Wix is rate-limiting us. Try again in a minute."
            : `Wix answered ${status}.`
  return said ? `${lead} Wix said: ${said}` : lead
}

// ---------------------------------------------------------------------------
// Install + tokens

/**
 * External install flow URL. `state` rides along as a query param on our callback URL,
 * which Wix preserves. Unlisted apps also need WIX_SHARE_URL_ID (the GUID behind the
 * app's "Share Install Link").
 */
export function wixInstallUrl(state: string): string {
  const callback = new URL(wixRedirectUri())
  callback.searchParams.set("state", state)
  const u = new URL("https://www.wix.com/app-installer")
  u.searchParams.set("appId", process.env.WIX_APP_ID ?? "")
  if (process.env.WIX_SHARE_URL_ID) u.searchParams.set("shareUrlId", process.env.WIX_SHARE_URL_ID)
  u.searchParams.set("postInstallationUrl", callback.toString())
  return u.toString()
}

const b64urlDecode = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64")

/**
 * Verify Wix's `signedInstance` (HMAC-SHA256 of the data part with the app secret,
 * base64url, "<sig>.<data>"). Returns the decoded instance data, or null if forged.
 */
export function wixVerifyInstance(signed: string, secret = process.env.WIX_APP_SECRET ?? ""): { instanceId?: string; [k: string]: unknown } | null {
  if (!signed || !secret) return null
  const dot = signed.indexOf(".")
  if (dot <= 0) return null
  const sig = b64urlDecode(signed.slice(0, dot))
  const data = signed.slice(dot + 1)
  const mine = createHmac("sha256", secret).update(data).digest()
  if (sig.length !== mine.length || !timingSafeEqual(sig, mine)) return null
  try {
    return JSON.parse(b64urlDecode(data).toString("utf8"))
  } catch {
    return null
  }
}

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string; message?: string }

async function tokenCall(url: string, body: Record<string, string>): Promise<WixTokens> {
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: process.env.WIX_APP_ID, client_secret: process.env.WIX_APP_SECRET, ...body }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new Error("Couldn’t reach Wix to sign in. Try again in a minute.")
  }
  const data = (await res.json().catch(() => ({}))) as TokenResponse
  if (!res.ok || !data.access_token) {
    const said = data.error_description || data.message || data.error
    throw new Error(`Wix didn’t let Alphaa sign in to your site${said ? ` (${said})` : ""}. Reconnect Wix.`)
  }
  // Client-credentials tokens are valid for 4 hours (per the docs); trust expires_in when sent.
  const ttl = typeof data.expires_in === "number" && data.expires_in > 0 ? data.expires_in : 4 * 3600
  return { accessToken: data.access_token, ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}), expiresAt: Date.now() + ttl * 1000 }
}

/**
 * Get tokens for a site. With an instanceId (current flow) this is an OAuth client-credentials
 * call; with only a code it falls back to the legacy authorization-code grant (old apps only).
 */
export async function wixExchange(code: string, instanceId?: string): Promise<WixTokens> {
  if (instanceId) {
    return tokenCall(`${API}/oauth2/token`, { grant_type: "client_credentials", instance_id: instanceId })
  }
  if (!code) throw new Error("Wix didn’t send back the site it installed on. Try connecting again.")
  return tokenCall(`${API}/oauth/access`, { grant_type: "authorization_code", code })
}

// In-memory cache so a burst of calls doesn't mint a token each time. Keyed by instanceId.
const tokenCache = new Map<string, WixTokens>()
const fresh = (t?: WixTokens | null) => !!t?.accessToken && (!t.expiresAt || t.expiresAt - 5 * 60_000 > Date.now())

/** A usable access token for this connection, refreshed in memory when expired. */
async function tokenFor(conn: SiteConnection): Promise<string> {
  let stored: WixTokens
  try {
    stored = JSON.parse(decryptSecret(conn.tokenEnc)) as WixTokens
  } catch {
    throw new Error("The Wix connection is damaged. Reconnect Wix.")
  }
  const instanceId = conn.config.instanceId
  if (fresh(stored)) return stored.accessToken
  if (instanceId) {
    const cached = tokenCache.get(instanceId)
    if (fresh(cached)) return cached!.accessToken
    const t = await wixExchange("", instanceId)
    tokenCache.set(instanceId, t)
    return t.accessToken
  }
  if (stored.refreshToken) {
    const t = await tokenCall(`${API}/oauth/access`, { grant_type: "refresh_token", refresh_token: stored.refreshToken })
    return t.accessToken
  }
  throw new Error("The Wix connection has expired. Reconnect Wix.")
}

// ---------------------------------------------------------------------------
// Setup (after install)

type AppInstance = {
  instance?: { instanceId?: string }
  site?: { url?: string; siteDisplayName?: string; ownerInfo?: { email?: string }; installedWixApps?: string[] }
}
type Member = { id?: string; loginEmail?: string }
type Post = { id?: string; memberId?: string; slug?: string; url?: { base?: string; path?: string } }

/**
 * Blog posts from a 3rd-party app need a `memberId` (the post's author).
 * 1) the site owner's member record, matched by the owner's login email (Get App Instance
 *    ownerInfo.email + Query Members loginEmail $eq);
 * 2) the author of the most recent published post;
 * 3) the only member on the site, if there's exactly one.
 */
async function findAuthor(token: string, ownerEmail?: string): Promise<string | null> {
  if (ownerEmail) {
    try {
      const r = await wx<{ members?: Member[] }>(token, "/members/v1/members/query", {
        method: "POST",
        body: { fieldsets: ["EXTENDED"], query: { filter: { loginEmail: { $eq: ownerEmail } }, paging: { limit: 1 } } },
      })
      if (r.members?.[0]?.id) return r.members[0].id
    } catch {
      /* try the next source */
    }
  }
  try {
    const r = await wx<{ posts?: Post[] }>(token, "/blog/v3/posts?paging.limit=1")
    if (r.posts?.[0]?.memberId) return r.posts[0].memberId
  } catch {
    /* try the next source */
  }
  try {
    const r = await wx<{ members?: Member[] }>(token, "/members/v1/members/query", { method: "POST", body: { query: { paging: { limit: 2 } } } })
    if (r.members?.length === 1 && r.members[0].id) return r.members[0].id
  } catch {
    /* fall through */
  }
  return null
}

const withProtocol = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)

export async function wixSetup(
  tokens: WixTokens & { instanceId?: string },
): Promise<{ siteUrl: string; label: string; config: { instanceId?: string; memberId: string } } | { error: string }> {
  try {
    const inst = await wx<AppInstance>(tokens.accessToken, "/apps/v1/instance")
    const rawUrl = inst.site?.url
    if (!rawUrl) return { error: "Your Wix site isn’t published yet, so there’s nowhere public to post. Publish it in Wix, then connect again." }
    const siteUrl = withProtocol(rawUrl).replace(/\/+$/, "")
    const u = new URL(siteUrl)
    const host = u.hostname.replace(/^www\./, "")
    const label = u.pathname && u.pathname !== "/" ? `${host}${u.pathname}` : host

    const memberId = await findAuthor(tokens.accessToken, inst.site?.ownerInfo?.email)
    if (!memberId) {
      return {
        error:
          "Wix needs a blog author for Alphaa’s posts, and we couldn’t find your member profile. Make sure the Wix Blog is added to your site, publish one post from your Wix dashboard, then connect again.",
      }
    }
    const instanceId = tokens.instanceId || inst.instance?.instanceId
    return { siteUrl, label, config: { ...(instanceId ? { instanceId } : {}), memberId } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn’t read your Wix site." }
  }
}

// ---------------------------------------------------------------------------
// HTML → Ricos (the rich-content format Wix Blog stores)
// Node schema: https://dev.wix.com/docs/api-reference/assets/rich-content/ricos-documents/convert-to-ricos-document.md
//  PARAGRAPH{nodes:[TEXT], paragraphData}, HEADING{headingData:{level}}, BULLETED_LIST → LIST_ITEM → PARAGRAPH,
//  TEXT{textData:{text, decorations:[{type:"BOLD", fontWeightValue:700}|{type:"ITALIC"}|{type:"LINK", linkData}]}}

export type RicosDecoration =
  | { type: "BOLD"; fontWeightValue: number }
  | { type: "ITALIC"; italicData: boolean }
  | { type: "LINK"; linkData: { link: { url: string; target: "BLANK" | "SELF"; rel?: { noreferrer?: boolean } } } }
export type RicosNode = {
  type: string
  id: string
  nodes: RicosNode[]
  textData?: { text: string; decorations: RicosDecoration[] }
  paragraphData?: Record<string, unknown>
  headingData?: { level: number }
  bulletedListData?: { indentation: number }
  orderedListData?: { indentation: number }
  imageData?: Record<string, unknown>
}
export type RicosDocument = { nodes: RicosNode[] }

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…" }
function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

type Run = { text: string; bold: boolean; italic: boolean; link: string | null }
type Block = { kind: "PARAGRAPH" | "HEADING"; level: number; runs: Run[]; inItem: boolean }
type List = { kind: "BULLETED_LIST" | "ORDERED_LIST"; items: RicosNode[] }

/** Convert our sanitized article HTML (h1-h6, p, ul/ol/li, strong/b, em/i, a, br) to a Ricos document. */
export function htmlToRicos(html: string): RicosDocument {
  let seq = 0
  const nid = () => `n${(++seq).toString(36)}`
  const out: RicosNode[] = []
  const lists: List[] = []
  let block: Block | null = null
  let bold = 0
  let italic = 0
  let link: string | null = null

  const textNode = (r: Run): RicosNode => {
    const decorations: RicosDecoration[] = []
    if (r.bold) decorations.push({ type: "BOLD", fontWeightValue: 700 })
    if (r.italic) decorations.push({ type: "ITALIC", italicData: true })
    if (r.link) decorations.push({ type: "LINK", linkData: { link: { url: r.link, target: "BLANK", rel: { noreferrer: true } } } })
    return { type: "TEXT", id: "", nodes: [], textData: { text: r.text, decorations } }
  }

  const flush = () => {
    const b = block
    block = null
    if (!b) return
    const runs = b.runs.map((r) => ({ ...r }))
    if (runs.length) {
      runs[0].text = runs[0].text.replace(/^\s+/, "")
      runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "")
    }
    const kept = runs.filter((r) => r.text.length > 0)
    if (!kept.length) return
    const node: RicosNode =
      b.kind === "HEADING"
        ? { type: "HEADING", id: nid(), nodes: kept.map(textNode), headingData: { level: b.level } }
        : { type: "PARAGRAPH", id: nid(), nodes: kept.map(textNode), paragraphData: {} }
    const list = lists[lists.length - 1]
    if (list && (b.inItem || b.kind === "PARAGRAPH")) {
      list.items.push({ type: "LIST_ITEM", id: nid(), nodes: [node.type === "PARAGRAPH" ? node : { ...node, type: "PARAGRAPH", headingData: undefined, paragraphData: {} }] })
    } else {
      out.push(node)
    }
  }

  const open = (kind: Block["kind"], level = 0, inItem = false) => {
    flush()
    block = { kind, level, runs: [], inItem }
  }

  const addText = (raw: string) => {
    const text = decodeEntities(raw.replace(/\s+/g, " "))
    if (!block) {
      if (!text.trim()) return
      open("PARAGRAPH", 0, lists.length > 0)
    }
    const b = block as Block
    const last = b.runs[b.runs.length - 1]
    const cur = { bold: bold > 0, italic: italic > 0, link }
    if (last && last.bold === cur.bold && last.italic === cur.italic && last.link === cur.link) last.text += text
    else b.runs.push({ text, ...cur })
    // Collapse double spaces across run boundaries.
    if (last && /\s$/.test(last.text) && b.runs[b.runs.length - 1] !== last) {
      const nr = b.runs[b.runs.length - 1]
      nr.text = nr.text.replace(/^\s+/, "")
    }
  }

  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cleaned))) {
    if (m[4] !== undefined) {
      addText(m[4])
      continue
    }
    const closing = m[1] === "/"
    const tag = m[2].toLowerCase()
    const attrs = m[3] || ""
    if (/^h[1-6]$/.test(tag)) {
      if (closing) flush()
      else open("HEADING", Number(tag[1]))
    } else if (tag === "p" || tag === "div" || tag === "blockquote") {
      if (closing) flush()
      else open("PARAGRAPH", 0, lists.length > 0 && !!block && (block as Block).inItem)
    } else if (tag === "ul" || tag === "ol") {
      flush()
      if (!closing) lists.push({ kind: tag === "ul" ? "BULLETED_LIST" : "ORDERED_LIST", items: [] })
      else {
        const done = lists.pop()
        if (done && done.items.length) {
          const parent = lists[lists.length - 1]
          if (parent) parent.items.push(...done.items) // flatten nested lists
          else
            out.push(
              done.kind === "BULLETED_LIST"
                ? { type: "BULLETED_LIST", id: nid(), nodes: done.items, bulletedListData: { indentation: 0 } }
                : { type: "ORDERED_LIST", id: nid(), nodes: done.items, orderedListData: { indentation: 0 } },
            )
        }
      }
    } else if (tag === "li") {
      if (closing) flush()
      else open("PARAGRAPH", 0, true)
    } else if (tag === "strong" || tag === "b") {
      bold = Math.max(0, bold + (closing ? -1 : 1))
    } else if (tag === "em" || tag === "i") {
      italic = Math.max(0, italic + (closing ? -1 : 1))
    } else if (tag === "a") {
      if (closing) link = null
      else {
        const href = /href\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs)
        const url = href ? decodeEntities(href[2] ?? href[3] ?? "") : ""
        link = /^(https?:|mailto:|tel:)/i.test(url) ? url : null
      }
    } else if (tag === "br") {
      if (block) {
        const b = block as Block
        open(b.kind, b.level, b.inItem)
      }
    }
    // Any other tag is ignored; its text still comes through.
  }
  flush()
  while (lists.length) {
    // Unclosed lists: close them in order.
    const done = lists.pop()!
    if (!done.items.length) continue
    const parent = lists[lists.length - 1]
    if (parent) parent.items.push(...done.items)
    else out.push({ type: done.kind, id: nid(), nodes: done.items, ...(done.kind === "BULLETED_LIST" ? { bulletedListData: { indentation: 0 } } : { orderedListData: { indentation: 0 } }) })
  }
  return { nodes: out }
}

// ---------------------------------------------------------------------------
// Connector

type DraftPost = { id?: string; slug?: string; seoSlug?: string; url?: { base?: string; path?: string } }

const joinUrl = (u?: { base?: string; path?: string }) => {
  if (!u?.base && !u?.path) return null
  const base = withProtocol((u.base ?? "").replace(/\/+$/, ""))
  const path = (u.path ?? "").startsWith("/") ? u.path : `/${u.path ?? ""}`
  return `${base}${path}`
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/, "") || `post-${Date.now().toString(36)}`
  )
}

/** Import a public image into the site's Media Manager so it's served from Wix. Null on any failure. */
async function importImage(token: string, url: string): Promise<{ id: string; url?: string } | null> {
  try {
    const r = await wx<{ file?: { id?: string; url?: string } }>(token, "/site-media/v1/files/import", {
      method: "POST",
      body: { url, mediaType: "IMAGE", displayName: decodeURIComponent(url.split("/").pop()?.split("?")[0] || "cover.jpg").slice(0, 200) },
    })
    return r.file?.id ? { id: r.file.id, url: r.file.url } : null
  } catch {
    return null
  }
}

function seoTags(input: PublishInput): { type: string; props?: Record<string, string>; children?: string }[] {
  const tags: { type: string; props?: Record<string, string>; children?: string }[] = []
  if (input.excerpt) tags.push({ type: "meta", props: { name: "description", content: input.excerpt.slice(0, 300) } })
  for (const ld of input.jsonld ?? []) tags.push({ type: "script", props: { type: "application/ld+json" }, children: JSON.stringify(ld) })
  return tags
}

type SeoTag = { type: string; props?: Record<string, string>; children?: string; custom?: boolean; disabled?: boolean }
type ItemSeo = { itemType?: string; itemId?: string; tags?: SeoTag[]; resolvedTags?: { tag?: SeoTag }[] }

// The Item SEO Tags reference lists /seo-metatags-server/v1/… while its curl examples use /promote/seo/v1/…
const SEO_BASES = ["/seo-metatags-server/v1/item-seo-tags", "/promote/seo/v1/item-seo-tags"]
async function seoCall<T>(token: string, suffix: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let last: unknown
  for (const base of SEO_BASES) {
    try {
      return await wx<T>(token, `${base}${suffix}`, init)
    } catch (e) {
      last = e
      if (!(e instanceof WixError && e.status === 404)) throw e
    }
  }
  throw last
}

const pathOf = (u: string) => {
  try {
    return new URL(withProtocol(u)).pathname.replace(/\/+$/, "").toLowerCase() || "/"
  } catch {
    return u.replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase() || "/"
  }
}

/** A static page's canonical/og:url from its resolved tags, if Wix reports one. */
const itemPath = (it: ItemSeo): string | null => {
  for (const r of it.resolvedTags ?? []) {
    const t = r.tag
    if (!t?.props) continue
    if (t.type === "link" && t.props.rel === "canonical" && t.props.href) return pathOf(t.props.href)
    if (t.type === "meta" && t.props.property === "og:url" && t.props.content) return pathOf(t.props.content)
  }
  return null
}

const SEO_UNDO = "seo:"

export const wix: SiteConnector = {
  async ping(conn: SiteConnection): Promise<void> {
    await wx<unknown>(await tokenFor(conn), "/apps/v1/instance")
  },

  async publish(conn: SiteConnection, input: PublishInput): Promise<PublishResult> {
    const token = await tokenFor(conn)
    const memberId = conn.config.memberId
    if (!memberId) throw new Error("The Wix connection is missing its blog author. Reconnect Wix.")

    const doc = htmlToRicos(input.html)
    if (!doc.nodes.length) throw new Error("This post has no content to publish.")
    if (input.image?.url) {
      const file = await importImage(token, input.image.url)
      doc.nodes.unshift({
        type: "IMAGE",
        id: "cover",
        nodes: [],
        imageData: {
          containerData: { width: { size: "CONTENT" }, alignment: "CENTER" },
          image: { src: file ? { id: file.id } : { url: input.image.url } },
          altText: input.image.alt,
        },
      })
    }

    const draftPost: Record<string, unknown> = {
      title: input.title.slice(0, 200),
      memberId,
      richContent: doc,
      seoSlug: slugify(input.slug || input.title).slice(0, 100),
      ...(input.excerpt ? { excerpt: input.excerpt.slice(0, 500) } : {}),
      // With custom:false Wix uses the first media in the content (our cover image) as the cover.
      ...(input.image?.url ? { media: { displayed: true, custom: false } } : {}),
    }
    const tags = seoTags(input)
    const create = (withSeo: boolean) =>
      wx<{ draftPost?: DraftPost }>(token, "/blog/v3/draft-posts", {
        method: "POST",
        body: { draftPost: withSeo && tags.length ? { ...draftPost, seoData: { tags } } : draftPost, fieldsets: ["URL"] },
      })
    let created: { draftPost?: DraftPost }
    try {
      created = await create(true)
    } catch (e) {
      // If Wix rejects our SEO tags (JSON-LD / description), post without them rather than fail.
      if (tags.length && e instanceof WixError && e.status === 400) created = await create(false)
      else throw e
    }
    const draftId = created.draftPost?.id
    if (!draftId) throw new Error("Wix didn’t return the new post. Check your Wix Blog drafts and try again.")

    const pub = await wx<{ postId?: string }>(token, `/blog/v3/draft-posts/${encodeURIComponent(draftId)}/publish`, { method: "POST" })
    const postId = pub.postId || draftId

    let url: string | null = null
    try {
      const got = await wx<{ post?: Post }>(token, `/blog/v3/posts/${encodeURIComponent(postId)}?fieldsets=URL`)
      url = joinUrl(got.post?.url)
    } catch {
      /* fall back below */
    }
    url = url || joinUrl(created.draftPost?.url) || `${conn.siteUrl.replace(/\/+$/, "")}/post/${created.draftPost?.seoSlug || created.draftPost?.slug || draftPost.seoSlug}`

    return { id: draftId, url, ...(input.kind === "page" ? { note: PAGE_NOTE } : {}) }
  },

  /** Unpublish: revert the post to a draft (never delete). SEO changes: restore the previous tags. */
  async undo(conn: SiteConnection, id: string): Promise<void> {
    const token = await tokenFor(conn)
    if (id.startsWith(SEO_UNDO)) {
      const [, itemType, itemId, prev] = id.split(":")
      let tags: SeoTag[] = []
      try {
        tags = prev ? (JSON.parse(Buffer.from(prev, "base64url").toString("utf8")) as SeoTag[]) : []
      } catch {
        tags = []
      }
      const suffix = `/${encodeURIComponent(itemType)}/${encodeURIComponent(itemId)}`
      if (!tags.length) {
        await seoCall(token, `${suffix}/reset-to-default`, { method: "POST", body: {} })
        return
      }
      await seoCall(token, suffix, { method: "PATCH", body: { itemSeoTags: { tags }, fieldMask: "tags" } })
      if (itemType === "STATIC_PAGE") await seoCall(token, suffix, { method: "PATCH", body: { itemSeoTags: { tags }, fieldMask: "tags", publish: true } })
      return
    }
    await wx<unknown>(token, `/blog/v3/draft-posts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { draftPost: { id }, action: "UPDATE_REVERT_TO_DRAFT" },
    })
  },

  /** Page / post SEO title + description via the Item SEO Tags API. */
  async updateMeta(conn: SiteConnection, input: MetaInput): Promise<PublishResult> {
    const token = await tokenFor(conn)
    const want = pathOf(input.url)
    const sitePath = pathOf(conn.siteUrl)
    // Free Wix sites live under a path (user.wixsite.com/site); strip it.
    const rel = sitePath !== "/" && want.startsWith(sitePath) ? want.slice(sitePath.length) || "/" : want

    let item: ItemSeo | null = null
    const postSlug = /^\/post\/([^/]+)$/.exec(rel)
    if (postSlug) {
      const got = await wx<{ post?: Post }>(token, `/blog/v3/posts/slugs/${encodeURIComponent(decodeURIComponent(postSlug[1]))}`)
      if (got.post?.id) item = await seoCall<{ itemSeoTags?: ItemSeo }>(token, `/BLOG_POST/${encodeURIComponent(got.post.id)}`).then((r) => r.itemSeoTags ?? { itemType: "BLOG_POST", itemId: got.post!.id })
    } else {
      let cursor: string | undefined
      for (let i = 0; i < 10 && !item; i++) {
        const r = await seoCall<{ itemSeoTags?: ItemSeo[]; pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean } }>(
          token,
          `/STATIC_PAGE?paging.limit=100${cursor ? `&paging.cursor=${encodeURIComponent(cursor)}` : ""}`,
        )
        item = (r.itemSeoTags ?? []).find((it) => {
          const p = itemPath(it)
          if (!p) return false
          const pr = sitePath !== "/" && p.startsWith(sitePath) ? p.slice(sitePath.length) || "/" : p
          return pr === rel
        }) ?? null
        cursor = r.pagingMetadata?.cursors?.next
        if (!cursor || r.pagingMetadata?.hasNext === false) break
      }
    }
    if (!item?.itemId) throw new Error(`We couldn’t match ${input.url} to a page on your Wix site. You can change its title and description in Wix under the page’s SEO settings.`)

    const itemType = item.itemType || (postSlug ? "BLOG_POST" : "STATIC_PAGE")
    const prev = (item.tags ?? []).map(({ type, props, children, custom, disabled }) => ({ type, props, children, custom, disabled }))
    const isTitle = (t: SeoTag) => t.type === "title"
    const isDesc = (t: SeoTag) => t.type === "meta" && t.props?.name === "description"
    const tags: SeoTag[] = [
      ...prev.filter((t) => !isTitle(t) && !isDesc(t)),
      { type: "title", children: input.title },
      { type: "meta", props: { name: "description", content: input.description } },
    ]
    const suffix = `/${encodeURIComponent(itemType)}/${encodeURIComponent(item.itemId)}`
    // Static pages keep a draft and a live revision: save the draft, then publish the same change.
    await seoCall(token, suffix, { method: "PATCH", body: { itemSeoTags: { tags }, fieldMask: "tags" } })
    if (itemType === "STATIC_PAGE") await seoCall(token, suffix, { method: "PATCH", body: { itemSeoTags: { tags }, fieldMask: "tags", publish: true } })

    const packed = Buffer.from(JSON.stringify(prev)).toString("base64url")
    return { id: `${SEO_UNDO}${itemType}:${item.itemId}:${packed}`, url: input.url }
  },
}
