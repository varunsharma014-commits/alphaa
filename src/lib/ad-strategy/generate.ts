// The owner's personal ad plan: two angles, what competitors run, a hook library, short video
// scripts scene by scene, statics per platform, and a budget/testing plan, all built from the
// playbook (./playbook.ts) plus this business's own facts. Code decides the budget maths, the
// vertical rules and which lines survive the claims check; the model writes the creative.
import { checkQuota } from "@/lib/quotas"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { factsOf } from "@/lib/content"
import { voiceFor } from "@/lib/voice"
import { latestInsights } from "@/lib/insights"
import { nicheFacts } from "@/lib/niche-posts"
import { getAgentSettings } from "@/lib/agent/settings"
import { postImageFor } from "@/lib/post-images"
import { runAsUser } from "@/lib/usage"
import { countryOf } from "@/lib/metaads/rules"
import { competitorAds } from "./competitor-ads"
import { HOOK_TYPES, LIMITS, PLAYBOOK_VERSION, VERTICALS, VERTICAL_RULES, playbookBrief, type Vertical } from "./playbook"
import { allowedNumbers, keepLines, scriptLines, testingPlan } from "./rules"
import { AD_STRATEGY, type AdStrategy, type Script } from "./types"

const anthropic = claudeFor("ad-strategy")
const MODEL = "claude-opus-5-5"
const HOOK_KEYS = HOOK_TYPES.map((h) => h.key) as [string, ...string[]]

const PlanSchema = z.object({
  vertical: z.enum(VERTICALS as [Vertical, ...Vertical[]]).describe("The closest category for this business"),
  b2b: z.boolean().describe("True if it sells mainly to other businesses"),
  local: z.boolean().describe("True if it serves customers in one local area"),
  angles: z.array(z.object({
    name: z.string().describe("3-6 words, e.g. 'The price next to the alternative'"),
    why: z.string().describe("2 sentences to the owner (you/your): why this angle fits, citing only the facts"),
  })).describe("Exactly 2 angles, strongest first"),
  cliches: z.array(z.string()).describe("3-5 things competitors' ads all do that this business should avoid. Empty if no competitor ads were given"),
  gaps: z.array(z.string()).describe("2-4 openings competitors leave that this business can take. Empty if no competitor ads were given"),
  hooks: z.array(z.object({ type: z.enum(HOOK_KEYS), line: z.string().describe("The opening line, under 90 characters") })).describe("24 opening lines, spread over the hook types in priority order"),
  meta: z.array(z.object({
    primary: z.string().describe(`Primary text under ${LIMITS.metaPrimary} characters`),
    headline: z.string().describe(`Under ${LIMITS.metaHeadline} characters`),
    imageHeadline: z.string().describe("4-5 words drawn on the image"),
  })).describe("4 static ads for Facebook and Instagram, each a different angle or hook type"),
  linkedin: z.array(z.object({
    intro: z.string().describe(`Intro text under ${LIMITS.linkedinIntro} characters`),
    headline: z.string().describe(`Under ${LIMITS.linkedinHeadline} characters`),
  })).describe("3 LinkedIn single-image ads if b2b, otherwise empty"),
  googleHeadlines: z.array(z.string()).describe(`15 Google search ad headlines, each under ${LIMITS.googleHeadline} characters`),
  googleDescriptions: z.array(z.string()).describe(`4 Google search ad descriptions, each under ${LIMITS.googleDescription} characters`),
})

const ScriptSchema = z.object({
  scripts: z.array(z.object({
    title: z.string().describe("Short name, e.g. 'Show the work'"),
    angle: z.string().describe("Which of the two angles it uses"),
    format: z.string().describe("One format from the playbook, e.g. 'Kinetic text', 'Behind the scenes', 'POV one-liner'"),
    hookType: z.enum(HOOK_KEYS),
    seconds: z.number().describe("Total length: 5-10 for short cuts, up to 25 for a main cut"),
    platforms: z.array(z.string()).describe("e.g. 'Instagram Reels', 'Facebook', 'TikTok', 'YouTube Shorts', 'LinkedIn'"),
    scenes: z.array(z.object({
      t: z.string().describe("Time range like '0-2s'"),
      visual: z.string().describe("What's on screen and where it comes from: phone footage of X, a screen recording of Y, kinetic text, licensed b-roll. Never AI people"),
      onScreen: z.string().describe("The caption or on-screen text"),
      vo: z.string().describe("Voice-over words, or empty for none"),
      audio: z.string().describe("Licensed music mood or sound effect"),
    })),
    hookSwaps: z.array(z.string()).describe("3 alternative opening lines to test over the same body"),
    labels: z.array(z.string()).describe("On-screen tags the edit needs, e.g. 'Example' for a recreated chat, 'Dramatization'. Empty if none"),
  })).describe("12 scripts"),
})

type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

