// The target keyword for a content brief: candidates from the topic itself, the brand's Search
// Console queries on that topic and Keyword Planner ideas around it, scored volume × winnability
// (difficulty vs the site's strength, lib/keywords/rules.ts). Numbers only from Google / DataForSEO.
import type { User } from "@prisma/client"
import { latestBacklinks } from "@/lib/backlinks/run"
import { keywordIdeas, keywordMetrics } from "./data"
import { difficultyLabel, intentLabel, normKeyword, overlap, pickTarget, plannerOk, siteStrength, volumeLabel, volumeValue, winnability } from "./rules"

export type BriefKeyword = {
  keyword: string
  volume: string
  searches: number
  difficulty: number | null
  difficultyLabel: string
  intent: string | null
  /** 0-1, how likely this site reaches page one. */
  win: number
  why: string
  /** The other candidates I weighed (with numbers), best first. */
  options: { keyword: string; volume: string; difficulty: number | null }[]
}

const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) => Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))])

export async function briefKeyword(user: User, topic: string, queries: { query: string; impressions: number; position?: number | null }[] = []): Promise<BriefKeyword | null> {
  return withTimeout(pick(user, topic, queries).catch((e) => { console.warn("[keywords/brief]", e instanceof Error ? e.message : e); return null }), 15_000, null)
}

async function pick(user: User, topic: string, queries: { query: string; impressions: number; position?: number | null }[]): Promise<BriefKeyword | null> {
  const t = normKeyword(topic)
  const sc = queries.filter((q) => overlap(topic, q.query) > 0).sort((a, b) => b.impressions - a.impressions).slice(0, 8)
  const pos = new Map(sc.map((q) => [normKeyword(q.query), q.position ?? null]))
  const seeds = [t.split(" ").length <= 8 ? t : t.split(" ").filter((w) => w.length > 3).slice(0, 5).join(" "), ...sc.slice(0, 3).map((q) => q.query)].filter(plannerOk)
  const ideas = (await keywordIdeas(user, seeds, 30)).filter((k) => overlap(topic, k) > 0).slice(0, 10)
  const cands = [...new Set([t, ...sc.map((q) => normKeyword(q.query)), ...ideas].filter(plannerOk))]
  if (!cands.length) return null
  const [{ metrics }, links] = await Promise.all([keywordMetrics(user, cands, { labsMax: 15 }), latestBacklinks(user.id).catch(() => null)])
  const strength = siteStrength(links?.summary?.rank ?? null)
  const best = pickTarget(cands.map((k) => ({ keyword: k, metric: metrics.get(k), position: pos.get(k) ?? null })), strength)
  if (!best) return null
  const options = cands.map((k) => metrics.get(k)).filter((m) => m && volumeValue(m.volume) > 0 && m.keyword !== best.keyword)
    .sort((a, b) => volumeValue(b!.volume) - volumeValue(a!.volume)).slice(0, 3)
    .map((m) => ({ keyword: m!.keyword, volume: volumeLabel(m!.volume), difficulty: m!.difficulty }))
  return {
    keyword: best.keyword,
    volume: volumeLabel(best.metric.volume),
    searches: volumeValue(best.metric.volume),
    difficulty: best.metric.difficulty,
    difficultyLabel: difficultyLabel(best.metric.difficulty),
    intent: best.metric.intent ? intentLabel(best.metric.intent) : null,
    win: winnability(best.metric.difficulty, strength, pos.get(best.keyword) ?? null),
    why: best.why,
    options,
  }
}
