// Shared contract for website connectors (WordPress plugin, Webflow, Shopify, Wix).
// Each platform module implements publish / undo / updateMeta against its API;
// the rest of the app only talks to this interface.

export type Platform = "wordpress" | "webflow" | "shopify" | "wix"

/** A connected site, as stored (encrypted tokens) in agent settings under `site`. */
export type SiteConnection = {
  platform: Exclude<Platform, "wordpress">
  siteUrl: string // public site address, e.g. https://brightsmile.com
  label: string // what the owner sees, e.g. "brightsmile.webflow.io" or "brightsmile.myshopify.com"
  tokenEnc: string // encryptSecret(JSON.stringify({ accessToken, refreshToken?, expiresAt? }))
  config: Record<string, string> // platform ids: siteId, collectionId, blogId, shop, instanceId …
  connectedAt: string
}

export type PublishInput = {
  kind: "post" | "page"
  title: string
  html: string // sanitized article HTML (h2/h3/p/ul/li/strong)
  excerpt?: string
  slug?: string
  jsonld?: object[] // structured data for the page, where the platform allows it
  image?: { url: string; alt: string } // public HTTPS URL of the featured image
}

export type PublishResult = { id: string; url: string; note?: string } // id is what undo() needs

export type MetaInput = { url: string; title: string; description: string }

/** Replace the content of a post/page that already exists at `url` (a refresh). Same URL/slug. */
export type UpdateInput = { url: string; title: string; html: string; excerpt?: string }

/** What the item looked like before an update, kept on the site_change row so Undo can put it back. */
export type ContentSnapshot = { title: string; html?: string; excerpt?: string | null; extra?: Record<string, unknown> }

/** id starts with "update:" so undo() is never mistaken for an unpublish. */
export type UpdateResult = { id: string; url: string; prev: ContentSnapshot; note?: string }

export interface SiteConnector {
  publish(conn: SiteConnection, input: PublishInput): Promise<PublishResult>
  /** Reverse a publish: unpublish/archive (never permanently delete). */
  undo(conn: SiteConnection, id: string): Promise<void>
  /** Change a page's SEO title + description, if the platform allows it. */
  updateMeta?(conn: SiteConnection, input: MetaInput): Promise<PublishResult>
  /** Update an existing post/page in place (refresh); throws a plain sentence when this URL can't be updated through the API. */
  update?(conn: SiteConnection, input: UpdateInput): Promise<UpdateResult>
  /** Undo an update: put the snapshot back on the same item. */
  restore?(conn: SiteConnection, id: string, prev: ContentSnapshot): Promise<void>
  /** Cheapest authenticated read the platform offers; throws when the connection no longer works. */
  ping(conn: SiteConnection): Promise<void>
}
