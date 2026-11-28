// Content gaps vs one competitor, from what their pages REALLY say (rebuilt 2026-11-28; before,
// Claude guessed what a competitor "likely" covers from its URL). Steps:
//   1. Read the competitor's sitemap and the owner's (lib/page-reader.ts, robots.txt respected).
//   2. Read up to 6 of the competitor's content pages (title, headings, word count, words; 800 KB
//      and 10 s per page).
//   3. Claude (structured output) lists pages they have that the owner's site doesn't, each tied
//      to one of THEIR pages by id; a gap that cites no real page is dropped.
// Every gap stores its benchmark (their URL, title, word count, headings, what it covers), which
// the brief (lib/content-brief.ts) and the writer use. Nothing read = no gaps (never a guess).
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { claudeFor } from "@/lib/claude"
import { hostOf, pickCompetitorPages, readArticle, readSitemap, slugTitle, withHttps, type Article } from "@/lib/page-reader"

const anthropic = claudeFor("content-gaps")
const MODEL = "claude-sonnet-5-5"
const MAX_READ = 6

export type GapItem = {
  topic: string
  priority: "high" | "medium" | "low"
  suggestedTitle: string
  suggestedOutline: string[]
  estimatedImpact: string
  /** The competitor page this gap comes from (since 2026-11-28; older rows have none). */
  sourceUrl?: string
  sourceTitle?: string
  /** Word count and headings of their page, when it was read (not just listed in their sitemap). */
  sourceWords?: number
  sourceHeadings?: string[]
  /** What their page covers, from its own headings. */
  covers?: string[]
  read?: boolean
}

export type GapResult = { gaps: GapItem[]; summary: string; read: number; pages: { url: string; title: string; words: number }[] }

const Schema = z.object({
  summary: z.string().describe("2-3 plain sentences: the main content opportunity vs this competitor, based only on the pages listed"),
  gaps: z.array(z.object({
    source: z.string().describe("Id of THEIR page this gap comes from: P1..Pn (read pages) or S1..Sn (sitemap titles)"),
    topic: z.string().describe("Short topic name"),
    priority: z.enum(["high", "medium", "low"]),
    suggestedTitle: z.string().describe("Title for the owner's own page, under 65 characters, never naming the competitor"),
    suggestedOutline: z.array(z.string()).describe("3-6 section headings for the owner's page, phrased as questions where natural"),
    covers: z.array(z.string()).describe("What their page covers, taken from its headings (for S pages: an empty list)"),
  })).describe("4-8 gaps"),
})

