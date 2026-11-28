// Originality / plagiarism check for long-form drafts (blog posts, pages, "Refresh this post").
// Not run on social posts, Google updates, emails or video scripts (short, not long-form).
//
// Provider interface: the self-built provider is the only one implemented (2026-11-28):
//   (a) 8-word shingle overlap with every page I read for the draft's brief (the competitor page
//       the brief benchmarked + the other pages the gap analysis read on that site), read through
//       lib/page-reader.ts (robots respected, 6-hour cache);
//   (b) a web check: ~5 distinctive sentences searched as exact phrases on Google via DataForSEO
//       live results (lib/dataforseo.ts, each one on the brand's `search` quota); a result whose snippet
//       or page holds the sentence is a match with its URL. Sentence results are kept on the
//       draft, so a re-check after an edit only searches sentences that changed.
// A paid API can be plugged in later: implement OriginalityProvider, add it to PROVIDERS and set
// ORIGINALITY_PROVIDER=copyleaks (COPYLEAKS_EMAIL + COPYLEAKS_API_KEY) or =originality_ai
// (ORIGINALITY_AI_KEY). Until then any value falls back to "self".
//
// The result is saved on the draft (post_draft metadata.originality). originalityGate() is what
// every publish path calls (lib/approvals.ts approveSitePost, lib/connector/push.ts pushChange,
// the content cron); rules and thresholds are in lib/originality-rules.ts.
import type { User } from "@prisma/client"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { googleSearch, isSearchConfigured } from "@/lib/dataforseo"
import { hostOf, readArticleCached } from "@/lib/page-reader"
import { allowedNumbers, numberProblems } from "@/lib/content-check"
import { checkQuota, withQuota } from "@/lib/quotas"
import {
  compare, holdsSentence, MIN_WORDS, phraseQuery, pickSentences, replaceSentences, sentenceKey, sourceSentence, textHash, tokens, units,
  type OriginalityResult, type SourceText, type WebSentence,
} from "@/lib/originality-rules"

export type { OriginalityResult }

export type CheckInput = {
  userId: string
  markdown: string
  /** Pages I read for this draft (the brief's competitor page, the gap analysis pages). */
  sources: { url: string; title: string | null }[]
  /** Hosts that never count as a match (the owner's own site). */
  excludeHosts: string[]
  /** Words that make a sentence not worth searching (the business name). */
  exclude: string[]
  /** The last result for this draft: its web sentences are reused when unchanged. */
  previous: OriginalityResult | null
  web?: boolean
}

export interface OriginalityProvider {
  id: string
  label: string
  configured(): boolean
  check(input: CheckInput): Promise<OriginalityResult>
}

const PAGE_TEXT = 60_000
const MAX_PAGE_READS = 6

const selfProvider: OriginalityProvider = {
  id: "self",
  label: "Alphaa's own check (pages I read + Google exact-phrase search)",
  configured: () => true,
  async check(input) {
    const excluded = (u: string) => { const h = hostOf(u); return !h || input.excludeHosts.includes(h) }
    // (a) the pages read for the brief
    const want = input.sources.filter((s) => !excluded(s.url)).slice(0, 6)
    const got = await Promise.all(want.map(async (s) => ({ s, r: await readArticleCached(s.url, PAGE_TEXT).catch(() => null) })))
    const sources: SourceText[] = got.flatMap(({ s, r }) => (r?.ok ? [{ url: r.page.url, title: r.page.title || s.title, text: r.page.text }] : []))
    const read = got.map(({ s, r }) => ({ url: s.url, ok: !!r?.ok }))

    // (b) the web check
    let web: WebSentence[] = []
    let webRan = false
    let webNote: string | null = null
    const words = tokens(units(input.markdown).join(" ")).length
    if (input.web !== false && words >= MIN_WORDS) {
      if (!isSearchConfigured()) webNote = "The Google check isn't switched on for this account, so I compared it with the pages I read only."
      else {
        const picks = pickSentences(input.markdown, { exclude: input.exclude })
        const prev = new Map((input.previous?.web.sentences ?? []).map((w) => [w.key, w]))
        const todo = picks.filter((s) => !prev.has(sentenceKey(s)))
        const room = todo.length ? await checkQuota(input.userId, "search", { n: todo.length, record: false }) : { allowed: true }
        if (!room.allowed) {
          webNote = "My Google searches for this plan are used up for now, so I compared it with the pages I read only."
          web = picks.flatMap((s) => (prev.has(sentenceKey(s)) ? [prev.get(sentenceKey(s))!] : []))
        } else {
          let pageReads = 0
          web = await Promise.all(picks.map(async (s): Promise<WebSentence> => {
            const key = sentenceKey(s)
            const hit = prev.get(key)
            if (hit) return hit
            const results = await googleSearch(phraseQuery(s), { results: 10, timeoutMs: 60_000, mode: "live" }).catch(() => [])
            const matches: WebSentence["matches"] = []
            for (const r of results.filter((x) => !excluded(x.url))) {
              if (matches.length >= 3) break
              if (holdsSentence(s, `${r.title} ${r.description ?? ""}`)) { matches.push({ url: r.url, title: r.title ?? null, via: "snippet" }); continue }
              // The snippet cut it short: read the page itself (a few per check). Only when Google
              // gave the page's own address (exact: false = just the site's).
              if (pageReads >= MAX_PAGE_READS || r.exact === false) continue
              pageReads++
              const p = await readArticleCached(r.url, PAGE_TEXT).catch(() => null)
              if (p?.ok && holdsSentence(s, p.page.text)) matches.push({ url: r.url, title: r.title ?? null, via: "page" })
            }
            return { key, sentence: s, matches }
          }))
          webRan = picks.length > 0
          if (!picks.length) webNote = "I found no long sentences worth searching on Google."
        }
      }
    }
    return compare(input.markdown, sources, web, { provider: "self", read, webRan, webNote })
  },
}

