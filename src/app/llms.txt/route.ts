// /llms.txt = the hand-written summary in src/content/llms-base.txt plus an
// auto-generated "All guides" list built from getAllPosts(), so every new blog
// post is listed without editing anything. Curated sections (Key guides,
// Comparisons, Original research) stay hand-edited in llms-base.txt.
// Prerendered at build time.
import { readFileSync } from "fs"
import path from "path"
import { getAllPosts } from "@/content/blog"
import { MARKETS } from "@/content/locales"
import { GUIDES } from "@/content/markets/guides"

export const dynamic = "force-static"

export function GET() {
  const base = readFileSync(path.join(process.cwd(), "src/content/llms-base.txt"), "utf8").trimEnd()
  const list = getAllPosts()
    .map(({ meta }) => `- [${meta.title}](https://alphaa.app/blog/${meta.slug}): ${meta.subtitle ?? meta.description}`)
    .join("\n")
  // Local market pages, their trade pages and local-language guides.
  const markets = Object.values(MARKETS)
    .map((m) => {
      const g = GUIDES[m.copy.key]
      const lines = [
        `- [${m.copy.country}](https://alphaa.app${m.copy.path}) (${m.copy.lang}): ${m.copy.description}`,
        ...m.extra.industries.map((i) => `  - [${i.name}](https://alphaa.app${m.copy.path}/${i.slug}): ${i.description}`),
        ...g.guides.map((x) => `  - [${x.h1}](https://alphaa.app${m.copy.path}/${g.base}/${x.slug}): ${x.answer}`),
      ]
      return lines.join("\n")
    })
    .join("\n")
  const body = `${base}\n\n## Local markets\n\n${markets}\n\n## All guides\n\nEvery article on the Alphaa blog, newest first. Also available as RSS: https://alphaa.app/blog/rss.xml\n\n${list}\n`
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  })
}
