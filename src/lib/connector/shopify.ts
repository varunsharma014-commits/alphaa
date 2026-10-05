import { createHmac, timingSafeEqual } from "crypto"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"
import type { MetaInput, PublishInput, PublishResult, SiteConnection, SiteConnector } from "./types"

// Shopify connector: a public app installed with the OAuth authorization code grant,
// then Admin GraphQL for blog articles, pages and SEO metafields.
//
// OAuth:     https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
// Tokens:    https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/offline-access-tokens
//            (public apps must use expiring offline tokens by 2027-01-01: 1h access + 90-day rotating refresh token)
// Scopes:    https://shopify.dev/docs/api/usage/access-scopes (write_content covers Article, Blog, Page)
// Mutations: https://shopify.dev/docs/api/admin-graphql/latest/mutations/articleCreate (+ articleUpdate,
//            pageCreate, pageUpdate, metafieldsSet)
// SEO:       https://shopify.dev/docs/apps/build/marketing-analytics/optimize-storefront-seo
//            (metafields namespace "global", keys "title_tag"/"description_tag", type single_line_text_field)

export const SHOPIFY_API_VERSION = "2026-07" // latest stable per https://shopify.dev/docs/api/usage/versioning
export const SHOPIFY_SCOPES = "read_content,write_content"
const TIMEOUT = 20_000
const SHOP_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/

type Tokens = { accessToken: string; refreshToken?: string; expiresAt?: string }

const redirectUri = () => `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/connect/shopify/callback`

/** "brightsmile", "BrightSmile.myshopify.com", "https://brightsmile.myshopify.com/admin" → "brightsmile.myshopify.com" (or null). */
export function normalizeShop(raw: string | null | undefined): string | null {
  let s = (raw ?? "").trim().toLowerCase()
  if (!s) return null
  s = s.replace(/^https?:\/\//, "").split(/[/?#]/)[0]
  if (!s.includes(".")) s = `${s}.myshopify.com`
  return SHOP_RE.test(s) ? s : null
}

export function isShopDomain(shop: string | null | undefined): shop is string {
  return !!shop && SHOP_RE.test(shop)
}

export function shopifyAuthUrl(shop: string, state: string): string {
  const u = new URL(`https://${shop}/admin/oauth/authorize`)
  u.searchParams.set("client_id", process.env.SHOPIFY_API_KEY ?? "")
  u.searchParams.set("scope", SHOPIFY_SCOPES)
  u.searchParams.set("redirect_uri", redirectUri())
  u.searchParams.set("state", state)
  return u.toString()
}

/**
 * Verify the `hmac` Shopify adds to the OAuth callback: HMAC-SHA256 (hex) with the app
 * secret over the other params, sorted by key and joined as k=v&k=v. We accept the
 * decoded-value form (what Shopify's own sample computes) or the URL-encoded form.
 */
export function verifyShopifyHmac(query: URLSearchParams, secret = process.env.SHOPIFY_API_SECRET ?? ""): boolean {
  const hmac = query.get("hmac")
  if (!secret || !hmac || !/^[0-9a-f]{64}$/i.test(hmac)) return false
  const pairs = [...query.entries()].filter(([k]) => k !== "hmac" && k !== "signature").sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const raw = pairs.map(([k, v]) => `${k}=${v}`).join("&")
  const encoded = new URLSearchParams(pairs).toString()
  const given = Buffer.from(hmac.toLowerCase(), "hex")
  return [raw, encoded].some((msg) => {
    const digest = createHmac("sha256", secret).update(msg).digest()
    return digest.length === given.length && timingSafeEqual(digest, given)
  })
}

/** Webhooks: X-Shopify-Hmac-Sha256 = base64 HMAC-SHA256 of the raw body with the app secret. */
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null, secret = process.env.SHOPIFY_API_SECRET ?? ""): boolean {
  if (!secret || !hmacHeader) return false
  const given = Buffer.from(hmacHeader, "base64")
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest()
  return given.length === digest.length && timingSafeEqual(given, digest)
}

