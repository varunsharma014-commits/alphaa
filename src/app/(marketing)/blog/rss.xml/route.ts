// RSS 2.0 feed of every blog post — new posts appear automatically because it
// reads getAllPosts(). Prerendered at build (posts only change on deploy).
import { getAllPosts } from "@/content/blog"

export const dynamic = "force-static"

const SITE = "https://alphaa.app"

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

const rfc822 = (iso: string) => new Date(iso + "T12:00:00Z").toUTCString()

export function GET() {
  const posts = getAllPosts()
  const items = posts
    .map(({ meta }) => {
      const url = `${SITE}/blog/${meta.slug}`
      const enclosure = meta.image
        ? `\n      <enclosure url="${esc(SITE + meta.image.src)}" type="image/${meta.image.src.split(".").pop() === "webp" ? "webp" : "jpeg"}" length="0" />`
        : ""
      return `    <item>
      <title>${esc(meta.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(meta.date)}</pubDate>
      <description>${esc(meta.subtitle ? `${meta.subtitle} ${meta.description}` : meta.description)}</description>${meta.tag ? `\n      <category>${esc(meta.tag)}</category>` : ""}${enclosure}
    </item>`
    })
    .join("\n")
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Alphaa blog</title>
    <link>${SITE}/blog</link>
    <description>Plain-English guides on getting your business recommended by ChatGPT, Gemini, Claude and Perplexity.</description>
    <language>en</language>
    <lastBuildDate>${posts[0] ? rfc822(posts[0].meta.updated && posts[0].meta.updated > posts[0].meta.date ? posts[0].meta.updated : posts[0].meta.date) : new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  })
}
