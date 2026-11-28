// The BRIEF in BRIEF → WRITER (2026-11-28). Before a blog post is written, I plan it from real
// data and store the plan (MockActivity "content_brief", shown collapsible in the Draft it sheet):
//   target question + keyword, audience, search intent (informational / commercial /
//   transactional / local), the H2/H3 outline, key facts (ONLY sentences from the owner's own
//   site + profile + locations, picked by index, never rewritten), internal links (ONLY pages from
//   the owner's sitemap/homepage, picked by index), the competitor benchmark (their real page:
//   URL, title, word count, headings, what it covers) and FAQ questions (the AI questions I track
//   + the owner's Search Console queries + the competitor's own question headings).
// writePost (lib/content.ts) follows it and checks every number against it.
// Cost: one Sonnet 5.5 call (~$0.02, on the brand's AI ceiling via the usage meter) plus free
// page reads; a brief for the same topic is reused for 14 days.
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { getAgentSettings } from "@/lib/agent/settings"
import { latestQuestionScan } from "@/lib/questions"
import { readSiteFacts, type SiteFacts } from "@/lib/site-facts"
import { hostOf, pickCompetitorPages, readArticle, readSitemap, slugTitle, topicWords, withHttps, type Article } from "@/lib/page-reader"
import type { GapItem } from "@/lib/content-gaps"

const anthropic = claudeFor("content-brief")
const MODEL = "claude-sonnet-5-5"
export const BRIEF_TYPE = "content_brief"
const REUSE_MS = 14 * 86_400_000

export type Intent = "informational" | "commercial" | "transactional" | "local"
export type BriefFact = { text: string; source: string }
export type Benchmark = { url: string; host: string; title: string; words: number | null; headings: string[]; covers: string[]; read: boolean }
export type ContentBrief = {
  v: 1
  id?: string
  topic: string
  question: string
  keyword: string
  audience: string
  intent: Intent
  /** What to do better than the competitor's page, in one sentence. */
  angle: string
  outline: { h2: string; h3: string[] }[]
  facts: BriefFact[]
  internalLinks: { url: string; anchor: string; section: string }[]
  competitor: Benchmark | null
  faq: { q: string; source: "ai_question" | "search_console" | "competitor" | "writer" }[]
  wordTarget: number
  at: string
  gapId?: string | null
}

export type BriefContext = {
  topic: string
  business: { name: string; type: string; city: string; site: string | null }
  facts: BriefFact[]
  pages: { url: string; title: string }[]
  questions: { q: string; source: "ai_question" | "search_console" | "competitor" }[]
  competitor: Benchmark | null
  gap?: GapItem | null
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim()
const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200)