const PROVIDERS: Record<string, OriginalityProvider> = { self: selfProvider }
let warned = false

/** The provider in use: ORIGINALITY_PROVIDER when it's implemented and configured, else the self-built one. */
export function providerFor(): OriginalityProvider {
  const want = process.env.ORIGINALITY_PROVIDER?.trim().toLowerCase()
  const p = want ? PROVIDERS[want] : undefined
  if (p?.configured()) return p
  if (want && want !== "self" && !warned) { warned = true; console.warn(`[originality] provider "${want}" isn't built yet; using the self-built check`) }
  return selfProvider
}

// ── drafts ────────────────────────────────────────────────────────────────────────────────
type DraftMeta = {
  title?: string; markdown?: string; html?: string; status?: string; briefId?: string | null; gapId?: string | null
  refresh?: { url?: string; kind?: string }; originality?: OriginalityResult
}

/** Pages read for the draft's brief: the benchmarked competitor page + what the gap analysis read on that site. */
async function briefSources(userId: string, m: DraftMeta): Promise<{ url: string; title: string | null }[]> {
  const out: { url: string; title: string | null }[] = []
  const add = (url: string | null | undefined, title: string | null | undefined) => { if (url && !out.some((x) => x.url === url)) out.push({ url, title: title ?? null }) }
  const brief = m.briefId ? await db.mockActivity.findFirst({ where: { id: m.briefId, userId, type: "content_brief" }, select: { metadata: true } }) : null
  const b = brief?.metadata as { competitor?: { url?: string; title?: string; read?: boolean } | null; gapId?: string | null } | null
  if (b?.competitor?.url) add(b.competitor.url, b.competitor.title)
  const gapId = b?.gapId ?? m.gapId
  const row = gapId?.match(/^([a-z0-9]+):\d+$/i) ? await db.contentGap.findFirst({ where: { id: gapId.split(":")[0], userId }, select: { gaps: true } }) : null
  for (const g of (Array.isArray(row?.gaps) ? row!.gaps : []) as { sourceUrl?: string; sourceTitle?: string; read?: boolean }[]) if (g.read && g.sourceUrl) add(g.sourceUrl, g.sourceTitle)
  return out.slice(0, 6)
}

const ownHosts = (site: string | null | undefined, extra?: string | null) => {
  const hs = [site ? hostOf(site) : null, extra ? hostOf(extra) : null].filter((h): h is string => !!h)
  return [...new Set(hs)]
}

/** Plain text of a refresh draft's HTML (its Markdown copy is close enough to compare). */
const textOf = (m: DraftMeta) => m.markdown ?? (m.html ?? "").replace(/<[^>]+>/g, " ")

const inflight = new Map<string, Promise<OriginalityResult | null>>()

/**
 * Checks one saved draft (or `text`, the version about to be published) and saves the result on
 * it. The saved result is reused while the text hasn't changed. Null = not a draft I check
 * (a link fix of the owner's own page).
 */