export async function analyzeContentGaps(userUrl: string, competitorUrl: string, businessName: string, businessType: string, city: string): Promise<GapResult> {
  // Empty-city guard: never interpolate an unset city ("Services in | Business", 2026-10).
  const locality = city.trim()
  const rivalHost = hostOf(competitorUrl) ?? competitorUrl
  const [theirs, mine, theirHome, myHome] = await Promise.all([
    readSitemap(competitorUrl, 400),
    readSitemap(userUrl, 400),
    readArticle(withHttps(competitorUrl), 2000),
    readArticle(withHttps(userUrl), 2000),
  ])
  // No sitemap: the links on their homepage are the page list.
  const theirUrls = theirs.urls.length ? theirs.urls : theirHome.ok ? theirHome.page.links.map((l) => ({ url: l.url })) : []
  const picks = pickCompetitorPages(theirUrls, { max: MAX_READ * 2, topic: `${businessType} ${locality}` })
  const read: Article[] = []
  for (let i = 0; i < picks.length && read.length < MAX_READ; i += 3) {
    const batch = await Promise.all(picks.slice(i, i + 3).map((p) => readArticle(p.url, 1500)))
    for (const r of batch) if (r.ok && read.length < MAX_READ) read.push(r.page)
  }
  if (!read.length) {
    return { gaps: [], summary: `I couldn’t read ${rivalHost}’s pages (their site blocked me or didn’t answer), so I didn’t guess what they cover.`, read: 0, pages: [] }
  }
  const listed = pickCompetitorPages(theirUrls, { max: 60, topic: `${businessType} ${locality}` }).filter((p) => !read.some((r) => r.url.replace(/\/+$/, "") === p.url.replace(/\/+$/, "")) && p.title.length > 6)
  const myPages = [
    ...(mine.urls.length ? mine.urls : myHome.ok ? myHome.page.links.map((l) => ({ url: l.url })) : []).map((u) => slugTitle(u.url)).filter((t) => t.length > 3),
    ...(myHome.ok ? myHome.page.headings.map((h) => h.text) : []),
  ].slice(0, 150)

  const pageBlock = read.map((p, i) => [
    `P${i + 1}: ${p.url}`,
    `  Title: ${p.title || p.h1}`,
    `  ${p.words} words. Headings: ${p.headings.map((h) => (h.level === 3 ? `  - ${h.text}` : h.text)).slice(0, 25).join(" | ") || "(none)"}`,
    `  Opening words: ${p.text.slice(0, 500)}`,
  ].join("\n")).join("\n\n")
  const prompt = `Find the content gaps between a business's website and one competitor's, using ONLY the competitor pages listed below (I read them today).

THE BUSINESS
Name: ${businessName}
Type: ${businessType}${locality ? `\nCity: ${locality}` : ""}
Website: ${userUrl}
Pages already on their site (from their sitemap and homepage): ${myPages.length ? myPages.join("; ") : "(couldn't read the list)"}

THE COMPETITOR (${rivalHost})
Pages I read:
${pageBlock}
${listed.length ? `\nOther pages in their sitemap (title from the address only):\n${listed.map((p, i) => `S${i + 1}: ${p.title}`).join("\n")}` : ""}

Rules:
- Each gap must come from one of THEIR pages above (cite its id) and be something the business's own page list doesn't already cover.
- Only topics that fit what this business sells and that its customers search for. Skip their case studies about named clients, job posts, legal pages and news about the competitor itself.
- Never name the competitor in a title or outline. ${locality ? `Use "${locality}" in a title only where the business serves that area.` : "The business location is not known: no city or region in titles."}
- Don't invent facts, prices or statistics. Prefer P pages (read) over S pages.`

  try {
    const msg = await anthropic.messages.parse({ model: MODEL, max_tokens: 3000, output_config: { format: zodOutputFormat(Schema) }, messages: [{ role: "user", content: prompt }] })
    const out = msg.stop_reason === "refusal" ? null : msg.parsed_output
    if (!out) throw new Error("no output")
    const gaps: GapItem[] = []
    const seen = new Set<string>()
    for (const g of out.gaps) {
      const m = g.source.trim().match(/^([PS])(\d+)$/i)
      if (!m) continue
      const i = Number(m[2]) - 1
      const page = m[1].toUpperCase() === "P" ? read[i] : null
      const listedPage = m[1].toUpperCase() === "S" ? listed[i] : null
      if (!page && !listedPage) continue // cites nothing real: dropped
      const title = g.suggestedTitle.trim() || g.topic.trim()
      if (!title || seen.has(title.toLowerCase()) || new RegExp(rivalHost.split(".")[0], "i").test(title)) continue
      seen.add(title.toLowerCase())
      gaps.push({
        topic: g.topic.trim(),
        priority: g.priority,
        suggestedTitle: title.slice(0, 90),
        suggestedOutline: g.suggestedOutline.map((x) => x.trim()).filter(Boolean).slice(0, 6),
        // Said in code from what I read, never a forecast.
        estimatedImpact: page ? `${rivalHost} has a ${page.words.toLocaleString("en-US")}-word page on this (“${(page.title || page.h1).slice(0, 80)}”) and your site doesn’t have one yet.` : `${rivalHost} lists a page on this in their sitemap and your site doesn’t have one yet.`,
        sourceUrl: page?.url ?? listedPage!.url,
        sourceTitle: (page?.title || page?.h1 || listedPage?.title || "").slice(0, 160),
        ...(page ? { sourceWords: page.words, sourceHeadings: page.headings.map((h) => h.text).slice(0, 20), read: true } : { read: false }),
        covers: page ? g.covers.map((c) => c.trim()).filter(Boolean).slice(0, 8) : [],
      })
    }
    return { gaps: gaps.slice(0, 8), summary: out.summary.trim(), read: read.length, pages: read.map((p) => ({ url: p.url, title: p.title, words: p.words })) }
  } catch (err) {
    console.error("analyzeContentGaps error:", err instanceof Error ? err.message : err)
    return { gaps: [], summary: `I read ${read.length} of ${rivalHost}’s pages but couldn’t finish the comparison. Try again in a minute.`, read: read.length, pages: read.map((p) => ({ url: p.url, title: p.title, words: p.words })) }
  }
}