/** Sentences a reader could quote, from the words on a page. */
function sentences(text: string, max: number): string[] {
  return clean(text).split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map((s) => s.trim()).filter((s) => s.length >= 25 && s.length <= 240 && /[a-z]/.test(s) && /[.!?”"]$/.test(s) && !/cookie|javascript|©|all rights reserved/i.test(s)).slice(0, max)
}

/** Fact candidates: the profile, the locations, and sentences/prices from the site's own pages. */
export function factCandidates(user: Pick<User, "businessName" | "businessType" | "city" | "state" | "websiteUrl" | "voiceDescription">, site: SiteFacts, locations: { name: string; street: string; city: string; state?: string; zip?: string; phone?: string; hours?: string }[] = []): BriefFact[] {
  const out: BriefFact[] = []
  const add = (text: string, source: string) => { const t = clean(text); if (t && !out.some((f) => f.text === t)) out.push({ text: t.slice(0, 260), source }) }
  if (user.businessName) add(`The business is called ${user.businessName}.`, "profile")
  if (user.businessType) add(`It is a ${user.businessType}.`, "profile")
  if (user.city?.trim()) add(`It is based in ${[user.city.trim(), user.state?.trim()].filter(Boolean).join(", ")}.`, "profile")
  for (const s of sentences(user.voiceDescription ?? "", 6)) add(s, "profile (owner's words)")
  for (const l of locations.slice(0, 3)) add(`${l.name}: ${[l.street, l.city, l.state, l.zip].filter(Boolean).join(", ")}${l.phone ? `, phone ${l.phone}` : ""}${l.hours ? `, hours ${l.hours}` : ""}.`, "locations")
  for (const [label, p, n] of [["homepage", site.home, 24], ["pricing page", site.pricing, 14], ["about page", site.about, 12]] as const) {
    if (!p) continue
    if (p.description) add(p.description, `${label} (${p.path})`)
    for (const s of sentences(p.text, n)) add(s, `${label} (${p.path})`)
    if (p.prices.length) add(`Prices shown on the ${label}: ${p.prices.join(", ")}.`, `${label} (${p.path})`)
  }
  return out.slice(0, 70)
}

const JUNK_PATH = /\/(tag|category|author|page\/\d+|feed|cart|checkout|account|login|privacy|terms|cookie|legal|search|thank)/i

/** Pages on the owner's own site I may link to: sitemap first, else the homepage's links. */
export async function ownPages(site: string, topic: string): Promise<{ url: string; title: string }[]> {
  const host = hostOf(site)
  if (!host) return []
  const map = await readSitemap(site, 500)
  const urls = map.urls.length ? map.urls : await readArticle(withHttps(site), 500).then((h) => (h.ok ? h.page.links.map((l) => ({ url: l.url })) : []))
  const fresh = urls.filter((u) => { try { const p = new URL(u.url).pathname; return p !== "/" && !JUNK_PATH.test(p) } catch { return false } })
  return pickCompetitorPages(fresh, { max: 30, topic }).map((p) => ({ url: p.url, title: p.title })).filter((p) => p.title.length > 2)
}

/** Their page for this topic: the gap's own page, else the best match in their sitemap. Robots respected. */
export async function competitorBenchmark(o: { gap?: GapItem | null; competitor?: string | null; topic: string }): Promise<Benchmark | null> {
  let url = o.gap?.sourceUrl ?? null
  if (!url && o.competitor) {
    const map = await readSitemap(o.competitor, 400)
    const best = pickCompetitorPages(map.urls, { max: 1, topic: o.topic })[0]
    if (best && best.overlap > 0) url = best.url
  }
  if (!url) return null
  const host = hostOf(url) ?? url
  const r = await readArticle(url, 3000)
  if (r.ok) {
    const p: Article = r.page
    return { url: p.url, host, title: p.title || p.h1, words: p.words, headings: p.headings.map((h) => (h.level === 3 ? `- ${h.text}` : h.text)).slice(0, 30), covers: o.gap?.covers ?? [], read: true }
  }
  // Couldn't read it now: what the gap analysis read before, if anything.
  if (o.gap?.sourceHeadings?.length) return { url, host, title: o.gap.sourceTitle ?? "", words: o.gap.sourceWords ?? null, headings: o.gap.sourceHeadings, covers: o.gap.covers ?? [], read: true }
  return { url, host, title: o.gap?.sourceTitle ?? slugTitle(url), words: null, headings: [], covers: [], read: false }
}

const Schema = z.object({
  question: z.string().describe("The one question the page answers, as a customer would type it to ChatGPT or Google"),
  keyword: z.string().describe("The main search phrase, 2-6 words"),
  audience: z.string().describe("Who is reading, in one short sentence"),
  intent: z.enum(["informational", "commercial", "transactional", "local"]),
  angle: z.string().describe("One sentence: how this page will be more useful than the competitor's (or, with no competitor, than a generic answer)"),
  outline: z.array(z.object({ h2: z.string(), h3: z.array(z.string()) })).describe("4-7 sections in reading order; h2 phrased as questions where natural; h3 optional (0-3). Do NOT include the FAQ section or an intro"),
  facts: z.array(z.number().int()).describe("Indexes (F numbers) of the facts the page should use, 3-12, most useful first"),
  links: z.array(z.object({ page: z.number().int(), anchor: z.string(), section: z.string() })).describe("2-4 pages from OWN PAGES (L numbers) worth linking to, the anchor text (2-6 words, natural) and which h2 section it belongs in"),
  faq: z.array(z.number().int()).describe("Indexes (Q numbers) of 3-5 questions for the FAQ, closest to the topic first"),
  newFaq: z.array(z.string()).describe("Only if fewer than 3 Q questions fit: up to 2 extra questions a customer would ask. Else empty"),
})

export function wordTargetFor(competitorWords: number | null | undefined): number {
  if (!competitorWords) return 900
  return Math.max(700, Math.min(1800, Math.round((competitorWords * 1.15) / 50) * 50))
}

/** Plans the brief from gathered context (one AI call). Throws when the model gives nothing usable. */
export async function planBrief(ctx: BriefContext): Promise<ContentBrief> {
  const comp = ctx.competitor
  const prompt = `Plan one blog post / web page for a business's own website. Use only the data below.

TOPIC: ${ctx.topic}
BUSINESS: ${ctx.business.name} (${ctx.business.type})${ctx.business.city ? `, ${ctx.business.city}` : ""}${ctx.business.site ? `, ${ctx.business.site}` : ""}
${ctx.gap ? `WHY: a competitor has a page on this and the business doesn't (${ctx.gap.topic}). Suggested sections: ${ctx.gap.suggestedOutline.join(" | ") || "(none)"}\n` : ""}
FACTS (the only facts the page may state; from the business's own site and profile):
${ctx.facts.map((f, i) => `F${i}: ${f.text}  [${f.source}]`).join("\n") || "(none)"}

OWN PAGES (the only pages it may link to):
${ctx.pages.map((p, i) => `L${i}: ${p.title} — ${p.url}`).join("\n") || "(none)"}

QUESTIONS PEOPLE ASK (from the AI questions I track, their Google Search Console searches and the competitor's headings):
${ctx.questions.map((q, i) => `Q${i}: ${q.q}  [${q.source}]`).join("\n") || "(none)"}

${comp ? `COMPETITOR PAGE (${comp.host}): “${comp.title}”${comp.words ? `, ${comp.words} words` : ""}${comp.read ? "" : " (listed in their sitemap; I couldn't read it)"}
Headings: ${comp.headings.join(" | ") || "(none)"}${comp.covers.length ? `\nIt covers: ${comp.covers.join("; ")}` : ""}
The outline must cover everything useful their page covers, from this business's side, and add what a reader still needs. Never name the competitor.` : "No competitor page: plan the most useful answer to the topic."}

Rules: pick facts, pages and questions by their numbers only. Search intent: informational (learning), commercial (comparing options or providers), transactional (ready to buy/book), local (looking for a provider nearby). Plain words, no hype.`
  const msg = await anthropic.messages.parse({ model: MODEL, max_tokens: 2500, output_config: { format: zodOutputFormat(Schema) }, messages: [{ role: "user", content: prompt }] })
  const o = msg.stop_reason === "refusal" ? null : msg.parsed_output
  if (!o || !o.question.trim() || !o.outline.length) throw new Error("brief: no usable plan")
  const uniq = <T,>(xs: T[]) => [...new Set(xs)]
  const facts = uniq(o.facts).filter((i) => ctx.facts[i]).slice(0, 12).map((i) => ctx.facts[i])
  const internalLinks = o.links
    .filter((l) => ctx.pages[l.page] && clean(l.anchor).length >= 2)
    .filter((l, i, a) => a.findIndex((x) => x.page === l.page) === i)
    .slice(0, 4)
    .map((l) => ({ url: ctx.pages[l.page].url, anchor: clean(l.anchor).slice(0, 60), section: clean(l.section).slice(0, 120) }))
  const faq: ContentBrief["faq"] = uniq(o.faq).filter((i) => ctx.questions[i]).slice(0, 5).map((i) => ({ q: clean(ctx.questions[i].q), source: ctx.questions[i].source }))
  if (faq.length < 3) for (const q of o.newFaq.slice(0, 2)) if (clean(q).length > 8) faq.push({ q: clean(q), source: "writer" })
  return {
    v: 1,
    topic: ctx.topic,
    question: clean(o.question).slice(0, 200),
    keyword: clean(o.keyword).slice(0, 80),
    audience: clean(o.audience).slice(0, 200),
    intent: o.intent,
    angle: clean(o.angle).slice(0, 300),
    outline: o.outline.slice(0, 7).map((s) => ({ h2: clean(s.h2).replace(/^#+\s*/, "").slice(0, 140), h3: s.h3.map((h) => clean(h).replace(/^#+\s*/, "").slice(0, 140)).filter(Boolean).slice(0, 3) })).filter((s) => s.h2 && !/frequently asked|^faq/i.test(s.h2)),
    facts,
    internalLinks,
    competitor: comp,
    faq,
    wordTarget: wordTargetFor(comp?.words),
    at: new Date().toISOString(),
    gapId: null,
  }
}

/** Looks up a Research gap card ("<contentGapId>:<index>") for this brand. */
export async function gapById(userId: string, gapId: string | null | undefined): Promise<{ gap: GapItem; competitorUrl: string } | null> {
  const m = gapId?.match(/^([a-z0-9]+):(\d+)$/i)
  if (!m) return null
  const row = await db.contentGap.findFirst({ where: { id: m[1], userId } })
  const list = Array.isArray(row?.gaps) ? (row!.gaps as unknown as GapItem[]) : []
  const gap = list[Number(m[2])]
  return gap && row ? { gap, competitorUrl: row.competitorUrl } : null
}

export async function getBrief(userId: string, id: string | null | undefined): Promise<ContentBrief | null> {
  if (!id) return null
  const row = await db.mockActivity.findFirst({ where: { id, userId, type: BRIEF_TYPE } })
  return row ? { ...(row.metadata as unknown as ContentBrief), id: row.id } : null
}

/** Gathers the real data, plans the brief and stores it. Reuses a brief for the same topic from the last 14 days. */
export async function buildBrief(user: User, input: { topic: string; gapId?: string | null; competitor?: string | null; fresh?: boolean }): Promise<ContentBrief> {
  const topic = clean(input.topic).slice(0, 200)
  const topicKey = key(`${topic}|${input.gapId ?? ""}`)
  if (!input.fresh) {
    const prev = await db.mockActivity.findFirst({ where: { userId: user.id, type: BRIEF_TYPE, createdAt: { gte: new Date(Date.now() - REUSE_MS) }, metadata: { path: ["topicKey"], equals: topicKey } }, orderBy: { createdAt: "desc" } })
    if (prev) return { ...(prev.metadata as unknown as ContentBrief), id: prev.id }
  }
  const found = await gapById(user.id, input.gapId)
  const site = user.websiteUrl ? withHttps(user.websiteUrl) : null
  const words = topicWords(topic)
  const since = new Date(Date.now() - 90 * 86_400_000)
  const [siteFacts, settings, pages, qs, ranks, competitor] = await Promise.all([
    site ? readSiteFacts(site) : Promise.resolve({ home: null, pricing: null, about: null } as SiteFacts),
    getAgentSettings(user.id),
    site ? ownPages(site, topic).catch(() => []) : Promise.resolve([]),
    latestQuestionScan(user.id).catch(() => null),
    db.keywordRanking.findMany({ where: { userId: user.id, date: { gte: since }, impressions: { gt: 0 } }, orderBy: { impressions: "desc" }, take: 400, select: { query: true, impressions: true } }).catch(() => []),
    competitorBenchmark({ gap: found?.gap, competitor: found?.competitorUrl ?? input.competitor ?? null, topic }).catch(() => null),
  ])
  // Questions: AI questions I track, then Search Console queries on this topic, then the competitor's own question headings.
  const overlaps = (s: string) => { const w = topicWords(s); return words.filter((x) => w.includes(x)).length }
  const questions: BriefContext["questions"] = []
  const pushQ = (q: string, source: BriefContext["questions"][number]["source"]) => { const t = clean(q); if (t.length > 8 && !questions.some((x) => key(x.q) === key(t))) questions.push({ q: t, source }) }
  const aiQs = [...(qs?.scan.questions.map((q) => q.q) ?? []), ...(settings.questions ?? [])]
  for (const q of aiQs.sort((a, b) => overlaps(b) - overlaps(a)).slice(0, 10)) pushQ(q, "ai_question")
  const byQuery = new Map<string, number>()
  for (const r of ranks) byQuery.set(r.query, (byQuery.get(r.query) ?? 0) + r.impressions)
  for (const [q] of [...byQuery.entries()].filter(([q]) => overlaps(q) > 0).sort((a, b) => b[1] - a[1]).slice(0, 12)) pushQ(q, "search_console")
  for (const h of competitor?.headings ?? []) if (/\?$/.test(h)) pushQ(h.replace(/^-\s*/, ""), "competitor")

  const brief = await planBrief({
    topic,
    business: { name: user.businessName ?? hostOf(user.websiteUrl ?? "") ?? "the business", type: user.businessType ?? "business", city: user.city?.trim() ?? "", site },
    facts: factCandidates(user, siteFacts, settings.locations ?? []),
    pages,
    questions: questions.slice(0, 30),
    competitor,
    gap: found?.gap ?? null,
  })
  brief.gapId = input.gapId ?? null
  const row = await db.mockActivity.create({ data: { userId: user.id, type: BRIEF_TYPE, title: `Planned a page: “${brief.question.slice(0, 120)}”`, metadata: { ...brief, topicKey } as object } })
  return { ...brief, id: row.id }
}

/**
 * The parts of the brief whose numbers the post may repeat: the question, keyword, outline, the
 * owner's facts and the FAQ questions. Never the competitor's page (their numbers aren't ours).
 */
export function briefNumbersText(b: ContentBrief): string {
  return [b.question, b.keyword, ...b.outline.flatMap((s) => [s.h2, ...s.h3]), ...b.facts.map((f) => f.text), ...b.faq.map((f) => f.q)].join("\n")
}
