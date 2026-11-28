// Brand guardrails the owner sets (agent settings `guardrails`, edited on Your rules and in the
// "Your brand & voice" thread), enforced in code for every writer:
//   - banned words/phrases: a draft that uses one is rejected and written once more; a second
//     miss throws GuardrailError (nothing is saved). Ad lines that use one are dropped.
//   - "always say" items: asked for in the prompt; a draft missing one gets one retry.
//   - mandatory hashtags (social only, all platforms + per platform) and compliance disclaimers
//     (social / blog / email / ads) are appended deterministically after generation, inside each
//     platform's character limit. Ads: a disclaimer that doesn't fit is skipped and flagged.
// The pure helpers (no database) are unit-tested in scripts/test-guardrails.ts. The prompt lines
// reach every writer through voiceText()/voiceFor() (lib/voice.ts) while `enforce()` runs.
import { AsyncLocalStorage } from "node:async_hooks"
import type { SocialPlatform } from "@/lib/social/types"
import { registerOwnerBanned } from "@/lib/gads/rules"

export type DisclaimerChannel = "social" | "blog" | "email" | "ads"
/** What's being written. Google listing posts follow the social disclaimer but get no hashtags. */
export type Channel = DisclaimerChannel | "google"

export type Guardrails = {
  banned: string[]
  /** Added to every social post, on every platform. Stored with the leading #. */
  hashtags: string[]
  /** Extra hashtags for one platform only. */
  platformHashtags: Partial<Record<SocialPlatform, string[]>>
  disclaimers: Partial<Record<DisclaimerChannel, string>>
  alwaysSay: string[]
  at?: string
}

export const EMPTY_GUARDRAILS: Guardrails = { banned: [], hashtags: [], platformHashtags: {}, disclaimers: {}, alwaysSay: [] }
export const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "linkedin", "tiktok", "x"]

/** Each platform's caption limit (what our providers send). */
export const SOCIAL_LIMIT: Record<SocialPlatform, number> = { facebook: 5000, instagram: 2200, linkedin: 3000, tiktok: 2200, x: 280 }
/** Before the post has a platform: the tightest of the long-form ones (Instagram/TikTok). */
export const SOCIAL_DEFAULT_LIMIT = 2200
export const GOOGLE_POST_LIMIT = 1500
export const META_PRIMARY_MAX = 300
export const GOOGLE_DESCRIPTION_MAX = 90

export class GuardrailError extends Error {
  constructor(public word: string) {
    super(`I couldn’t write this without “${word}”, which is on your list of words I never use, so I didn’t save it. Try again or change the topic.`)
    this.name = "GuardrailError"
  }
}

