// The three short cards on /start after the AI answers: brand, content, competitors. Real data
// only, cheap and quick: the brand-kit reader + the site's own words (HTTP), the scan's site
// checks and AI answers (already paid for), and two small Haiku calls whose output is checked
// against the source text. No Apify, no new paid services.
//
// The brand part starts while the AI check runs (the scan's final write replaces ogData, so it
// waits in memory); the rest is built once the scan is done and saved as ogData.snapshot.
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { readBrandKit } from "@/lib/brand-kit"
import { readSiteFacts, type SiteFacts } from "@/lib/site-facts"
import { blockedHost, hostOf } from "@/lib/competitor-relevance"
import { CHECK_IMPACT } from "@/lib/site-check-labels"
import type { SiteChecks } from "@/lib/site-check"

const anthropic = claudeFor("scan-snapshot")
const MODEL = "claude-haiku-5-5"
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, "").replace(/,/g, ""))
const norm = (s: string) => s.toLowerCase().replace(/[“”"'’]/g, "").replace(/\s+/g, " ").trim()

export type BrandCard = {
  logo: string | null
  colors: string[]
  font: string | null
  tone: string | null
  /** One concrete mismatch on the site, both sides quoted from it. */
  observation: string | null
}
export type ContentCard = {
  blog: { found: boolean; posts: number; lastDate: string | null } | null
  social: string[]
  ideas: { title: string; why: string }[]
}
export type RivalCard = { name: string; domain: string | null; aiMentions: number; checked: number; googleRank: number | null; score: string | null; has: string[] }
export type Snapshot = { v: 1; brand: BrandCard | null; content: ContentCard; competitors: RivalCard[]; at: string }

// ── Brand (starts during the scan) ───────────────────────────────────────────
const brandRuns = new Map<string, { at: number; p: Promise<{ card: BrandCard | null; facts: SiteFacts | null }> }>()

const ToneSchema = z.object({
  tone: z.string().describe("One sentence: how this business writes on its homepage (e.g. plain and direct, warm, technical). No praise, no numbers."),
  observation: z
    .object({ quoteA: z.string(), quoteB: z.string(), sentence: z.string() })
    .nullable()
    .describe("Only if two of the title, Google summary and main heading clearly say different things: both quoted exactly, and one plain sentence. Otherwise null."),
})

async function brandNow(site: string, name: string | null): Promise<{ card: BrandCard | null; facts: SiteFacts | null }> {
  const [kit, facts] = await Promise.all([
    readBrandKit(site, { name }).catch(() => null),
    readSiteFacts(site).catch(() => null),
  ])
  const home = facts?.home ?? null
  let tone: string | null = null
  let observation: string | null = null
  if (home && home.text.length > 200) {
    try {
      const msg = await anthropic.messages.parse({
        model: MODEL,
        max_tokens: 1500,
        output_config: { effort: "low", format: zodOutputFormat(ToneSchema) },
        messages: [{ role: "user", content: `Read this business's homepage.\nTitle: ${home.title}\nGoogle summary: ${home.description || "(none)"}\nMain heading: ${home.h1.join(" | ") || "(none)"}\nWords on the page: ${home.text.slice(0, 2500)}` }],
      })
      const out = msg.stop_reason === "refusal" ? null : msg.parsed_output
      if (out) {
        tone = out.tone && !/\d/.test(out.tone) ? out.tone.slice(0, 200) : null
        // Both quotes must really be on the page, or the observation is dropped.
        const src = norm(`${home.title} ${home.description} ${home.h1.join(" ")}`)
        const o = out.observation
        if (o && o.quoteA.length > 3 && o.quoteB.length > 3 && src.includes(norm(o.quoteA)) && src.includes(norm(o.quoteB)) && norm(o.quoteA) !== norm(o.quoteB)) {
          observation = o.sentence.slice(0, 260)
        }
      }
    } catch (err) {
      console.error("[snapshot] tone", err instanceof Error ? err.message : err)
    }
  }
  if (!kit && !tone) return { card: null, facts }
  return { card: { logo: kit?.logo ?? null, colors: kit?.colors.slice(0, 4) ?? [], font: kit?.font ?? null, tone, observation }, facts }
}

/** Starts (or joins) the brand read for a scan. Safe to call while the scan runs. */
export function startBrand(leadId: string, site: string, name: string | null) {
  const hit = brandRuns.get(leadId)
  if (hit) return hit.p
  for (const [k, v] of brandRuns) if (Date.now() - v.at > 900_000) brandRuns.delete(k)
  const p = brandNow(site, name).catch(() => ({ card: null, facts: null }))
  brandRuns.set(leadId, { at: Date.now(), p })
  return p
}

// ── Content ideas (after the scan) ───────────────────────────────────────────
const IdeasSchema = z.object({
  ideas: z.array(z.object({
    title: z.string().describe("A page or post title, under 70 characters"),
    why: z.string().describe("One short sentence to the owner (max 25 words): which question AI answered without them, and how this page answers it"),
  })),
})

async function contentIdeas(name: string, questions: { query: string; skipped: number; total: number }[], facts: SiteFacts | null): Promise<{ title: string; why: string }[]> {
  const open = questions.filter((q) => q.query && q.total > 0)
  if (!open.length) return []
  const site = facts?.home ? `Homepage title: ${facts.home.title}\nSection headings: ${facts.home.h2.join(" | ")}\nWhat it says: ${facts.home.text.slice(0, 1500)}` : "(site not readable)"
  const lines = open.map((q, i) => `q${i + 1}: “${q.query}”: ${q.skipped} of ${q.total} AIs answered without naming ${name}`)
  try {
    const msg = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 1500,
      output_config: { effort: "low", format: zodOutputFormat(IdeasSchema) },
      messages: [{ role: "user", content: `Suggest 2 or 3 new pages or blog posts for ${name}'s website that would answer the questions customers ask AI. Each must fit what the business actually sells (from its site) and name the question it answers. Don't invent facts, prices, numbers or claims; use only the counts given. No "best", "#1", "leading".\n\nQUESTIONS ASKED TODAY\n${lines.join("\n")}\n\nTHE SITE\n${site}` }],
    })
    const out = msg.stop_reason === "refusal" ? null : msg.parsed_output
    // Numbers may come from the questions' counts or the site's own pages (prices, profile counts…).
    const siteText = [facts?.home, facts?.pricing, facts?.about].map((p) => (p ? `${p.title} ${p.description} ${p.h1.join(" ")} ${p.h2.join(" ")} ${p.text}` : "")).join(" ")
    const allowed = new Set([...lines.flatMap(numbersIn), ...numbersIn(siteText)])
    return (out?.ideas ?? [])
      .filter((i) => i.title && i.why && !numbersIn(`${i.title} ${i.why}`).some((n) => !allowed.has(n)) && !/\b(best|#1|leading)\b/i.test(`${i.title} ${i.why}`))
      .slice(0, 3)
      // The model sometimes cites the question by its label ("AI answered q3…"): put the question itself back.
      .map((i) => ({ title: i.title.slice(0, 90), why: i.why.replace(/\bq(\d+)\b/gi, (m, n) => (open[Number(n) - 1] ? `“${open[Number(n) - 1].query}”` : m)).replace(/\s*[—–]\s*/g, ", ").slice(0, 280) }))
  } catch (err) {
    console.error("[snapshot] ideas", err instanceof Error ? err.message : err)
    return []
  }
}

// ── Competitors (scan data only) ─────────────────────────────────────────────
function rivals(og: Record<string, unknown>, businessName: string, site: string | null, checked: number): RivalCard[] {
  const insights = isRecord(og.insights) ? og.insights : {}
  const details = Array.isArray(insights.competitorDetails) ? (insights.competitorDetails as { name: string; domain: string | null; aiMentions: number; googleRank: number | null }[]) : []
  const sc = isRecord(og.siteChecks) ? (og.siteChecks as unknown as SiteChecks) : null
  const mine = hostOf(site ?? "")
  const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "")
  return details
    .filter((d) => d.name && d.aiMentions > 0 && slug(d.name) !== slug(businessName))
    .filter((d) => !d.domain || (!blockedHost(hostOf(d.domain)) && hostOf(d.domain) !== mine))
    .sort((a, b) => b.aiMentions - a.aiMentions)
    .slice(0, 3)
    .map((d) => {
      const dom = d.domain ? hostOf(d.domain) : null
      const check = sc?.competitors.find((c) => (dom && c.domain === dom) || (slug(d.name).length >= 4 && c.domain.replace(/[^a-z0-9]/g, "").includes(slug(d.name).slice(0, 5))))
      const you = sc?.you
      const has = check && !check.blocked
        ? check.checks
            .filter((c) => c.ok === true && (!you || you.blocked || you.checks.find((y) => y.key === c.key)?.ok === false))
            .sort((a, b) => CHECK_IMPACT[b.key] - CHECK_IMPACT[a.key])
            .slice(0, 3)
            .map((c) => (/^[A-Z]{2,}\b/.test(c.label) ? c.label : c.label.charAt(0).toLowerCase() + c.label.slice(1)))
        : []
      return { name: d.name, domain: dom ?? check?.domain ?? null, aiMentions: d.aiMentions, checked, googleRank: d.googleRank ?? null, score: check && !check.blocked ? `${check.passed}/${check.total}` : null, has }
    })
}

export function snapshotOf(og: unknown): Snapshot | null {
  return isRecord(og) && isRecord(og.snapshot) && og.snapshot.v === 1 ? (og.snapshot as unknown as Snapshot) : null
}

/** The full snapshot for a finished scan (cached on the lead). */
export async function buildSnapshot(leadId: string): Promise<Snapshot | null> {
  const lead = await db.scanLead.findUnique({ where: { id: leadId } })
  if (!lead) return null
  const og = isRecord(lead.ogData) ? lead.ogData : {}
  const have = snapshotOf(og)
  if (have) return have
  const name = lead.businessName || "your business"
  const site = lead.businessUrl || null
  const { card, facts } = site ? await startBrand(leadId, site, lead.businessName) : { card: null, facts: null }

  const resp = isRecord(lead.engineResponses) ? (Object.values(lead.engineResponses).filter(isRecord) as Record<string, unknown>[]) : []
  const checked = resp.length
  const questions: { query: string; skipped: number; total: number }[] = []
  if (resp.length) questions.push({ query: String(resp.find((r) => typeof r.query === "string")?.query ?? ""), skipped: resp.filter((r) => r.appeared !== true).length, total: resp.length })
  for (const q of Array.isArray(og.questions) ? (og.questions as { query?: string; answers?: Record<string, { appeared?: boolean }> }[]).slice(1) : []) {
    const a = Object.values(q.answers ?? {})
    if (q.query && a.length) questions.push({ query: q.query, skipped: a.filter((x) => !x.appeared).length, total: a.length })
  }
  const sc = isRecord(og.siteChecks) ? (og.siteChecks as unknown as SiteChecks) : null
  const ideas = await contentIdeas(name, questions, facts)
  const social = facts?.home?.social ?? []

  const snap: Snapshot = {
    v: 1,
    brand: card,
    content: { blog: sc?.you && !sc.you.blocked ? sc.you.blog : null, social, ideas },
    competitors: rivals(og, name, site, checked),
    at: new Date().toISOString(),
  }
  const row = await db.scanLead.findUnique({ where: { id: leadId }, select: { ogData: true } })
  const now = isRecord(row?.ogData) ? row!.ogData : og
  await db.scanLead.update({ where: { id: leadId }, data: { ogData: { ...now, snapshot: snap } as object } }).catch(() => null)
  return snap
}
