import type { ReactNode } from "react"

export type PostKind = "guide" | "comparison" | "glossary" | "listicle" | "industry" | "news"

export type PostSource = {
  title: string // the page's own title
  publisher: string // e.g. "Google Search Central", "OpenAI"
  url: string // absolute https URL to the primary/authoritative page
}

export type PostImage = {
  src: string // "/blog/<slug>.webp" (file lives in /public/blog/)
  alt: string
  width: number
  height: number
}

export type PostMeta = {
  slug: string
  title: string
  description: string
  date: string // ISO (YYYY-MM-DD)
  readMins: number
  tag?: string
  // ── Optional AI-citation fields (see marketing/content-engine-format.md).
  // All optional so older posts keep rendering exactly as before.
  subtitle?: string // one-sentence answer / dek shown under the H1
  image?: PostImage // hero image; also used in OG/Twitter + BlogPosting.image
  updated?: string // ISO (YYYY-MM-DD) of the last substantive update
  keyphrase?: string // primary target query
  sources?: PostSource[] // outbound citations, rendered as a numbered "Sources" list
  takeaways?: string[] // 3–5 short bullets for the "Key takeaways" box
  kind?: PostKind
}

export type Post = {
  meta: PostMeta
  Body: () => ReactNode
}
