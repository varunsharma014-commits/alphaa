// Client-safe facts about the website platforms Alphaa connects to. Whether a
// platform is switched on depends on server env vars: see ./availability.ts.
import type { Block, Chip } from "@/lib/agent/types"
import type { Platform } from "./types"

export const PLATFORMS: Platform[] = ["wordpress", "shopify", "webflow", "wix"]

export const PLATFORM_NAME: Record<Platform, string> = { wordpress: "WordPress", webflow: "Webflow", shopify: "Shopify", wix: "Wix" }

export type Availability = Record<Platform, boolean>

export const NONE_AVAILABLE: Availability = { wordpress: true, webflow: false, shopify: false, wix: false }

/** The "which website builder?" message: one logo button per platform, unavailable ones marked Coming soon. */
export function platformPickerBlocks(available: Availability, lead = "Which website builder is your site on?"): Block[] {
  const fallback: Chip = {
    label: "Something else",
    action: { type: "say", text: "No problem. Tap “Email it to my web person” on any fix and I’ll send them the exact change, where it goes and how to check it. Or our team can do it for you on Full Service." },
  }
  return [
    { kind: "text", text: lead },
    { kind: "platforms", items: PLATFORMS.map((platform) => ({ platform, available: available[platform] })) },
    { kind: "text", text: "Not sure, or someone else runs your site? I can email your web person the exact change instead. Nothing goes live until you approve it, and every change has an Undo." },
    { kind: "chips", items: [fallback] },
  ]
}
