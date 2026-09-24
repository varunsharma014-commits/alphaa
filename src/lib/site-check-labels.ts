// Client-safe: keys and plain-English phrases for the nine site checks.
export type CheckKey = "llms" | "robots" | "sitemap" | "schema" | "faq" | "facts" | "blog" | "meta" | "speed"

export const CHECK_SHORT: Record<CheckKey, string> = {
  llms: "no llms.txt",
  robots: "AI can’t read your site at all",
  sitemap: "no sitemap",
  schema: "no structured facts",
  faq: "no FAQ",
  facts: "no phone, address or hours AI can read",
  blog: "nothing fresh for AI to quote",
  meta: "a weak title and description",
  speed: "a slow site",
}