async function tokenRequest(shop: string, body: Record<string, string>): Promise<Tokens> {
  if (!isShopDomain(shop)) throw new Error("That isn't a valid Shopify store address.")
  let res: Response
  try {
    res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ client_id: process.env.SHOPIFY_API_KEY ?? "", client_secret: process.env.SHOPIFY_API_SECRET ?? "", ...body }),
      signal: AbortSignal.timeout(TIMEOUT),
    })
  } catch {
    throw new Error("Shopify didn't answer in time. Please try again.")
  }
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
    error_description?: string
    errors?: string
  }
  if (!res.ok || !data.access_token) {
    throw new Error(`Shopify refused the connection: ${data.error_description || data.error || data.errors || `HTTP ${res.status}`}`)
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
  }
}

/** Swap the callback's `code` for an offline token (expiring=1: required for new public apps). */
export function shopifyExchange(shop: string, code: string): Promise<Tokens> {
  return tokenRequest(shop, { code, expiring: "1" })
}

// ---------- token refresh ----------

const refreshing = new Map<string, Promise<Tokens>>()

/** Current access token for a connection, refreshing (and saving) an expiring one when it's near expiry. */
async function accessToken(conn: SiteConnection): Promise<string> {
  let tokens: Tokens
  try {
    tokens = JSON.parse(decryptSecret(conn.tokenEnc)) as Tokens
  } catch {
    throw new Error("Your Shopify connection is damaged. Please reconnect your store.")
  }
  if (!tokens.refreshToken || !tokens.expiresAt || Date.parse(tokens.expiresAt) - Date.now() > 5 * 60_000) return tokens.accessToken

  const shop = conn.config.shop
  let p = refreshing.get(shop)
  if (!p) {
    p = tokenRequest(shop, { grant_type: "refresh_token", refresh_token: tokens.refreshToken })
      .then(async (next) => {
        const merged = { ...next, refreshToken: next.refreshToken ?? tokens.refreshToken }
        conn.tokenEnc = encryptSecret(JSON.stringify(merged))
        await persistTokens(shop, conn.tokenEnc).catch((e) => console.error("[shopify] could not save refreshed token", e))
        return merged
      })
      .catch(() => {
        throw new Error("Your Shopify connection has expired. Please reconnect your store.")
      })
      .finally(() => refreshing.delete(shop))
    refreshing.set(shop, p)
  }
  return (await p).accessToken
}

/** Refresh tokens rotate, so save the new one on every settings row connected to this shop. */
async function persistTokens(shop: string, tokenEnc: string) {
  const { db } = await import("@/lib/db")
  const rows = await db.mockActivity.findMany({
    where: { type: "agent_settings", metadata: { path: ["site", "config", "shop"], equals: shop } },
  })
  for (const row of rows) {
    const meta = (row.metadata ?? {}) as { site?: SiteConnection }
    if (!meta.site || meta.site.platform !== "shopify") continue
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...meta, site: { ...meta.site, tokenEnc } } as object } })
  }
}

// ---------- GraphQL ----------

type UserError = { field?: string[] | null; message: string }

async function gql<T>(shop: string, token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(TIMEOUT),
    })
  } catch {
    throw new Error("Shopify didn't answer in time. Please try again.")
  }
  if (res.status === 401 || res.status === 403) throw new Error("Shopify rejected Alphaa's access. Please reconnect your store (the app may have been uninstalled).")
  if (res.status === 402) throw new Error("This Shopify store is frozen or unpaid, so Shopify won't accept changes right now.")
  if (res.status === 429) throw new Error("Shopify is rate-limiting requests. Please try again in a minute.")
  const data = (await res.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] | string }
  if (!res.ok || data.errors || !data.data) {
    const msg = Array.isArray(data.errors) ? data.errors.map((e) => e.message).join("; ") : data.errors
    throw new Error(`Shopify returned an error: ${msg || `HTTP ${res.status}`}`)
  }
  return data.data
}

function check(what: string, errors: UserError[] | undefined) {
  if (errors?.length) throw new Error(`Shopify couldn't ${what}: ${errors.map((e) => e.message).join("; ")}`)
}

const clean = (u: string) => u.replace(/\/+$/, "")

