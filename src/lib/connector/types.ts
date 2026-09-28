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

export interface SiteConnector {
  publish(conn: SiteConnection, input: PublishInput): Promise<PublishResult>
  /** Reverse a publish: unpublish/archive (never permanently delete). */
  undo(conn: SiteConnection, id: string): Promise<void>
  /** Change a page's SEO title + description, if the platform allows it. */
  updateMeta?(conn: SiteConnection, input: MetaInput): Promise<PublishResult>
  /** Cheapest authenticated read the platform offers; throws when the connection no longer works. */
  ping(conn: SiteConnection): Promise<void>
}
