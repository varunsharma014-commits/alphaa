// "What's working": data-based findings for the owner, and what to create next.
//
// The working / not working / niche lines are written here from the account's real numbers
// (Search Console, Analytics, the weekly AI questions, competitors, the owner's social posts).
// No model writes those. The model only proposes content ideas, and every idea must cite the
// facts it rests on. Any number it writes must appear in those facts, or the idea is dropped.
// Saved weekly as a MockActivity row (type "insights").
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { latestQuestionScan } from "@/lib/questions"
import { buildAccountDossier } from "@/lib/personal/research"
import { voiceFor } from "@/lib/voice"

export type InsightLine = { key: string; text: string }
export type IdeaFormat = "blog" | "google" | "social"
export type Idea = { title: string; format: IdeaFormat; why: string; keys: string[] }
export type Insights = {
  at: string
  sources: string[]
  working: InsightLine[]
  notWorking: InsightLine[]
  niche: InsightLine[]
  ideas: Idea[]
}

export const INSIGHTS = "insights"
const MODEL = "claude-opus-5-5"
const DAY = 86_400_000
const n = (x: number) => Math.round(x).toLocaleString("en-US")
const pathOf = (u: string) => { try { return new URL(u).pathname.replace(/\/$/, "") || "/" } catch { return null } }

type Agg = { clicks: number; impressions: number; position: number }

/** The two 28-day Search Console snapshots ~4 weeks apart (latest, and the one before it). */
async function gscWindows(userId: string): Promise<{ now: Map<string, Agg>; before: Map<string, Agg> | null } | null> {
  const latest = await db.keywordRanking.findFirst({ where: { userId }, orderBy: { date: "desc" }, select: { date: true } })
  if (!latest) return null
  const target = new Date(latest.date.getTime() - 28 * DAY)
  const prev = await db.keywordRanking.findFirst({
    where: { userId, date: { gte: new Date(target.getTime() - 7 * DAY), lte: new Date(target.getTime() + 7 * DAY) } },
    orderBy: { date: "desc" },
    select: { date: true },
  })
  const load = async (date: Date) => {
    const rows = await db.keywordRanking.findMany({ where: { userId, date }, select: { query: true, clicks: true, impressions: true, position: true }, take: 2000 })
    return new Map(rows.map((r) => [r.query, { clicks: r.clicks, impressions: r.impressions, position: r.position }]))
  }
  return { now: await load(latest.date), before: prev ? await load(prev.date) : null }
}