async function storeUrl(shop: string, token: string): Promise<string> {
  const d = await gql<{ shop: { primaryDomain: { url: string } | null; url: string } }>(shop, token, `{ shop { url primaryDomain { url } } }`)
  return clean(d.shop.primaryDomain?.url || d.shop.url || `https://${shop}`)
}

/** After OAuth: find the store's public address and the blog posts should go to. */
export async function shopifySetup(
  shop: string,
  accessToken: string,
): Promise<{ siteUrl: string; label: string; config: { shop: string; blogId: string } } | { error: string }> {
  try {
    const d = await gql<{
      shop: { name: string; url: string; primaryDomain: { url: string } | null }
      blogs: { nodes: { id: string; handle: string; title: string }[] }
    }>(shop, accessToken, `{ shop { name url primaryDomain { url } } blogs(first: 50) { nodes { id handle title } } }`)
    const blogs = d.blogs.nodes
    const blog = blogs.find((b) => b.handle === "news") ?? blogs.find((b) => b.handle === "blog") ?? blogs[0]
    if (!blog) return { error: "Your Shopify store has no blog yet. In Shopify, go to Online Store → Blog posts → Manage blogs → Add blog, then connect again." }
    return {
      siteUrl: clean(d.shop.primaryDomain?.url || d.shop.url || `https://${shop}`),
      label: shop,
      config: { shop, blogId: blog.id },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't read your Shopify store." }
  }
}

// ---------- billing (Shopify Managed Pricing) ----------

export type ShopifyAppSubscription = { name: string; status: string; test: boolean }

/** The app's active subscriptions on this shop (Managed Pricing plans show up here once approved). */
export async function shopifyActiveSubscriptions(shop: string, token: string): Promise<ShopifyAppSubscription[]> {
  const d = await gql<{ currentAppInstallation: { activeSubscriptions: ShopifyAppSubscription[] } | null }>(
    shop,
    token,
    `{ currentAppInstallation { activeSubscriptions { name status test } } }`,
  )
  return d.currentAppInstallation?.activeSubscriptions ?? []
}

/** Same, for a saved connection (refreshes an expiring token first). */
export async function shopifyActiveSubscriptionsFor(conn: SiteConnection): Promise<ShopifyAppSubscription[]> {
  return shopifyActiveSubscriptions(conn.config.shop, await accessToken(conn))
}

// ---------- URL → resource ----------

export type ShopifyTarget = { type: "home" } | { type: "page"; handle: string } | { type: "article"; blog: string; handle: string } | { type: "other"; path: string }

/** Map a storefront URL (any domain, optional /<locale> prefix) to the Shopify resource behind it. */
export function matchShopifyPath(url: string): ShopifyTarget {
  let path: string
  try {
    path = new URL(url, "https://x.invalid").pathname
  } catch {
    return { type: "other", path: url }
  }
  const parts = path.split("/").filter(Boolean).map((p) => decodeURIComponent(p).toLowerCase())
  if (parts[0] && /^[a-z]{2}(-[a-z]{2,4})?$/.test(parts[0]) && parts[0] !== "pages" && parts[0] !== "blogs") parts.shift() // /fr/pages/x, /en-ca/…
  if (parts.length === 0) return { type: "home" }
  if (parts[0] === "pages" && parts.length === 2) return { type: "page", handle: parts[1] }
  if (parts[0] === "blogs" && parts.length === 3 && parts[2] !== "tagged") return { type: "article", blog: parts[1], handle: parts[2] }
  return { type: "other", path }
}

// ---------- connector ----------

const ARTICLE_FIELDS = `id handle blog { handle }`
const PAGE_FIELDS = `id handle` // Admin API Page has no onlineStoreUrl (that's Storefront API)

type PrevSeo = { t: string | null; d: string | null }
const META_RE = /^meta:(gid:\/\/shopify\/(?:Article|Page)\/\d+):([A-Za-z0-9_-]*)$/

function splitId(id: string): { kind: "article" | "page"; gid: string } {
  if (id.startsWith("meta:")) throw new Error("That SEO title change was made before Undo was available for it. Edit the Search engine listing in Shopify admin.")
  const m = /^(article|page):(gid:\/\/shopify\/(Article|Page)\/\d+)$/.exec(id)
  if (!m) throw new Error("That change wasn't made through Shopify, so it can't be undone here.")
  return { kind: m[1] as "article" | "page", gid: m[2] }
}

function seoMetafields(ownerId: string, title: string, description: string) {
  return [
    { ownerId, namespace: "global", key: "title_tag", type: "single_line_text_field", value: title.slice(0, 255) },
    { ownerId, namespace: "global", key: "description_tag", type: "single_line_text_field", value: description.slice(0, 320) },
  ].filter((m) => m.value.trim())
}

export const shopify: SiteConnector = {
  async ping(conn: SiteConnection): Promise<void> {
    await gql<unknown>(conn.config.shop, await accessToken(conn), `{ shop { name } }`)
  },

  async publish(conn: SiteConnection, input: PublishInput): Promise<PublishResult> {
    const shop = conn.config.shop
    const token = await accessToken(conn)
    const base = clean(conn.siteUrl) || (await storeUrl(shop, token))
    const note = input.jsonld?.length ? "Shopify's theme adds its own structured data; the extra schema wasn't added." : undefined

    if (input.kind === "post") {
      if (!conn.config.blogId) throw new Error("No Shopify blog is linked. Please reconnect your store.")
      const article: Record<string, unknown> = {
        blogId: conn.config.blogId,
        title: input.title,
        body: input.html,
        isPublished: true,
        author: { name: conn.config.author || "Alphaa" },
      }
      if (input.excerpt) article.summary = input.excerpt
      if (input.slug) article.handle = input.slug
      if (input.image?.url) article.image = { url: input.image.url, altText: input.image.alt }
      const d = await gql<{ articleCreate: { article: { id: string; handle: string; blog: { handle: string } } | null; userErrors: UserError[] } }>(
        shop,
        token,
        `mutation($article: ArticleCreateInput!) { articleCreate(article: $article) { article { ${ARTICLE_FIELDS} } userErrors { field message } } }`,
        { article },
      )
      check("publish the blog post", d.articleCreate.userErrors)
      const a = d.articleCreate.article
      if (!a) throw new Error("Shopify didn't create the blog post.")
      return { id: `article:${a.id}`, url: `${base}/blogs/${a.blog.handle}/${a.handle}`, note }
    }

    const page: Record<string, unknown> = { title: input.title, body: input.html, isPublished: true }
    if (input.slug) page.handle = input.slug
    const d = await gql<{ pageCreate: { page: { id: string; handle: string; onlineStoreUrl: string | null } | null; userErrors: UserError[] } }>(
      shop,
      token,
      `mutation($page: PageCreateInput!) { pageCreate(page: $page) { page { ${PAGE_FIELDS} } userErrors { field message } } }`,
      { page },
    )
    check("publish the page", d.pageCreate.userErrors)
    const p = d.pageCreate.page
    if (!p) throw new Error("Shopify didn't create the page.")
    return { id: `page:${p.id}`, url: p.onlineStoreUrl || `${base}/pages/${p.handle}`, note }
  },

  async undo(conn: SiteConnection, id: string): Promise<void> {
    const meta = META_RE.exec(id)
    if (meta) {
      // Put back the SEO title/description that were there before (or remove ours if there were none).
      const [, ownerId, packed] = meta
      const prev = JSON.parse(Buffer.from(packed, "base64url").toString("utf8")) as PrevSeo
      const token = await accessToken(conn)
      const keys = [["title_tag", prev.t], ["description_tag", prev.d]] as const
      const set = keys.filter(([, v]) => v).map(([key, value]) => ({ ownerId, namespace: "global", key, type: "single_line_text_field", value }))
      const del = keys.filter(([, v]) => !v).map(([key]) => ({ ownerId, namespace: "global", key }))
      if (set.length) {
        const d = await gql<{ metafieldsSet: { userErrors: UserError[] } }>(conn.config.shop, token, `mutation($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { key } userErrors { field message } } }`, { metafields: set })
        check("restore the search title and description", d.metafieldsSet.userErrors)
      }
      if (del.length) {
        const d = await gql<{ metafieldsDelete: { userErrors: UserError[] } }>(conn.config.shop, token, `mutation($metafields: [MetafieldIdentifierInput!]!) { metafieldsDelete(metafields: $metafields) { deletedMetafields { key } userErrors { field message } } }`, { metafields: del })
        check("restore the search title and description", d.metafieldsDelete.userErrors)
      }
      return
    }
    const { kind, gid } = splitId(id)
    const token = await accessToken(conn)
    if (kind === "article") {
      const d = await gql<{ articleUpdate: { userErrors: UserError[] } }>(
        conn.config.shop,
        token,
        `mutation($id: ID!, $article: ArticleUpdateInput!) { articleUpdate(id: $id, article: $article) { article { id } userErrors { field message } } }`,
        { id: gid, article: { isPublished: false } },
      )
      check("unpublish the blog post", d.articleUpdate.userErrors)
    } else {
      const d = await gql<{ pageUpdate: { userErrors: UserError[] } }>(
        conn.config.shop,
        token,
        `mutation($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { page { id } userErrors { field message } } }`,
        { id: gid, page: { isPublished: false } },
      )
      check("unpublish the page", d.pageUpdate.userErrors)
    }
  },

  async updateMeta(conn: SiteConnection, input: MetaInput): Promise<PublishResult> {
    const shop = conn.config.shop
    const target = matchShopifyPath(input.url)

    if (target.type === "home") {
      // The homepage title/description (Online Store → Preferences) isn't exposed by the Admin API.
      return {
        id: "",
        url: input.url,
        note: "Shopify doesn't let apps change the homepage title and description. Set them in Shopify admin → Online Store → Preferences → Title and meta description.",
      }
    }
    if (target.type === "other") {
      return {
        id: "",
        url: input.url,
        note: "Alphaa can only change SEO titles on Shopify pages and blog posts. For this address, edit the Search engine listing in Shopify admin.",
      }
    }

    const token = await accessToken(conn)
    let ownerId: string
    if (target.type === "page") {
      const d = await gql<{ pages: { nodes: { id: string; handle: string }[] } }>(
        shop,
        token,
        `query($q: String!) { pages(first: 50, query: $q) { nodes { id handle } } }`,
        { q: `handle:'${target.handle.replace(/'/g, "")}'` },
      )
      const page = d.pages.nodes.find((p) => p.handle === target.handle)
      if (!page) throw new Error(`Couldn't find a Shopify page at /pages/${target.handle}.`)
      ownerId = page.id
    } else {
      const d = await gql<{ articles: { nodes: { id: string; handle: string; blog: { handle: string } }[] } }>(
        shop,
        token,
        `query($q: String!) { articles(first: 50, query: $q) { nodes { id handle blog { handle } } } }`,
        { q: `handle:'${target.handle.replace(/'/g, "")}'` },
      )
      const art = d.articles.nodes.find((a) => a.handle === target.handle && a.blog.handle === target.blog)
      if (!art) throw new Error(`Couldn't find a Shopify blog post at /blogs/${target.blog}/${target.handle}.`)
      ownerId = art.id
    }

    const metafields = seoMetafields(ownerId, input.title, input.description)
    if (!metafields.length) throw new Error("Both the title and the description are empty.")
    const before = await gql<{ node: { t?: { value: string } | null; d?: { value: string } | null } | null }>(
      shop,
      token,
      `query($id: ID!) { node(id: $id) { ... on HasMetafields { t: metafield(namespace: "global", key: "title_tag") { value } d: metafield(namespace: "global", key: "description_tag") { value } } } }`,
      { id: ownerId },
    )
    const prev: PrevSeo = { t: before.node?.t?.value ?? null, d: before.node?.d?.value ?? null }
    const d = await gql<{ metafieldsSet: { userErrors: UserError[] } }>(
      shop,
      token,
      `mutation($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { key } userErrors { field message } } }`,
      { metafields },
    )
    check("update the search title and description", d.metafieldsSet.userErrors)
    // "meta:" so undo() never mistakes this for a publish; the old values ride along for Undo.
    return { id: `meta:${ownerId}:${Buffer.from(JSON.stringify(prev)).toString("base64url")}`, url: input.url }
  },
}
