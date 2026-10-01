// /llms.txt = the hand-written summary in src/content/llms-base.txt plus an
// auto-generated "All guides" list built from getAllPosts(), so every new blog
// post is listed without editing anything. Curated sections (Key guides,
// Comparisons, Original research) stay hand-edited in llms-base.txt.
// Prerendered at build time.
import { readFileSync } from "fs"
import path from "path"
import { getAllPosts } from "@/content/blog"

export const dynamic = "force-static"

export function GET() {
  const base = readFileSync(path.join(process.cwd(), "src/content/llms-base.txt"), "utf8").trimEnd()
  const list = getAllPosts()
    .map(({ meta }) => `- [${meta.title}](https://alphaa.app/blog/${meta.slug}): ${meta.subtitle ?? meta.description}`)
    .join("\n")
  const body = `${base}\n\n## All guides\n\nEvery article on the Alphaa blog, newest first. Also available as RSS: https://alphaa.app/blog/rss.xml\n\n${list}\n`
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  })
}