/** Gather the facts and write the lines. Network: Search Console data is already synced; the dossier may fetch rivals' sitemaps and the owner's public social posts (cached 6 days). */
export async function gatherInsights(userId: string): Promise<{ lines: Omit<Insights, "ideas" | "at">; facts: InsightLine[] } | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { businessName: true, websiteUrl: true } })
  if (!user) return null
  const name = user.businessName?.trim() || "you"
  const working: InsightLine[] = []
  const notWorking: InsightLine[] = []
  const niche: InsightLine[] = []
  const extra: InsightLine[] = []
  const sources = new Set<string>()

  // ── Google Search ─────────────────────────────────────────────────────────
  const gsc = await gscWindows(userId).catch(() => null)
  if (gsc?.now.size) {
    sources.add("Google Search Console")
    const rows = [...gsc.now.entries()].map(([q, a]) => ({ q, ...a, prev: gsc.before?.get(q) }))
    const top = rows.filter((r) => r.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 3)
    for (const r of top) {
      const change = r.prev ? r.clicks - r.prev.clicks : null
      working.push({ key: `gsc:top:${r.q}`, text: `“${r.q}” brought ${n(r.clicks)} clicks from Google in the last 28 days${change && change > 0 ? `, up ${n(change)} from the 4 weeks before` : ""}.` })
    }
    if (gsc.before) {
      const risers = rows.filter((r) => r.prev && r.clicks - r.prev.clicks >= 3 && !top.includes(r)).sort((a, b) => (b.clicks - b.prev!.clicks) - (a.clicks - a.prev!.clicks)).slice(0, 2)
      for (const r of risers) working.push({ key: `gsc:rise:${r.q}`, text: `“${r.q}” is growing: ${n(r.prev!.clicks)} to ${n(r.clicks)} clicks from Google, 4 weeks apart.` })
      const fallers = rows.filter((r) => r.prev && r.prev.clicks - r.clicks >= 3).sort((a, b) => (b.prev!.clicks - b.clicks) - (a.prev!.clicks - a.clicks)).slice(0, 2)
      for (const r of fallers) notWorking.push({ key: `gsc:fall:${r.q}`, text: `“${r.q}” is slipping: ${n(r.prev!.clicks)} to ${n(r.clicks)} clicks from Google, 4 weeks apart.` })
    }
    const near = rows.filter((r) => r.impressions >= 20 && r.position > 8 && r.position <= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 2)
    for (const r of near) notWorking.push({ key: `gsc:near:${r.q}`, text: `“${r.q}” was seen ${n(r.impressions)} times on Google, but you’re around position ${Math.round(r.position)}, just off the first page.` })
    const lowCtr = rows.filter((r) => r.impressions >= 50 && r.position <= 5 && r.clicks / r.impressions < 0.02).sort((a, b) => b.impressions - a.impressions).slice(0, 1)
    for (const r of lowCtr) notWorking.push({ key: `gsc:ctr:${r.q}`, text: `You rank near the top for “${r.q}” (seen ${n(r.impressions)} times), but only ${r.clicks === 1 ? "1 person" : `${n(r.clicks)} people`} clicked. The title and description aren’t pulling people in.` })
  }

  // ── Website visits (Analytics) and posts I published ──────────────────────
  const snaps = await db.analyticsSnapshot.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 40, select: { date: true, sessions: true, organicSessions: true, topPages: true, trafficSources: true } })
  const snap = snaps[0]
  if (snap) {
    sources.add("Google Analytics")
    const prior = snaps.find((s) => Math.abs(snap.date.getTime() - s.date.getTime() - 28 * DAY) <= 7 * DAY)
    if (prior && prior.organicSessions > 0) {
      const diff = snap.organicSessions - prior.organicSessions
      const line = { key: "ga:organic", text: `Visits from search: ${n(snap.organicSessions)} in the last 28 days, ${diff >= 0 ? "up" : "down"} from ${n(prior.organicSessions)} the 4 weeks before.` }
      if (Math.abs(diff) >= Math.max(5, prior.organicSessions * 0.1)) (diff > 0 ? working : notWorking).push(line)
      else extra.push(line)
    }
    const pages = (Array.isArray(snap.topPages) ? snap.topPages : []) as { path?: string; views?: number }[]
    const published = await db.mockActivity.findMany({ where: { userId, type: "post_draft", metadata: { path: ["status"], equals: "published" } }, orderBy: { createdAt: "desc" }, take: 30, select: { metadata: true } })
    const mine = new Map(published.map((p) => { const m = p.metadata as { url?: string; title?: string }; return [m.url ? pathOf(m.url) : null, m.title ?? null] as const }).filter(([p]) => !!p))
    let mineShown = 0
    for (const pg of pages.slice(0, 50)) {
      const p = (pg.path ?? "").replace(/\/$/, "") || "/"
      const title = mine.get(p)
      if (title && (pg.views ?? 0) > 0 && mineShown < 2) {
        working.push({ key: `ga:post:${p}`, text: `The post I published, “${title}”, got ${n(pg.views ?? 0)} views in the last 28 days.` })
        mineShown++
      }
    }
    const best = pages.filter((pg) => pg.path && pg.path !== "/" && (pg.views ?? 0) > 0).sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0]
    if (best) extra.push({ key: "ga:toppage", text: `Your most visited page besides the homepage is ${best.path} (${n(best.views ?? 0)} views in 28 days).` })
    const src = (Array.isArray(snap.trafficSources) ? snap.trafficSources : []) as { source?: string; sessions?: number }[]
    if (src[0]?.source) extra.push({ key: "ga:source", text: `Most visits come from ${src[0].source} (${n(src[0].sessions ?? 0)} visits in 28 days).` })
  }

  // ── The questions customers ask AI ────────────────────────────────────────
  const qs = await latestQuestionScan(userId).catch(() => null)
  if (qs && Date.now() - qs.at.getTime() < 21 * DAY) {
    sources.add("the questions I ask ChatGPT, Gemini, Claude and Perplexity each week")
    const won = qs.scan.questions.filter((q) => Object.values(q.engines).some((e) => e?.appeared))
    const lost = qs.scan.questions.filter((q) => !Object.values(q.engines).some((e) => e?.appeared))
    if (won.length) working.push({ key: "ai:won", text: `AI names ${name} for ${won.length} of the ${qs.scan.questions.length} customer questions I check, including “${won[0].q}”.` })
    for (const q of lost.slice(0, 2)) {
      const named = Array.from(new Set(Object.values(q.engines).flatMap((e) => e?.named ?? []))).slice(0, 2)
      notWorking.push({ key: `ai:lost:${q.q}`, text: `When customers ask AI “${q.q}”, it doesn’t name you${named.length ? `. It names ${named.join(" and ")}` : ""}.` })
    }
    const self = (user.businessName ?? "").toLowerCase()
    const rival = qs.scan.rivals.find((r) => r.name.toLowerCase() !== self)
    if (rival) niche.push({ key: `ai:rival:${rival.name}`, text: `${rival.name} is the business AI names most in your area: ${rival.count} times across ${qs.scan.answers} answers.` })
  }

  // ── Competitors and the owner's social posts ──────────────────────────────
  const gap = await db.contentGap.findFirst({ where: { userId }, orderBy: { analyzedAt: "desc" }, select: { competitorUrl: true, gaps: true } })
  const gaps = (Array.isArray(gap?.gaps) ? gap!.gaps : []) as { topic?: string; suggestedTitle?: string }[]
  const host = gap?.competitorUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  for (const g of gaps.slice(0, 2)) if (g.topic) niche.push({ key: `gap:${g.topic}`, text: `${host ?? "A competitor"} has a page about “${g.topic}”. You don’t.` })
  if (gaps.length) sources.add("your competitors’ websites")

  const dossier = await buildAccountDossier(userId).catch(() => null)
  for (const r of dossier?.fresh?.rivalActivity ?? []) {
    if (!r.newest || niche.length >= 5) continue
    sources.add("your competitors’ websites")
    niche.push({ key: `rival:new:${r.domain}`, text: `${r.name} published “${r.newest.title ?? r.newest.url}” on ${r.newest.lastmod}.` })
  }
  const posts = (dossier?.fresh?.social?.posts ?? []).filter((p) => p.likes != null && p.text)
  if (posts.length >= 3) {
    const platforms = Array.from(new Set(posts.map((p) => (p.platform === "instagram" ? "Instagram" : "Facebook"))))
    sources.add(`your ${platforms.join(" and ")}`)
    const sorted = [...posts].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    const snippet = (t: string) => (t.length > 80 ? `${t.slice(0, 80).trimEnd()}…` : t)
    working.push({ key: "social:top", text: `Your best recent ${sorted[0].platform === "instagram" ? "Instagram" : "Facebook"} post got ${n(sorted[0].likes ?? 0)} likes: “${snippet(sorted[0].text)}”` })
    const last = sorted[sorted.length - 1]
    if ((last.likes ?? 0) < (sorted[0].likes ?? 0) / 3) notWorking.push({ key: "social:low", text: `This one got ${n(last.likes ?? 0)} likes: “${snippet(last.text)}”` })
  }
  for (const f of dossier?.facts ?? []) if (!/^(lead|price|offer)/.test(f.key)) extra.push({ key: `d:${f.key}`, text: f.text })

  const lines = { sources: [...sources], working: working.slice(0, 5), notWorking: notWorking.slice(0, 5), niche: niche.slice(0, 5) }
  return { lines, facts: [...lines.working, ...lines.notWorking, ...lines.niche, ...extra].slice(0, 40) }
}