async function factLines(user: U): Promise<string> {
  const [voice, ins, niche] = await Promise.all([voiceFor(user.id).catch(() => null), latestInsights(user.id).catch(() => null), nicheFacts(user.id).catch(() => [])])
  return [
    factsOf(user, null),
    ...(ins ? [...ins.working, ...ins.notWorking, ...ins.niche].map((f) => f.text) : []),
    ...niche.map((n) => n.text),
    ...(voice ? [`How they sound: ${voice.replace(/\n/g, " ")}`] : []),
  ].join("\n")
}

const RULES = `HARD RULES
- Use only facts given below. Never invent prices, discounts, results, counts, ratings, years, awards, guarantees or customer names. Any number you write must appear in the facts. Don't write years.
- Never promise an outcome ("get recommended", "rank higher", "more customers", "grow your business"). Say what the business does and what the customer controls.
- Never say best, #1, leading, top-rated, cheapest, fastest, perfect, guaranteed, world-class or award-winning.
- No fake testimonials, no AI people, no "customers say". Real customers only if the facts name them. A recreated chat or comment is tagged "Example".
- No claims about the viewer's personal traits (health, weight, age, money, religion): don't say "Struggling with…?" about a condition.
- No hashtags, no emoji, no dashes as punctuation, no ALL CAPS lines. Plain words a customer uses.
- Avoid question, how-to and listicle openers.
- Brand name and the main message on screen by second 5. One call to action in the last 3 seconds.
- Speak to the customer, in the business's own voice.`

/** Builds the plan, saving progress to the row. */
async function build(user: U, rowId: string): Promise<AdStrategy> {
  const country = countryOf(user.state)
  const [facts, comp, settings] = await Promise.all([factLines(user), competitorAds(user.id, country), getAgentSettings(user.id)])
  const allowed = allowedNumbers(facts)
  const brand = user.businessName?.trim() || null
  const display = brand || (user.websiteUrl ? user.websiteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "") : null)
  const compText = comp.ads.length
    ? comp.ads.map((a) => `- ${a.page} (${a.format}${a.daysRunning !== null ? `, running ${a.daysRunning} days` : ""}): ${a.title ? `${a.title}. ` : ""}${a.text}`).join("\n")
    : "No competitor ads found."

  const who = `${display ?? "this business"}${user.businessType ? `, a ${user.businessType}` : ""}${user.city ? ` in ${user.city}${user.state ? `, ${user.state}` : ""}` : ""}`
  const planPrompt = `You are writing a personal ad plan for ${who}.

${playbookBrief()}

${RULES}

Pick the two strongest angles for THIS business from its real facts (for example: the price next to the costlier alternative customers know, showing the real work, a local reason, a specific service). Then write the hooks and static ads using those angles. Read the competitor ads: name the clichés they share and the openings they leave.

FACTS
${facts}

COMPETITOR ADS (Meta Ad Library, active now; never copy their wording)
${compText}`

  const p = await anthropic.messages.parse({ model: MODEL, max_tokens: 12000, output_config: { effort: "medium", format: zodOutputFormat(PlanSchema) }, messages: [{ role: "user", content: planPrompt }] })
  const plan = p.parsed_output
  if (!plan) throw new Error("no plan")

  const hooks = keepLines(plan.hooks, (h) => [{ text: h.line, max: 90 }], allowed, brand)
  const meta = keepLines(plan.meta, (m) => [{ text: m.primary, max: LIMITS.metaPrimary }, { text: m.headline, max: LIMITS.metaHeadline, headline: true }, { text: m.imageHeadline, max: 40, headline: true }], allowed, brand)
  const li = keepLines(plan.b2b ? plan.linkedin : [], (l) => [{ text: l.intro, max: LIMITS.linkedinIntro }, { text: l.headline, max: LIMITS.linkedinHeadline, headline: true }], allowed, brand)
  const gh = keepLines(plan.googleHeadlines, (t) => [{ text: t, max: LIMITS.googleHeadline, headline: true }], allowed, brand)
  const gd = keepLines(plan.googleDescriptions, (t) => [{ text: t, max: LIMITS.googleDescription }], allowed, brand)
  if (hooks.ok.length < 8) throw new Error("too few hooks passed the checks")

  await db.mockActivity.update({ where: { id: rowId }, data: { metadata: { v: 1, status: "running", at: new Date().toISOString(), playbook: PLAYBOOK_VERSION, step: 2 } } }).catch(() => null)

  const scriptPrompt = `Write 12 short video ad scripts for ${who}, scene by scene, following the playbook. Mix lengths: about 5 short cuts of 5-10 seconds and 7 main cuts of 15-25 seconds. Mix formats, favouring kinetic text, notes/letters, POV one-liners and behind-the-scenes footage the owner can film on a phone. Every script uses one of the two angles and opens with a hook of the stated type. Visuals must be things the owner can really film or make (their own place, work, product, screen; kinetic text; licensed b-roll of objects). Each scene 1-3 seconds in the opening, 2-3 seconds after.

${playbookBrief()}

${RULES}

ANGLES
${plan.angles.map((a, i) => `${i + 1}. ${a.name}: ${a.why}`).join("\n")}

HOOKS ALREADY WRITTEN (reuse or adapt)
${hooks.ok.map((h) => `- [${h.type}] ${h.line}`).join("\n")}

FACTS
${facts}`

  const s = await anthropic.messages.parse({ model: MODEL, max_tokens: 16000, output_config: { effort: "medium", format: zodOutputFormat(ScriptSchema) }, messages: [{ role: "user", content: scriptPrompt }] })
  const scripts = keepLines<Script>((s.parsed_output?.scripts ?? []).map((x) => ({ ...x, seconds: Math.max(3, Math.min(90, Math.round(x.seconds))), hookSwaps: x.hookSwaps.slice(0, 3) })), scriptLines, allowed, brand)
  if (scripts.ok.length < 4) throw new Error("too few scripts passed the checks")

  // The static pictures, in the owner's image style (text card, their photos, Canva…).
  const metaStatics = meta.ok.slice(0, 4)
  for (const m of metaStatics) {
    const img = await postImageFor(user.id, { headline: m.imageHeadline || m.headline, topic: m.headline }).catch(() => null)
    Object.assign(m, { imageId: img?.id ?? null })
  }

  const local = plan.local
  const monthly = settings.autopilot?.adBudget && settings.autopilot.adBudget > 0 ? settings.autopilot.adBudget : null
  return {
    v: 1, status: "ready", at: new Date().toISOString(), playbook: PLAYBOOK_VERSION,
    business: { name: display ?? "Your business", vertical: plan.vertical, b2b: plan.b2b, local, markets: [user.city, user.state].filter(Boolean).join(", ") || (country === "CA" ? "Canada" : "United States") },
    angles: plan.angles.slice(0, 2),
    competitors: { looked: comp.looked, ads: comp.ads.slice(0, 6), cliches: comp.ads.length ? plan.cliches.slice(0, 5) : [], gaps: comp.ads.length ? plan.gaps.slice(0, 4) : [] },
    hooks: hooks.ok.slice(0, 30),
    scripts: scripts.ok,
    statics: { meta: metaStatics, linkedin: li.ok, google: { headlines: gh.ok.slice(0, 15), descriptions: gd.ok.slice(0, 4) } },
    testing: testingPlan({ monthly, currency: country === "CA" ? "CAD" : "USD", b2b: plan.b2b, local }),
    guardrails: { vertical: VERTICAL_RULES[plan.vertical] ?? [] },
    dropped: hooks.dropped + meta.dropped + li.dropped + gh.dropped + gd.dropped + scripts.dropped,
  }
}

