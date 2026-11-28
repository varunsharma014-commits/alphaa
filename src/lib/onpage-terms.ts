// Topic terms for a brief: what the pages already ranking for the topic talk about, for the
// editor's "Topic coverage" check (lib/onpage-grade.ts). Free page reads only (robots respected,
// lib/page-reader.ts), no paid NLP and no new searches:
//   1. the competitor page the brief benchmarked,
//   2. up to 2 more competitor pages on the same topic that the gap analysis already found,
//   3. Google AI Overview text we stored with the weekly question scan, for matching questions.
// Saved on the brief row (terms, termPages, termSources) so it's computed once.
import { db } from "@/lib/db"
import { hostOf, readArticle, topicWords } from "@/lib/page-reader"
import { latestQuestionScan } from "@/lib/questions"
import { BRIEF_TYPE, type ContentBrief } from "@/lib/content-brief"
import type { GapItem } from "@/lib/content-gaps"
import { salientTerms, type Term, type TermDoc } from "@/lib/salient-terms"

export type BriefTerms = { terms: Term[]; termPages: number; termSources: { url: string; title: string }[] }

const overlap = (a: string[], s: string) => { const w = topicWords(s); return a.filter((x) => w.includes(x)).length }

export async function termsForBrief(userId: string, brief: Pick<ContentBrief, "topic" | "keyword" | "competitor">, businessName: string | null): Promise<BriefTerms> {
  const words = topicWords(`${brief.topic} ${brief.keyword}`)
  const urls: { url: string; title: string }[] = []
  if (brief.competitor?.url) urls.push({ url: brief.competitor.url, title: brief.competitor.title })
  const gaps = await db.contentGap.findMany({ where: { userId }, orderBy: { analyzedAt: "desc" }, take: 6, select: { gaps: true } }).catch(() => [])
  const more = gaps
    .flatMap((g) => (Array.isArray(g.gaps) ? (g.gaps as unknown as GapItem[]) : []))
    .filter((g) => g.sourceUrl && g.read !== false)
    .map((g) => ({ g, score: overlap(words, `${g.topic} ${g.sourceTitle ?? ""}`) }))
    .filter((x) => x.score >= Math.min(2, words.length))
    .sort((a, b) => b.score - a.score)
  for (const { g } of more) {
    if (urls.length >= 3) break
    if (!urls.some((u) => u.url.replace(/\/+$/, "") === g.sourceUrl!.replace(/\/+$/, ""))) urls.push({ url: g.sourceUrl!, title: g.sourceTitle ?? g.topic })
  }
  const docs: TermDoc[] = []
  const sources: BriefTerms["termSources"] = []
  const read = await Promise.all(urls.map((u) => readArticle(u.url, 15_000).catch(() => null)))
  read.forEach((r, i) => {
    if (r?.ok) { docs.push({ text: r.page.text, headings: r.page.headings.map((h) => h.text) }); sources.push({ url: r.page.url, title: r.page.title || urls[i].title }) }
  })
  const qs = await latestQuestionScan(userId).catch(() => null)
  for (const c of qs?.scan.overviews?.checks ?? []) {
    if (!c.shown || !c.excerpt || overlap(words, c.q) < 1) continue
    docs.push({ text: `${c.excerpt} ${c.sources.map((s) => s.title ?? "").join(". ")}`, headings: [c.q] })
    sources.push({ url: `https://www.google.com/search?q=${encodeURIComponent(c.q)}`, title: `Google AI Overview: ${c.q}` })
  }
  // Never suggest a competitor's own name, or the owner's.
  const exclude = [...urls.map((u) => (hostOf(u.url) ?? "").split(".")[0]), businessName ?? ""].filter(Boolean)
  return { terms: salientTerms(docs, { exclude, max: 25 }), termPages: docs.length, termSources: sources }
}

/** Terms for a stored brief, computed once and saved on the row. */
export async function briefTerms(userId: string, briefId: string, businessName: string | null): Promise<BriefTerms | null> {
  const row = await db.mockActivity.findFirst({ where: { id: briefId, userId, type: BRIEF_TYPE } })
  if (!row) return null
  const m = row.metadata as unknown as ContentBrief & Partial<BriefTerms> & { termsAt?: string }
  if (Array.isArray(m.terms) && m.termsAt) return { terms: m.terms, termPages: m.termPages ?? 0, termSources: m.termSources ?? [] }
  const t = await termsForBrief(userId, m, businessName)
  await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...(row.metadata as object), ...t, termsAt: new Date().toISOString() } as object } }).catch(() => {})
  return t
}

/**
 * Save a draft's summary (excerpt). Sets only that one key in place (jsonb_set), so a text autosave
 * landing at the same moment (lib/draft-versions.ts rewrites the metadata) can't be undone by it.
 */
export async function saveExcerpt(userId: string, draftId: string, excerpt: string): Promise<boolean> {
  const text = excerpt.replace(/\s+/g, " ").trim().slice(0, 400)
  const n = await db.$executeRaw`UPDATE "MockActivity" SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{excerpt}', to_jsonb(${text}::text)) WHERE id = ${draftId} AND "userId" = ${userId} AND type = 'post_draft' AND COALESCE(metadata->>'status', '') <> 'published'`
  return n > 0
}
