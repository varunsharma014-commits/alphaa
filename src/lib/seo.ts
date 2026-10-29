// Search-result hygiene shared by every marketing page's metadata.

export const SITE = "https://alphaa.app"

// Meta descriptions over ~160 characters get cut off mid-word in Google. Keep
// whole sentences while they fit; fall back to a word cut when that leaves too
// little. The on-page copy is never touched.
export function clipDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? []
  let out = ""
  for (const s of sentences) {
    if ((out + s).trim().length > max) break
    out += s
  }
  // A lone short first sentence makes a weak snippet; cut at a word instead.
  if (out.trim().length >= 100) return out.trim()
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]+$/, "")}…`
}

// Social/AI preview card for a page: /og renders the title onto the brand card.
export function ogImage(title: string, eyebrow?: string) {
  const q = new URLSearchParams({ title })
  if (eyebrow) q.set("eyebrow", eyebrow)
  return [{ url: `${SITE}/og?${q.toString()}`, width: 1200, height: 630, alt: title }]
}

// Full metadata for a marketing page: clipped description, self-canonical,
// and its own Open Graph/Twitter card. Without an explicit openGraph a page
// inherits the homepage's og:title and og:url, so shares of /pricing looked
// like shares of the homepage.
export function pageMeta(o: {
  title: string
  description: string
  path: string
  absolute?: boolean
  eyebrow?: string
  type?: "website" | "article"
  extra?: Record<string, unknown>
}) {
  const description = clipDescription(o.description)
  const images = ogImage(o.title, o.eyebrow)
  const url = `${SITE}${o.path === "/" ? "" : o.path}`
  return {
    title: o.absolute ? { absolute: o.title } : o.title,
    description,
    alternates: { canonical: o.path, ...((o.extra?.alternates as object) ?? {}) },
    openGraph: { title: o.title, description, url, siteName: "Alphaa", type: o.type ?? "website", images },
    twitter: { card: "summary_large_image" as const, title: o.title, description, images: images.map((i) => i.url) },
  }
}
