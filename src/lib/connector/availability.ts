// Which website platforms can actually be connected right now. A platform is
// "available" only when its app credentials are set; everything else shows as
// "Coming soon". Server-only (reads env); the UI gets this via the API.
import type { Availability } from "./platforms"

export function platformAvailability(): Availability {
  const has = (...keys: string[]) => keys.every((k) => !!process.env[k])
  return {
    wordpress: true, // the plugin needs no app registration
    webflow: has("WEBFLOW_CLIENT_ID", "WEBFLOW_CLIENT_SECRET"),
    shopify: has("SHOPIFY_API_KEY", "SHOPIFY_API_SECRET"),
    wix: has("WIX_APP_ID", "WIX_APP_SECRET"),
  }
}
