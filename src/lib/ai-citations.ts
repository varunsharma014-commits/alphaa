// AI citations & share of voice, the parts that call out (2026-11-28). Pure parsing/classifying
// lives in lib/ai-sources.ts; this file adds:
//   - stance: how an answer talks about the brand when it names it (one Haiku call per question,
//     only for the engines that named it, stored with that answer in the question scan)
//   - Google AI Overviews: for the top tracked questions, is there an AI Overview on Google and
//     does it cite the owner's site (DataForSEO Google results `ai_overview`, standard mode, same
//     search quota + data_usd)
import { claudeFor } from "@/lib/claude"
import type { EngineResult } from "@/lib/ai-engines"
import { googleSerp, isSearchConfigured } from "@/lib/dataforseo"
import { checkAppearance } from "@/lib/ai-engines"
import { hostOfUrl, parseAiOverview, sameSite, validStance, type Stance } from "@/lib/ai-sources"

const anthropic = claudeFor("ai-citations")
const HAIKU = "claude-haiku-4-5"

/** Tone + the sentence that carries it, per engine that named the brand. Empty on any failure. */
export async function answerStances(results: EngineResult[], businessName: string): Promise<Partial<Record<EngineResult["engine"], Stance>>> {
  const named = results.filter((r) => r.appeared && r.response.trim())
  if (!named.length) return {}
  try {
    const res = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Below are answers from AI assistants that mention the business "${businessName}". For EACH answer, judge how it talks about "${businessName}" only (not other businesses): positive (recommends or praises it), neutral (just lists or describes it), negative (warns against it, criticises it), or mixed (both). Quote the ONE sentence from that answer that best shows this, copied exactly.

${named.map((r) => `### ${r.engine}\n${r.response.slice(0, 2500)}`).join("\n\n")}

Return ONLY JSON: {${named.map((r) => `"${r.engine}": {"tone": "positive|neutral|negative|mixed", "quote": "..."}`).join(", ")}}`,
      }],
    })
    const raw = res.content.find((c) => c.type === "text")
    const txt = raw && raw.type === "text" ? raw.text.replace(/```json\n?|```/g, "").trim() : ""
    const parsed = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)) as Record<string, unknown>
    const out: Partial<Record<EngineResult["engine"], Stance>> = {}
    for (const r of named) {
      const st = validStance(parsed[r.engine], r.response, r.snippet)
      if (st) out[r.engine] = st
    }
    return out
  } catch (err) {
    console.error("[ai-citations] stance", err instanceof Error ? err.message : err)
    return {}
  }
}

export type OverviewCheck = {
  q: string
  /** null = couldn't check (quota, DataForSEO down); false = Google showed no AI Overview. */
  shown: boolean | null
  /** The owner's own site is one of the Overview's sources. */
  cited: boolean
  /** The Overview text names the business. */
  named: boolean
  sources: { url: string; title: string | null }[]
  excerpt: string | null
}
export type OverviewScan = { at: string; checks: OverviewCheck[] }

export const overviewsEnabled = () => process.env.AI_OVERVIEWS !== "0" && isSearchConfigured()
/** Top questions checked on Google each week: Starter 3, Pro/Growth 5 (≈ 1-2% of the search quota). */
export const overviewLimit = (plan: string) => (/pro|full|growth/i.test(plan) ? 5 : 3)

/** One Google results page per question. Null when off or nothing could be checked. */
export async function checkAiOverviews(user: { plan: string; city: string | null; state?: string | null; websiteUrl: string | null }, businessName: string, questions: string[]): Promise<OverviewScan | null> {
  if (!overviewsEnabled() || !questions.length) return null
  const own = hostOfUrl(user.websiteUrl ?? "")
  const qs = questions.slice(0, overviewLimit(user.plan))
  const checks: OverviewCheck[] = new Array(qs.length)
  let i = 0
  // All at once: standard tasks wait at DataForSEO, not here (a minute or two in total).
  await Promise.all(qs.map(async () => {
    while (i < qs.length) {
      const k = i++
      // Weekly background work: standard mode (a third of the live price, ready in a minute or two).
      const item = await googleSerp(qs[k], { city: user.city, state: user.state, websiteUrl: user.websiteUrl, mode: "standard" }).catch(() => null)
      if (!item) { checks[k] = { q: qs[k], shown: null, cited: false, named: false, sources: [], excerpt: null }; continue }
      const ao = parseAiOverview(item)
      const cited = !!own && ao.sources.some((s) => { const h = hostOfUrl(s.url); return !!h && sameSite(h, own) })
      const named = !!ao.content && checkAppearance(ao.content, businessName).appeared
      checks[k] = { q: qs[k], shown: ao.shown, cited, named, sources: ao.sources.slice(0, 8), excerpt: ao.content ? ao.content.slice(0, 600) : null }
    }
  }))
  if (checks.every((c) => c.shown === null)) return null
  return { at: new Date().toISOString(), checks }
}