const Schema = z.object({
  ideas: z.array(z.object({
    title: z.string().describe("The headline or topic of the piece, specific to this business"),
    format: z.enum(["blog", "google", "social"]).describe("blog = website article; google = Google listing update; social = Facebook/Instagram/LinkedIn post"),
    why: z.string().describe("One sentence: why this, citing what the data shows"),
    keys: z.array(z.string()).describe("The fact keys this idea rests on"),
  })),
})

export const numbers = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, "").replace(/,/g, ""))

/** Content ideas from the facts. Drops any idea that cites no real fact or uses a number not in its facts. */
export async function ideasFrom(userId: string, facts: InsightLine[]): Promise<Idea[]> {
  if (facts.length < 2) return []
  const [user, voice, recent] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true } }),
    voiceFor(userId).catch(() => null),
    db.mockActivity.findMany({ where: { userId, type: "post_draft" }, orderBy: { createdAt: "desc" }, take: 15, select: { title: true } }),
  ])
  const msg = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 5000,
    output_config: { effort: "medium", format: zodOutputFormat(Schema) },
    messages: [{
      role: "user",
      content: `You plan content for ${user?.businessName ?? "a small business"}${user?.businessType ? `, a ${user.businessType}` : ""}${user?.city ? ` in ${user.city}` : ""}.

From the facts below, suggest 3 to 5 things to create next. Each must build on what the data says is working, fix what isn't, or answer what competitors or AI answers show customers want.
- blog: a website article that answers a question customers search for or ask AI.
- google: a short Google listing update (local, timely, a service).
- social: a Facebook/Instagram/LinkedIn post. Only suggest social if there are social facts or a clear reason.
Rules: cite the fact keys you used. Titles must not promise facts the data doesn't give (hours, prices, offers, insurance, years): ask the question instead ("What does Invisalign cost in Austin?"). In "why", use only numbers that appear in those facts, and say it plainly (e.g. "“dentist open saturday” is seen 140 times but you're just off page one"). Never say "best", "#1" or "leading". Don't repeat these recent posts: ${recent.map((r) => r.title).join("; ") || "none"}.
${voice ? `Titles should fit this voice:\n${voice}\n` : ""}
FACTS (key: text)
${facts.map((f) => `${f.key}: ${f.text}`).join("\n")}`,
    }],
  })
  const out = msg.parsed_output?.ideas ?? []
  const byKey = new Map(facts.map((f) => [f.key, f.text]))
  return out.flatMap((i) => {
    const keys = i.keys.filter((k) => byKey.has(k))
    if (!keys.length) return []
    const allowed = new Set(keys.flatMap((k) => numbers(byKey.get(k)!)))
    if (numbers(i.why).some((x) => !allowed.has(x))) return []
    if (/\b(best|#1|leading)\b/i.test(`${i.title} ${i.why}`)) return []
    return [{ title: i.title.trim().slice(0, 140), format: i.format, why: i.why.trim().slice(0, 300), keys }]
  }).slice(0, 5)
}

export async function latestInsights(userId: string): Promise<Insights | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: INSIGHTS }, orderBy: { createdAt: "desc" }, select: { metadata: true } })
  return (row?.metadata as Insights | null) ?? null
}

export const insightsFresh = (i: Insights | null) => !!i && Date.now() - Date.parse(i.at) < 7 * DAY

export async function buildInsights(userId: string): Promise<Insights | null> {
  const g = await gatherInsights(userId)
  if (!g) return null
  const ideas = await ideasFrom(userId, g.facts).catch((err) => {
    console.error("[insights] ideas failed", err instanceof Error ? err.message : err)
    return [] as Idea[]
  })
  const out: Insights = { at: new Date().toISOString(), ...g.lines, ideas }
  await db.mockActivity.create({ data: { userId, type: INSIGHTS, title: "Looked at what’s working for you and in your niche", metadata: out as object } })
  return out
}