export async function checkDraft(userId: string, draftId: string, o: { text?: string; force?: boolean } = {}): Promise<OriginalityResult | null> {
  const row = await db.mockActivity.findFirst({ where: { id: draftId, userId, type: "post_draft" } })
  if (!row) return null
  const m = (row.metadata ?? {}) as DraftMeta
  if (m.refresh?.kind === "links") return null
  const text = o.text ?? textOf(m)
  const hash = textHash(text)
  if (!o.force && m.originality?.hash === hash) return m.originality
  const key = `${draftId}|${hash}`
  const running = inflight.get(key)
  if (running) return running
  const job = (async () => {
    const user = await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true, businessName: true } })
    const result = await providerFor().check({
      userId,
      markdown: text,
      sources: m.refresh?.url ? [] : await briefSources(userId, m),
      excludeHosts: ownHosts(user?.websiteUrl, m.refresh?.url),
      exclude: [user?.businessName ?? "", hostOf(user?.websiteUrl ?? "") ?? ""].filter(Boolean),
      previous: m.originality ?? null,
    })
    // Saved only when it's the saved text (a one-off check of other text isn't kept).
    if (text === textOf(m)) {
      const cur = await db.mockActivity.findUnique({ where: { id: draftId } })
      const cm = (cur?.metadata ?? {}) as DraftMeta
      if (cur && textHash(textOf(cm)) === hash) await db.mockActivity.update({ where: { id: draftId }, data: { metadata: { ...(cm as object), originality: result } as object } })
    }
    return result
  })().finally(() => inflight.delete(key))
  inflight.set(key, job)
  return job
}

/** The stored result and whether it still matches the saved text. */
export async function storedOriginality(userId: string, draftId: string): Promise<{ result: OriginalityResult | null; fresh: boolean; checkable: boolean } | null> {
  const row = await db.mockActivity.findFirst({ where: { id: draftId, userId, type: "post_draft" }, select: { metadata: true } })
  if (!row) return null
  const m = (row.metadata ?? {}) as DraftMeta
  const r = m.originality ?? null
  return { result: r, fresh: !!r && r.hash === textHash(textOf(m)), checkable: m.refresh?.kind !== "links" }
}

export const heldMessage = (r: OriginalityResult) =>
  `I held this back so it doesn’t copy another page: ${r.reason ?? "it’s too close to another page."} Open the draft and tap “Rewrite these lines”: I rewrite only those lines.`

/**
 * Every publish path calls this before a long-form post or page goes out. Blocked = the reason
 * for the owner; advisory matches let it through. A check that fails to run lets it through
 * (logged): the pages and the searches are best effort, and the local rules still applied.
 */
export async function originalityGate(userId: string, o: { draftId?: string | null; text?: string | null }): Promise<{ ok: true; result: OriginalityResult | null } | { ok: false; error: string; result: OriginalityResult }> {
  try {
    let result: OriginalityResult | null = null
    if (o.draftId) result = await checkDraft(userId, o.draftId, o.text ? { text: o.text } : {})
    else if (o.text && tokens(units(o.text).join(" ")).length >= MIN_WORDS) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true, businessName: true } })
      result = await providerFor().check({ userId, markdown: o.text, sources: [], excludeHosts: ownHosts(user?.websiteUrl), exclude: [user?.businessName ?? ""].filter(Boolean), previous: null })
    }
    if (result?.blocked) return { ok: false, error: heldMessage(result), result }
    return { ok: true, result }
  } catch (err) {
    console.error("[originality] gate check failed, letting it through", err instanceof Error ? err.message : err)
    return { ok: true, result: null }
  }
}

// ── "Rewrite these lines" ─────────────────────────────────────────────────────────────────
const anthropic = claudeFor("originality")
const MODEL = "claude-sonnet-5-5"

const RewriteSchema = z.object({ lines: z.array(z.object({ n: z.number().int(), text: z.string() })) })

export type RewriteResult = { ok: true; changed: number; result: OriginalityResult | null } | { ok: false; error: string; quota?: boolean }

/** The flagged sentences as written in the Markdown (links/bold kept), with the page each matches. */
function flaggedLines(text: string, r: OriginalityResult): { from: string; host: string }[] {
  const lines: { from: string; host: string }[] = []
  for (const p of r.passages) for (const u of p.sentences) {
    const from = sourceSentence(text, u)
    if (from && !lines.some((l) => l.from === from)) lines.push({ from, host: hostOf(p.url) ?? p.url })
  }
  return lines.slice(0, 30)
}

type Round = { ok: true; changed: number } | { ok: false; error: string }

