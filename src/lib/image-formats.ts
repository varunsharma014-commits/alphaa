// Social image sizes (client-safe, no Node imports). Every card style and the photo overlay can be
// drawn in each one (lib/social-card.ts, lib/photo-render.ts); lib/image-variants.ts makes the
// size each platform wants at posting time from the post's one picture.
//   square    1080×1080  1:1   the default picture of a post (Social Studio, Google, chat)
//   portrait  1080×1350  4:5   Instagram + Facebook feed
//   story     1080×1920  9:16  stories / reels covers; top 250px and bottom 340px stay clear of text
//   wide      1920×1080  16:9  YouTube-style and download
//   link      1200×675   16:9  LinkedIn / X link-style images (the 16:9 layout, drawn smaller)
export type ImageFormat = "square" | "portrait" | "story" | "wide" | "link"
export const IMAGE_FORMATS: ImageFormat[] = ["square", "portrait", "story", "wide", "link"]

/** The file each format is saved as. */
export const OUT_PX: Record<ImageFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
  wide: { w: 1920, h: 1080 },
  link: { w: 1200, h: 675 },
}
/** The canvas a text card is laid out on (link = the 16:9 layout, scaled down when saved). */
export const DESIGN_PX: Record<ImageFormat, { w: number; h: number }> = { ...OUT_PX, link: { w: 1920, h: 1080 } }

/** 9:16: where platform UI sits (profile row on top, reply bar at the bottom). No text there. */
export const STORY_SAFE = { top: 250, bottom: 340 }
export const safeZone = (f: ImageFormat) => (f === "story" ? STORY_SAFE : { top: 0, bottom: 0 })

export const FORMAT_NAME: Record<ImageFormat, string> = { square: "Square 1:1", portrait: "Portrait 4:5", story: "Story 9:16", wide: "Wide 16:9", link: "Link image 16:9" }

/** Where a post can appear (Social Studio's size switcher; lib/social/publish.ts uses `feed`). */
export type Placement = "feed" | "story"
/** The size I post for each platform. Google listing updates carry no picture today. */
export function formatForPlatform(platform: string, placement: Placement = "feed"): ImageFormat {
  if (placement === "story" || platform === "tiktok") return "story"
  if (platform === "instagram" || platform === "facebook") return "portrait"
  if (platform === "linkedin" || platform === "x") return "link"
  return "square"
}

/** Social Studio preview frames: the size, and roughly where each app cuts the caption with "more". */
export type PreviewSpot = { key: string; platform: "instagram" | "facebook" | "linkedin"; placement: Placement; label: string; format: ImageFormat; cut: number | null; more: string }
export const PREVIEW_SPOTS: PreviewSpot[] = [
  { key: "ig-feed", platform: "instagram", placement: "feed", label: "Instagram feed", format: "portrait", cut: 125, more: "… more" },
  { key: "ig-story", platform: "instagram", placement: "story", label: "Instagram story", format: "story", cut: null, more: "" },
  { key: "fb-feed", platform: "facebook", placement: "feed", label: "Facebook feed", format: "portrait", cut: 140, more: "… See more" },
  { key: "li-feed", platform: "linkedin", placement: "feed", label: "LinkedIn", format: "link", cut: 210, more: "…more" },
]

/** The caption as the app shows it before "more": cut at a word, or the whole text when it fits. */
export function captionCut(text: string, cut: number | null): { shown: string; cut: boolean } {
  const t = text.trim()
  if (cut == null || t.length <= cut) return { shown: t, cut: false }
  const head = t.slice(0, cut)
  const at = head.lastIndexOf(" ")
  return { shown: (at > cut * 0.6 ? head.slice(0, at) : head).replace(/[\s,;:.]+$/, ""), cut: true }
}
