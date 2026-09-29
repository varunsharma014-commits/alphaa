// Webflow connector (Data API v2, OAuth app).
// Docs: https://developers.webflow.com/data/reference/oauth-app
//       https://developers.webflow.com/data/reference/cms/collection-items/live-items/create-item-live
//       https://developers.webflow.com/data/reference/cms/collection-items/live-items/delete-item-live
//       https://developers.webflow.com/data/reference/pages-and-components/pages/update-page-settings
import { decryptSecret } from "@/lib/checks/bing-webmaster"
import type { MetaInput, PublishInput, PublishResult, SiteConnection, SiteConnector } from "./types"

const API = "https://api.webflow.com/v2"
export const WEBFLOW_SCOPES = ["sites:read", "cms:read", "cms:write", "pages:read", "pages:write"]

export const webflowRedirectUri = () => `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/connect/webflow/callback`

// ---------------------------------------------------------------------------
// HTTP

async function wf<T>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(20_000),
    })
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")
    throw new Error(timeout ? "Webflow took too long to answer. Try again in a minute." : "Couldn’t reach Webflow. Try again in a minute.")
  }
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) throw new Error(webflowErrorMessage(res.status, data))
  return data as T
}

export function webflowErrorMessage(status: number, data: unknown): string {
  const d = (data ?? {}) as { message?: string; msg?: string; details?: unknown[]; error_description?: string }
  const msg = d.message || d.msg || d.error_description || ""
  const details = Array.isArray(d.details)
    ? d.details
        .map((x) => (typeof x === "string" ? x : (x as { message?: string })?.message || ""))
        .filter(Boolean)
        .join("; ")
    : ""
  const said = [msg, details].filter(Boolean).join(" — ")
  const lead =
    status === 401 || status === 403
      ? "Webflow refused the request — the connection may have been removed or is missing a permission. Reconnect Webflow."
      : status === 404
        ? "Webflow couldn’t find that item — it may have been deleted in Webflow."
        : status === 429
          ? "Webflow is rate-limiting us. Try again in a minute."
          : `Webflow answered ${status}.`
  return said ? `${lead} Webflow said: ${said}` : lead
}

function accessToken(conn: SiteConnection): string {
  const { accessToken } = JSON.parse(decryptSecret(conn.tokenEnc)) as { accessToken?: string }
  if (!accessToken) throw new Error("The Webflow connection is missing its access token. Reconnect Webflow.")
  return accessToken
}

// ---------------------------------------------------------------------------
// OAuth

export function webflowAuthUrl(state: string): string {
  const u = new URL("https://webflow.com/oauth/authorize")
  u.searchParams.set("response_type", "code")
  u.searchParams.set("client_id", process.env.WEBFLOW_CLIENT_ID ?? "")
  u.searchParams.set("redirect_uri", webflowRedirectUri())
  u.searchParams.set("scope", WEBFLOW_SCOPES.join(" "))
  u.searchParams.set("state", state)
  return u.toString()
}

export async function webflowExchange(code: string): Promise<{ accessToken: string }> {
  let res: Response
  try {
    res = await fetch("https://api.webflow.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.WEBFLOW_CLIENT_ID,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: webflowRedirectUri(),
      }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new Error("Couldn’t reach Webflow to finish connecting. Try again.")
  }
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string }
  if (!res.ok || !data.access_token) {
    const said = data.error_description || data.error
    throw new Error(`Webflow didn’t accept the sign-in${said ? ` (${said})` : ""}. Try connecting again.`)
  }
  return { accessToken: data.access_token }
}

/**
 * Best effort: tell Webflow to drop this token. Webflow documents the revoke endpoint for its
 * OAuth apps; if it fails we still forget the token on our side.
 */
export async function webflowRevoke(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.webflow.com/oauth/revoke_authorization", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: process.env.WEBFLOW_CLIENT_ID, client_secret: process.env.WEBFLOW_CLIENT_SECRET, access_token: accessToken }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok
  } catch {
    return false
  }
}