// ── storage + background run ─────────────────────────────────────────────────

const inFlight = new Set<string>()
export const strategyRunning = (userId: string) => inFlight.has(userId)

export async function latestStrategy(userId: string): Promise<(AdStrategy & { rowId: string }) | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: AD_STRATEGY }, orderBy: { createdAt: "desc" } })
  return row ? { ...(row.metadata as AdStrategy), rowId: row.id } : null
}
export async function lastReadyStrategy(userId: string): Promise<AdStrategy | null> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: AD_STRATEGY }, orderBy: { createdAt: "desc" }, take: 5 })
  const r = rows.find((x) => (x.metadata as AdStrategy | null)?.status === "ready")
  return r ? (r.metadata as AdStrategy) : null
}

/** Starts a fresh plan in the background. False if one is already running. */
export function startStrategy(userId: string, opts: { credits?: boolean } = {}): boolean {
  if (inFlight.has(userId)) return false
  inFlight.add(userId)
  void runAsUser(userId, async () => {
    // One ad plan on the plan's quota (lib/quotas.ts ad_plan). Out of room: no row, nothing spent.
    const q = await checkQuota(userId, "ad_plan", { credits: opts.credits ?? false })
    if (!q.allowed) { console.warn("[ad-strategy] quota", userId, q.message); return }
    const start: AdStrategy = { v: 1, status: "running", at: new Date().toISOString(), playbook: PLAYBOOK_VERSION }
    const row = await db.mockActivity.create({ data: { userId, type: AD_STRATEGY, title: "Wrote your ad plan", metadata: start as object } })
    try {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error("no user")
      const out = await build(user, row.id)
      await db.mockActivity.update({ where: { id: row.id }, data: { metadata: out as object } })
    } catch (err) {
      console.error("[ad-strategy]", err instanceof Error ? err.message : err)
      await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...start, status: "failed", error: err instanceof Error ? err.message.slice(0, 200) : "failed" } as object } }).catch(() => null)
    }
  }).finally(() => inFlight.delete(userId))
  return true
}