// ── Normalising what the owner typed ─────────────────────────────────────────
const MAX_ITEMS = 30
const uniq = (a: string[]) => Array.from(new Map(a.map((x) => [x.toLowerCase(), x])).values())
/** "#Local Plumbing!" → "#LocalPlumbing". Null when nothing usable is left. */
export function normalizeTag(t: string): string | null {
  const s = t.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "")
  return s ? `#${s.slice(0, 60)}` : null
}
/** One item per line or comma (phrases keep their spaces). */
export function splitList(raw: string | string[] | null | undefined): string[] {
  const arr = Array.isArray(raw) ? raw : (raw ?? "").split(/[\n,]/)
  return uniq(arr.map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.length > 0 && x.length <= 120)).slice(0, MAX_ITEMS)
}
const tagList = (raw: string | string[] | null | undefined) => uniq(splitList(Array.isArray(raw) ? raw : (raw ?? "").replace(/\s+#/g, ",#")).map(normalizeTag).filter((x): x is string => !!x)).slice(0, 15)

export function normalizeGuardrails(raw: Partial<Record<keyof Guardrails, unknown>> | null | undefined): Guardrails {
  const r = (raw ?? {}) as Record<string, unknown>
  const ph = (r.platformHashtags ?? {}) as Record<string, string | string[]>
  const dis = (r.disclaimers ?? {}) as Record<string, string>
  const platformHashtags: Guardrails["platformHashtags"] = {}
  for (const p of PLATFORMS) { const l = tagList(ph[p]); if (l.length) platformHashtags[p] = l }
  const disclaimers: Guardrails["disclaimers"] = {}
  for (const c of ["social", "blog", "email", "ads"] as const) { const d = String(dis[c] ?? "").replace(/\s+/g, " ").trim().slice(0, 600); if (d) disclaimers[c] = d }
  return {
    banned: splitList(r.banned as string | string[]),
    hashtags: tagList(r.hashtags as string | string[]),
    platformHashtags,
    disclaimers,
    alwaysSay: splitList(r.alwaysSay as string | string[]).slice(0, 10),
    ...(typeof r.at === "string" ? { at: r.at } : {}),
  }
}

export const isEmpty = (g: Guardrails | null | undefined) =>
  !g || (!g.banned.length && !g.hashtags.length && !Object.keys(g.platformHashtags).length && !Object.keys(g.disclaimers).length && !g.alwaysSay.length)

// ── Checks ───────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const fold = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, "\"")
/** The first banned word or phrase in the text (whole words, any case), or null. */
export function bannedIn(text: string, banned: string[]): string | null {
  const t = fold(text)
  for (const b of banned) {
    const w = fold(b.trim())
    if (!w) continue
    const start = /^[\p{L}\p{N}]/u.test(w) ? "(?<![\\p{L}\\p{N}])" : ""
    const end = /[\p{L}\p{N}]$/u.test(w) ? "(?![\\p{L}\\p{N}])" : ""
    if (new RegExp(`${start}${esc(w).replace(/\s+/g, "\\s+")}${end}`, "iu").test(t)) return b
  }
  return null
}
const has = (text: string, phrase: string) => fold(text).toLowerCase().replace(/\s+/g, " ").includes(fold(phrase).toLowerCase().replace(/\s+/g, " "))
/** "Always say" items the text doesn't contain. */
export const missingAlways = (text: string, always: string[]) => always.filter((a) => !has(text, a))
const hasTag = (text: string, tag: string) => new RegExp(`${esc(tag)}(?![\\p{L}\\p{N}_])`, "iu").test(text)

/** Prompt lines for a writer (empty string when there's nothing to say). */
export function guardrailPrompt(g: Guardrails | null | undefined, channel: Channel, retryNote?: string | null): string {
  if (!g) return retryNote ?? ""
  const lines: string[] = []
  if (g.banned.length) lines.push(`Never use these words or phrases, in any form: ${g.banned.map((b) => `"${b}"`).join(", ")}.`)
  if (g.alwaysSay.length && channel !== "ads") lines.push(`Always include, word for word: ${g.alwaysSay.map((a) => `"${a}"`).join("; ")}.`)
  if (g.alwaysSay.length && channel === "ads") lines.push(`Where it fits the length, use: ${g.alwaysSay.map((a) => `"${a}"`).join("; ")}.`)
  // Hashtags and disclaimers are added by code afterwards; the writer must not add its own copy.
  if (channel === "social" && (g.hashtags.length || Object.keys(g.platformHashtags).length)) lines.push("I add the business's own hashtags afterwards. Don't write them yourself.")
  if (disclaimerFor(g, channel)) lines.push("I add the business's disclaimer afterwards. Don't write one yourself.")
  if (retryNote) lines.push(retryNote)
  return lines.length ? `THE OWNER'S BRAND RULES (follow them exactly):\n${lines.map((l) => `- ${l}`).join("\n")}` : ""
}

export const disclaimerFor = (g: Guardrails | null | undefined, channel: Channel): string | null =>
  g?.disclaimers[channel === "google" ? "social" : channel] ?? null

// ── Deterministic finishing ──────────────────────────────────────────────────
/** Cut a body at a word boundary so it's at most `max` characters, ending with "…". */
export function cutTo(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  if (max <= 1) return ""
  const head = t.slice(0, max - 1)
  const at = Math.max(head.lastIndexOf(" "), head.lastIndexOf("\n"))
  return `${(at > max * 0.5 ? head.slice(0, at) : head).replace(/[\s,;:.–-]+$/, "")}…`
}

export type Finished = { text: string; flags: string[] }

/**
 * A social caption with the mandatory hashtags (common + this platform's) and the social
 * disclaimer, within the platform's limit. Idempotent: anything already there isn't added again.
 * If it doesn't fit, the body is shortened (the required lines win); if even they don't fit,
 * the hashtags go first, then the disclaimer, and each is flagged.
 */
export function finishSocial(text: string, g: Guardrails | null | undefined, platform?: SocialPlatform | null): Finished {
  const body = text.trim()
  if (!g) return { text: body, flags: [] }
  const limit = platform ? SOCIAL_LIMIT[platform] : SOCIAL_DEFAULT_LIMIT
  const tags = uniq([...g.hashtags, ...(platform ? g.platformHashtags[platform] ?? [] : [])]).filter((t) => !hasTag(body, t))
  const d = disclaimerFor(g, "social")
  const disc = d && !has(body, d) ? d : null
  const build = (b: string, withDisc: boolean, withTags: boolean) => [b, withDisc ? disc : null, withTags && tags.length ? tags.join(" ") : null].filter(Boolean).join("\n\n")
  const flagsFor = (withDisc: boolean, withTags: boolean) => [!withTags && tags.length ? "hashtags" : null, !withDisc && disc ? "disclaimer" : null].filter((x): x is string => !!x)
  for (const [withDisc, withTags] of [[true, true], [true, false], [false, false]] as const) {
    const full = build(body, withDisc, withTags)
    if (full.length <= limit) return { text: full, flags: flagsFor(withDisc, withTags) }
    const room = limit - (full.length - body.length)
    if (room >= Math.min(60, limit / 3)) return { text: build(cutTo(body, room), withDisc, withTags), flags: [...flagsFor(withDisc, withTags), "shortened"] }
  }
  return { text: cutTo(body, limit), flags: flagsFor(false, false) }
}

/** A Google listing post with the social disclaimer (no hashtags), inside Google's 1,500 characters. */
export function finishGoogle(text: string, g: Guardrails | null | undefined): Finished {
  const body = text.trim()
  const d = disclaimerFor(g, "google")
  if (!d || has(body, d)) return { text: body, flags: [] }
  const full = `${body}\n\n${d}`
  if (full.length <= GOOGLE_POST_LIMIT) return { text: full, flags: [] }
  const room = GOOGLE_POST_LIMIT - d.length - 2
  return room >= 300 ? { text: `${cutTo(body, room)}\n\n${d}`, flags: ["shortened"] } : { text: cutTo(body, GOOGLE_POST_LIMIT), flags: ["disclaimer"] }
}

/** A blog post / website page (markdown) with the blog disclaimer as its last paragraph. */
export function finishBlog(markdown: string, g: Guardrails | null | undefined): string {
  const d = disclaimerFor(g, "blog")
  const body = markdown.trimEnd()
  return d && !has(body, d) ? `${body}\n\n*${d}*` : body
}

/** An email's paragraphs with the email disclaimer as the last one. */
export function finishEmail(paragraphs: string[], g: Guardrails | null | undefined): string[] {
  const d = disclaimerFor(g, "email")
  return d && !paragraphs.some((p) => has(p, d)) ? [...paragraphs, d] : paragraphs
}

/** Meta primary text + the ads disclaimer if it fits; otherwise unchanged and flagged. */
export function finishMetaAd(primaryText: string, g: Guardrails | null | undefined, max = META_PRIMARY_MAX): Finished {
  const d = disclaimerFor(g, "ads")
  const body = primaryText.trim()
  if (!d || has(body, d)) return { text: body, flags: [] }
  const full = `${body}\n\n${d}`
  return full.length <= max ? { text: full, flags: [] } : { text: body, flags: ["disclaimer"] }
}

/**
 * Google responsive search ad descriptions + the ads disclaimer. Google rotates descriptions, so
 * every one that runs must carry it: lines it fits on get it, the rest are dropped while at least
 * `min` remain. If fewer than `min` can carry it, the lines are kept as they were and it's flagged.
 */
export function finishGoogleAd(descriptions: string[], g: Guardrails | null | undefined, max = GOOGLE_DESCRIPTION_MAX, min = 2): { descriptions: string[]; flags: string[] } {
  const d = disclaimerFor(g, "ads")
  if (!d) return { descriptions, flags: [] }
  const withIt = descriptions.map((x) => (has(x, d) ? x : `${x.trim().replace(/[.!?]?$/, ".")} ${d}`)).filter((x) => x.length <= max)
  return withIt.length >= min ? { descriptions: withIt, flags: [] } : { descriptions, flags: ["disclaimer"] }
}

/** Plain-English note for a flag, for the owner. */
export function flagNote(flag: string, channel: Channel): string | null {
  if (flag === "disclaimer") return channel === "ads" ? "Your ad disclaimer didn’t fit the platform’s length limit, so this ad runs without it. Shorten the disclaimer on Your rules, or add it on the landing page." : "Your disclaimer didn’t fit the platform’s length limit, so this one goes out without it."
  if (flag === "hashtags") return "Your hashtags didn’t fit this platform’s length limit, so I left them off here."
  return null
}

// ── Running a writer under the rules ─────────────────────────────────────────
type Ctx = { g: Guardrails; channel: Channel; note: string | null }
const als = new AsyncLocalStorage<Ctx>()

/** Prompt lines for whatever writer is running inside `enforce()` (read by lib/voice.ts). */
export function guardrailPromptHere(): string {
  const c = als.getStore()
  return c ? guardrailPrompt(c.g, c.channel, c.note) : ""
}

/** The owner's banned word in `text`, for the writer running now (null outside enforce/withRules). */
export function bannedHere(text: string): string | null {
  const c = als.getStore()
  return c ? bannedIn(text, c.g.banned) : null
}
/** The guardrails of the writer running now. */
export const rulesHere = (): Guardrails | null => als.getStore()?.g ?? null
// Every ad-copy check (gads copyProblem → ad plan, Google and Meta ads) drops lines that use one.
registerOwnerBanned(bannedHere)

/**
 * Run ad writers under the brand's rules: prompt lines via voiceText()/voiceFor(), and every
 * line checked by copyProblem()/checkAds() drops on a banned word (their own retry loops apply).
 */
export async function withRules<T>(userId: string | null | undefined, channel: Channel, fn: () => Promise<T>): Promise<T> {
  return runWithRules(await getGuardrails(userId).catch(() => null), channel, fn)
}
/** The same with the rules given (tests, or a caller that already has them). */
export function runWithRules<T>(g: Guardrails | null, channel: Channel, fn: () => Promise<T>): Promise<T> {
  return g ? als.run({ g, channel, note: null }, fn) : fn()
}

/** The brand's guardrails (null when none are set). */
export async function getGuardrails(userId: string | null | undefined): Promise<Guardrails | null> {
  if (!userId) return null
  const { getAgentSettings } = await import("@/lib/agent/settings")
  const g = normalizeGuardrails((await getAgentSettings(userId)).guardrails)
  return isEmpty(g) ? null : g
}

export async function saveGuardrails(userId: string, raw: unknown): Promise<Guardrails> {
  const { saveAgentSettings } = await import("@/lib/agent/settings")
  const g = { ...normalizeGuardrails(raw as Partial<Record<keyof Guardrails, unknown>>), at: new Date().toISOString() }
  await saveAgentSettings(userId, { guardrails: g })
  return g
}

/**
 * Run a writer under the brand's rules: the rules go into its prompt (via voiceText), a draft that
 * uses a banned word (or misses an "always say" item) is written once more with a note, a second
 * banned hit throws GuardrailError, and `finish` appends hashtags/disclaimers. No rules = the
 * writer runs exactly as before.
 */
export async function enforce<T>(userId: string | null | undefined, channel: Channel, write: () => Promise<T>, o: { texts: (t: T) => string[]; finish?: (t: T, g: Guardrails) => T; /** Tests: use these rules instead of the brand's. */ rules?: Guardrails | null }): Promise<T> {
  const g = o.rules !== undefined ? o.rules : await getGuardrails(userId).catch(() => null)
  if (!g) return write()
  const ctx: Ctx = { g, channel, note: null }
  let out = await als.run(ctx, write)
  const problem = (t: T) => {
    const text = o.texts(t).join("\n")
    const word = bannedIn(text, g.banned)
    const missing = channel === "ads" ? [] : missingAlways(text, g.alwaysSay)
    return { word, missing }
  }
  let p = problem(out)
  if (p.word || p.missing.length) {
    console.warn(`[guardrails] ${channel} draft rejected: ${p.word ? "banned word" : "missing an always-say item"}; writing it once more`)
    ctx.note = [p.word ? `Your last draft used "${p.word}". The owner never wants it: don't use it or any form of it.` : null, p.missing.length ? `Your last draft left out: ${p.missing.map((m) => `"${m}"`).join("; ")}. Include it word for word.` : null].filter(Boolean).join(" ")
    out = await als.run(ctx, write)
    p = problem(out)
    if (p.word) throw new GuardrailError(p.word)
  }
  return o.finish ? o.finish(out, g) : out
}