export function webflowToken(conn: SiteConnection): string | null {
  try {
    return accessToken(conn)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)

export type WfSite = { id: string; displayName?: string; shortName?: string; customDomains?: { id: string; url: string }[] }
export type WfCollection = { id: string; displayName?: string; singularName?: string; slug?: string }
export type WfField = { id?: string; slug: string; type: string; displayName?: string; isRequired?: boolean; isEditable?: boolean }
export type WfPage = {
  id: string
  slug?: string | null
  parentId?: string | null
  collectionId?: string | null
  publishedPath?: string | null
  draft?: boolean
  archived?: boolean
}
export type WfFields = { name: string; slug: string; body: string; excerpt?: string; image?: string; imageAlt?: string; collectionSlug: string }

const norm = (s: string) => s.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")

/** Public address for a site: first custom domain (prefer non-www match), else <shortName>.webflow.io. */
export function siteAddress(site: WfSite): { siteUrl: string; label: string } {
  const custom = (site.customDomains ?? []).map((d) => d.url).filter(Boolean)
  const host = custom.find((h) => h.startsWith("www.")) ?? custom[0] ?? `${site.shortName}.webflow.io`
  const clean = host.replace(/^https?:\/\//, "").replace(/\/+$/, "")
  return { siteUrl: `https://${clean}`, label: custom[0] ? norm(custom[0]) : clean }
}

export function pickSite(sites: WfSite[], preferredHost: string | null): WfSite | null {
  if (!sites.length) return null
  if (preferredHost) {
    const want = norm(preferredHost)
    const byDomain = sites.find((s) => (s.customDomains ?? []).some((d) => norm(d.url) === want))
    if (byDomain) return byDomain
    const byShort = sites.find((s) => s.shortName && (want === `${s.shortName}.webflow.io` || want.split(".")[0] === s.shortName))
    if (byShort) return byShort
  }
  return sites[0]
}

const BLOG_RE = /\b(blog|blogs|post|posts|article|articles|news|journal|insights?|stories)\b/i
const words = (c: WfCollection) => [c.slug, c.displayName, c.singularName].filter(Boolean).join(" ").replace(/[-_]/g, " ")

/** Blog-looking collection first (by slug/name), else first collection that has a RichText field. */
export function pickBlogCollection(cols: { col: WfCollection; fields: WfField[] }[]): { col: WfCollection; fields: WfField[] } | null {
  const hasRich = (f: WfField[]) => f.some((x) => x.type === "RichText")
  return cols.find((c) => BLOG_RE.test(words(c.col)) && hasRich(c.fields)) ?? cols.find((c) => hasRich(c.fields)) ?? null
}

/** Map a collection schema to the field slugs we write. Null if there's no RichText body. */
export function detectFields(fields: WfField[], collectionSlug: string): WfFields | null {
  const editable = fields.filter((f) => f.isEditable !== false)
  const label = (f: WfField) => `${f.slug} ${f.displayName ?? ""}`.toLowerCase()
  const riches = editable.filter((f) => f.type === "RichText")
  if (!riches.length) return null
  const body = riches.find((f) => /body|content|post|article|text/.test(label(f))) ?? riches[0]
  const plain = editable.filter((f) => f.type === "PlainText" && f.slug !== "name" && f.slug !== "slug")
  const excerpt = plain.find((f) => /summary|excerpt|description|intro|teaser|subtitle|snippet/.test(label(f)))
  const images = editable.filter((f) => f.type === "Image")
  const image = images.find((f) => /main|feature|hero|cover|thumbnail|header|post/.test(label(f))) ?? images[0]
  const imageAlt = plain.find((f) => /\balt\b/.test(label(f)) && f !== excerpt)
  const name = fields.find((f) => f.slug === "name")?.slug ?? "name"
  const slug = fields.find((f) => f.slug === "slug")?.slug ?? "slug"
  return {
    name,
    slug,
    body: body.slug,
    ...(excerpt ? { excerpt: excerpt.slug } : {}),
    ...(image ? { image: image.slug } : {}),
    ...(image && imageAlt ? { imageAlt: imageAlt.slug } : {}),
    collectionSlug,
  }
}

const trimPath = (p: string) => p.replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/^\/+/, "").toLowerCase()

/** Find the static page for a URL path. Home = no parent and slug "" / "index" (or publishedPath "/"). */
export function findPageId(pages: WfPage[], urlOrPath: string): string | null {
  let path = urlOrPath
  try {
    path = new URL(urlOrPath).pathname
  } catch {
    /* already a path */
  }
  const want = trimPath(decodeURIComponent(path))
  const live = pages.filter((p) => !p.collectionId && !p.archived)
  if (!want || want === "index" || want === "index.html") {
    const home =
      live.find((p) => !p.parentId && (p.slug === "" || p.slug === "index" || p.slug == null)) ??
      live.find((p) => p.publishedPath === "/" || p.publishedPath === "/index")
    return home?.id ?? null
  }
  const byPath = live.find((p) => p.publishedPath && trimPath(p.publishedPath) === want)
  if (byPath) return byPath.id
  // No publishedPath: rebuild from slug + parent chain (folders are pages-by-id when listed).
  const byId = new Map(pages.map((p) => [p.id, p]))
  const fullPath = (p: WfPage) => {
    const parts: string[] = []
    let cur: WfPage | undefined = p
    for (let i = 0; cur && i < 10; i++) {
      if (cur.slug) parts.unshift(cur.slug)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
    return parts.join("/").toLowerCase()
  }
  const byChain = live.find((p) => fullPath(p) === want)
  if (byChain) return byChain.id
  // Last resort: unique match on the final slug segment.
  const last = want.split("/").pop()
  const bySlug = live.filter((p) => (p.slug ?? "").toLowerCase() === last)
  return bySlug.length === 1 ? bySlug[0].id : null
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

// ---------------------------------------------------------------------------
// Setup (after OAuth)

export async function webflowSetup(
  accessToken: string,
  preferredHost: string | null,
): Promise<{ siteUrl: string; label: string; config: { siteId: string; collectionId: string; fields: string } } | { error: string }> {
  try {
    const { sites = [] } = await wf<{ sites?: WfSite[] }>(accessToken, "/sites")
    const site = pickSite(sites, preferredHost)
    if (!site) return { error: "We couldn’t find a Webflow site on that account. Make sure you picked a site when you approved Alphaa." }
    const { collections = [] } = await wf<{ collections?: WfCollection[] }>(accessToken, `/sites/${site.id}/collections`)
    if (!collections.length) return { error: `Your Webflow site “${site.displayName ?? site.shortName}” has no CMS collections. Add a Blog collection in Webflow, then connect again.` }
    // Check blog-looking collections first to keep calls down.
    const ordered = [...collections.filter((c) => BLOG_RE.test(words(c))), ...collections.filter((c) => !BLOG_RE.test(words(c)))]
    const withFields: { col: WfCollection; fields: WfField[] }[] = []
    for (const col of ordered.slice(0, 10)) {
      const full = await wf<{ fields?: WfField[]; slug?: string }>(accessToken, `/collections/${col.id}`)
      withFields.push({ col: { ...col, slug: full.slug ?? col.slug }, fields: full.fields ?? [] })
      if (BLOG_RE.test(words(col)) && (full.fields ?? []).some((f) => f.type === "RichText")) break
    }
    const picked = pickBlogCollection(withFields)
    const fields = picked && detectFields(picked.fields, picked.col.slug ?? "blog")
    if (!picked || !fields) return { error: "None of your Webflow collections has a rich-text body field, so there’s nowhere to publish posts. Add a Blog collection in Webflow, then connect again." }
    const { siteUrl, label } = siteAddress(site)
    return { siteUrl, label, config: { siteId: site.id, collectionId: picked.col.id, fields: JSON.stringify(fields) } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn’t read your Webflow site." }
  }
}

// ---------------------------------------------------------------------------
// Connector

function fieldsOf(conn: SiteConnection): WfFields {
  try {
    return JSON.parse(conn.config.fields) as WfFields
  } catch {
    throw new Error("The Webflow connection is missing its blog settings. Reconnect Webflow.")
  }
}

type WfFieldFull = WfField & { validations?: { collectionId?: string; options?: { id: string; name?: string }[] } }

/**
 * Owners' blog collections often have extra required fields (a category reference, an option,
 * a date). Fill each one we didn't set with the most sensible value so the publish isn't
 * rejected; anything we can't fill gets a plain error naming the field.
 */
async function fillRequired(
  token: string,
  collectionId: string,
  fieldData: Record<string, unknown>,
  ctx: { title: string; html: string; excerpt?: string; siteUrl: string },
): Promise<void> {
  const col = await wf<{ fields?: WfFieldFull[] }>(token, `/collections/${collectionId}`)
  for (const f of col.fields ?? []) {
    if (fieldData[f.slug] !== undefined) continue
    // Also stamp an optional publish date — templates often show it.
    if (!f.isRequired && !(f.type === "DateTime" && /date|publish/i.test(f.slug))) continue
    switch (f.type) {
      case "PlainText":
        fieldData[f.slug] = (ctx.excerpt || ctx.title).slice(0, 256)
        break
      case "RichText":
        fieldData[f.slug] = ctx.html
        break
      case "DateTime":
        fieldData[f.slug] = new Date().toISOString()
        break
      case "Switch":
        fieldData[f.slug] = false
        break
      case "Number":
        fieldData[f.slug] = 0
        break
      case "Link":
      case "VideoLink":
        fieldData[f.slug] = ctx.siteUrl
        break
      case "Option": {
        const opt = f.validations?.options?.[0]
        if (opt) fieldData[f.slug] = opt.id
        break
      }
      case "Reference":
      case "MultiReference": {
        const ref = f.validations?.collectionId
        if (!ref) break
        const r = await wf<{ items?: { id: string; fieldData?: { name?: string } }[] }>(token, `/collections/${ref}/items?limit=100`)
        const items = r.items ?? []
        const pick = items.find((i) => /blog|news|general|article|update/i.test(i.fieldData?.name ?? "")) ?? items[0]
        if (pick) fieldData[f.slug] = f.type === "MultiReference" ? [pick.id] : pick.id
        break
      }
    }
    if (f.isRequired && fieldData[f.slug] === undefined) {
      throw new Error(`Your Webflow blog needs “${f.displayName || f.slug}” filled in on every post, and Alphaa can’t choose one for you. Add at least one option for it in Webflow, or make it optional.`)
    }
  }
}

const STAGED_NOTE = "Your Webflow site isn’t published yet, so this is saved in your CMS and goes live the next time you publish the site."
const PAGE_NOTE = "Webflow can’t create standalone pages through its API, so this went into your blog collection."

type WfItem = { id: string; fieldData?: { slug?: string } }

export const webflow: SiteConnector = {
  async ping(conn: SiteConnection): Promise<void> {
    await wf<unknown>(accessToken(conn), `/sites/${conn.config.siteId}`)
  },

  async publish(conn: SiteConnection, input: PublishInput): Promise<PublishResult> {
    const token = accessToken(conn)
    const f = fieldsOf(conn)
    const collectionId = conn.config.collectionId
    const slug = slugify(input.slug || input.title)
    const fieldData: Record<string, unknown> = { [f.name]: input.title, [f.slug]: slug, [f.body]: input.html }
    if (f.excerpt && input.excerpt) fieldData[f.excerpt] = input.excerpt.slice(0, 256)
    if (f.image && input.image?.url) {
      fieldData[f.image] = { url: input.image.url, alt: input.image.alt }
      if (f.imageAlt) fieldData[f.imageAlt] = input.image.alt
    }
    await fillRequired(token, collectionId, fieldData, { title: input.title, html: input.html, excerpt: input.excerpt, siteUrl: conn.siteUrl })
    const body = { isArchived: false, isDraft: false, fieldData }
    let item: WfItem
    let staged = false
    try {
      item = await wf<WfItem>(token, `/collections/${collectionId}/items/live`, { method: "POST", body })
    } catch (e) {
      // A site that has never been published can't take live items (409 "The site is not
      // published"). Save it to the CMS instead; it goes live with the owner's next site publish.
      if (!(e instanceof Error && /not published/i.test(e.message))) throw e
      item = await wf<WfItem>(token, `/collections/${collectionId}/items`, { method: "POST", body })
      staged = true
    }
    const finalSlug = item.fieldData?.slug || slug
    const base = conn.siteUrl.replace(/\/+$/, "")
    const notes = [staged ? STAGED_NOTE : "", input.kind === "page" ? PAGE_NOTE : ""].filter(Boolean)
    return {
      id: staged ? `staged:${item.id}` : item.id,
      url: `${base}/${f.collectionSlug}/${finalSlug}`,
      ...(notes.length ? { note: notes.join(" ") } : {}),
    }
  },

  /** Unpublish the live item; Webflow keeps it as a draft (isDraft: true). Never deletes. */
  async undo(conn: SiteConnection, id: string): Promise<void> {
    const token = accessToken(conn)
    const meta = /^meta:([^:]+):([A-Za-z0-9_-]*)$/.exec(id)
    if (meta) {
      // A page-title change: put back the SEO title/description that were there before.
      const prev = JSON.parse(Buffer.from(meta[2], "base64url").toString("utf8")) as { title?: string | null; description?: string | null }
      await wf<unknown>(token, `/pages/${encodeURIComponent(meta[1])}`, { method: "PUT", body: { seo: { ...(prev.title ? { title: prev.title } : {}), description: prev.description ?? "" } } })
      return
    }
    const staged = /^staged:(.+)$/.exec(id)
    if (staged) {
      // Never went live: turn it back into a draft so the next site publish skips it.
      await wf<unknown>(token, `/collections/${conn.config.collectionId}/items/${encodeURIComponent(staged[1])}`, { method: "PATCH", body: { isDraft: true } })
      return
    }
    await wf<unknown>(token, `/collections/${conn.config.collectionId}/items/${encodeURIComponent(id)}/live`, { method: "DELETE" })
  },

  async updateMeta(conn: SiteConnection, input: MetaInput): Promise<PublishResult> {
    const token = accessToken(conn)
    const pages: WfPage[] = []
    for (let offset = 0; offset < 1000; offset += 100) {
      const r = await wf<{ pages?: WfPage[]; pagination?: { total?: number } }>(token, `/sites/${conn.config.siteId}/pages?limit=100&offset=${offset}`)
      pages.push(...(r.pages ?? []))
      if (!r.pages?.length || pages.length >= (r.pagination?.total ?? 0)) break
    }
    const pageId = findPageId(pages, input.url)
    if (!pageId) throw new Error(`We couldn’t find a Webflow page for ${input.url}. Blog posts and other CMS pages get their SEO from the collection template in Webflow.`)
    const before = await wf<{ seo?: { title?: string | null; description?: string | null } }>(token, `/pages/${pageId}`)
    const packed = Buffer.from(JSON.stringify({ title: before.seo?.title ?? null, description: before.seo?.description ?? null })).toString("base64url")
    await wf<unknown>(token, `/pages/${pageId}`, {
      method: "PUT",
      body: { seo: { title: input.title, description: input.description } },
    })
    // Page settings are staged changes. Publishing the whole site would also push any unfinished
    // Designer work (and needs sites:write), so we leave that to the owner.
    return {
      id: `meta:${pageId}:${packed}`, // "meta:" so undo() restores the old title instead of unpublishing a CMS item
      url: input.url,
      note: "Saved in Webflow. It’ll show on your live site the next time you hit Publish in Webflow.",
    }
  },
}