/** One rewrite pass over the flagged lines: one Sonnet call (content_piece:draft), saved as an AI version. */
async function rewriteRound(user: User, draftId: string, r: OriginalityResult, voice: string | null): Promise<Round> {
  const row = await db.mockActivity.findFirst({ where: { id: draftId, userId: user.id, type: "post_draft" } })
  if (!row) return { ok: false, error: "That draft isn’t here any more." }
  const m = (row.metadata ?? {}) as DraftMeta
  const text = textOf(m)
  const pick = flaggedLines(text, r)
  if (!pick.length) return { ok: false, error: "I couldn’t find those lines in the draft any more. Check it again." }
  const out = await withQuota(user, "content_piece:draft", async () => {
    const msg = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { format: zodOutputFormat(RewriteSchema) },
      messages: [{ role: "user", content: `These lines from a blog post on ${user.businessName ?? "a business"}'s website read too close to other pages. Rewrite EACH line in fresh words with the same meaning.
Rules: no run of 6 or more words may stay the same as the original line or the page it matches; change the sentence structure, not just a few words. Keep every fact and every Markdown link exactly as written ([text](url)); add no new facts, numbers, names or claims; plain English, short sentences; no dashes as punctuation. If a line must stay word for word (a definition, a rule, a quote), put those words in quotation marks and name the source in the same sentence (for example "according to <site>").
${voice ? `\n${voice}\n` : ""}
LINES (n: line  [the page it matches])
${pick.map((l, i) => `${i}: ${l.from}  [${l.host}]`).join("\n")}` }],
    })
    return msg.stop_reason === "refusal" ? null : msg.parsed_output
  })
  if (!out?.lines.length) return { ok: false, error: "I couldn’t rewrite those lines just now. Try again in a minute." }
  const links = (s: string) => [...s.matchAll(/\]\(([^)\s]+)/g)].map((x) => x[1])
  const edits = out.lines.flatMap((l) => {
    const src = pick[l.n]
    const to = l.text.replace(/\s+/g, " ").trim()
    if (!src || !to || to === src.from) return []
    // No new numbers, no new links, not cut to nothing.
    if (numberProblems(to, allowedNumbers([src.from])).length) return []
    if (links(to).some((u) => !links(src.from).includes(u))) return []
    if (to.length < src.from.length * 0.4) return []
    return [{ from: src.from, to }]
  })
  if (!edits.length) return { ok: false, error: "My rewrite changed facts or links, so I kept your text. Try again, or edit those lines yourself." }
  const md = replaceSentences(text, edits)
  if (!md.done) return { ok: false, error: "I couldn’t find those lines in the draft any more. Check it again." }
  const { saveAiRewrite } = await import("@/lib/draft-versions")
  const saved = await saveAiRewrite(user.id, draftId, md.text)
  if (!saved.ok) return { ok: false, error: saved.error }
  // A refresh publishes its HTML: the same lines are replaced there too.
  if (m.html) {
    const html = replaceSentences(m.html, edits)
    const cur = await db.mockActivity.findUnique({ where: { id: draftId } })
    if (cur && html.done) await db.mockActivity.update({ where: { id: draftId }, data: { metadata: { ...(cur.metadata as object), html: html.text } } })
  }
  return { ok: true, changed: md.done }
}

/**
 * Rewrites ONLY the flagged sentences, saves it as an AI version (History can undo it) and checks
 * again. Still held after one pass = one more pass on what still matches (at most 2).
 */
export async function rewriteFlagged(user: User, draftId: string): Promise<RewriteResult> {
  const row = await db.mockActivity.findFirst({ where: { id: draftId, userId: user.id, type: "post_draft" }, select: { metadata: true } })
  if (!row) return { ok: false, error: "That draft isn’t here any more." }
  if ((row.metadata as DraftMeta | null)?.status === "published") return { ok: false, error: "It’s already live, so this copy is locked." }
  let result = await checkDraft(user.id, draftId)
  if (!result?.passages.length) return { ok: false, error: "Nothing matches another page, so there’s nothing to rewrite." }
  const { voiceFor } = await import("@/lib/voice")
  const voice = await voiceFor(user.id).catch(() => null)
  let changed = 0
  try {
    for (let round = 0; round < 2; round++) {
      const r = await rewriteRound(user, draftId, result!, voice)
      if (!r.ok) { if (!changed) return r; break }
      changed += r.changed
      result = await checkDraft(user.id, draftId, { force: true })
      if (!result?.blocked) break
    }
    return { ok: true, changed, result }
  } catch (err) {
    const { isQuotaError } = await import("@/lib/quotas")
    if (isQuotaError(err)) return changed ? { ok: true, changed, result } : { ok: false, error: err.message, quota: true }
    console.error("[originality] rewrite", err instanceof Error ? err.message : err)
    return changed ? { ok: true, changed, result } : { ok: false, error: "I couldn’t rewrite those lines just now. Try again in a minute." }
  }
}
