// "Run my marketing for this week": one command, the agent does the week.
//   1. Brand (logo, colours) and voice   2. The numbers (what's working)   3. What's happening
//   this week (live web search)   4. A plan that cites the data   5. Write every piece, in the
//   owner's voice, with branded images   6. Publish what the owner allowed (autopilot), leave the
//   rest waiting for one tap.
// Runs in the background; progress is saved on a MockActivity row ("week_run") that the chat
// polls, so every step shows up live.
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasGrowth, hasPro } from "@/lib/billing"
import { ensureVoice, voiceText } from "@/lib/voice"
import { ensureBrandKit } from "@/lib/brand-kit"
import { renderSocialCard } from "@/lib/social-card"
import { postImageFor } from "@/lib/post-images"
import { latestInsights, insightsFresh, buildInsights, numbers, type Insights } from "@/lib/insights"
import { trendsFor, type Trend } from "@/lib/trends"
import { nicheFacts } from "@/lib/niche-posts"
import { writePost, writeSocial } from "@/lib/content"
import { generatePostImage } from "@/lib/images"
import { generateGbpPost, containsPlaceholders } from "@/lib/gbp-poster"
import { approveSitePost } from "@/lib/approvals"
import { isQuotaError, requireQuota } from "@/lib/quotas"
import { GuardrailError } from "@/lib/guardrails"
import { listAccounts, createPost } from "@/lib/social/store"
import { PLATFORM_NAME } from "@/lib/social/types"

const anthropic = claudeFor("week-run")

export const WEEK_RUN = "week_run"
const MODEL = "claude-opus-5-5"
const DAY = 86_400_000

export type WeekKind = "blog" | "google" | "social"
export type WeekItem = {
  kind: WeekKind
  day: string
  title: string
  why: string
  status: "writing" | "ready" | "published" | "scheduled" | "failed"
  text?: string
  image?: string | null
  href?: string | null
  draftId?: string
  postId?: string
  /** Social: the queued post on the owner's connected accounts. */
  socialId?: string
  socialStatus?: "draft" | "scheduled"
  socialWhere?: string[]
}
export type WeekRun = {
  status: "running" | "done" | "failed"
  startedAt: string
  finishedAt?: string
  steps: { text: string; done: boolean }[]
  items: WeekItem[]
  trends: Trend[]
  notes: string[]
  summary?: string
  /** One short sentence to read aloud when the owner asked by voice. */
  spoken?: string
  siteConnected?: boolean
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
/** The date of the next `day` (today counts), at 13:00 UTC: when the Google post cron runs. */
function dateFor(day: string): Date {
  const want = WEEKDAYS.indexOf(day)
  const d = new Date()
  d.setUTCHours(13, 0, 0, 0)
  for (let i = 0; i < 8; i++) {
    if (d.getUTCDay() === want && d.getTime() > Date.now() - 3_600_000) return d
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return new Date()
}

const PlanSchema = z.object({
  items: z.array(z.object({
    kind: z.enum(["blog", "google", "social"]),
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    title: z.string().describe("The topic or headline of the piece, under 70 characters"),
    why: z.string().describe("One sentence to the owner, using “you” and “your”: why this, this week, citing the data or the trend"),
    keys: z.array(z.string()).describe("Fact keys (from FACTS) and trend keys (t1, t2…) this rests on"),
  })),
})

async function plan(userId: string, ctx: { insights: Insights | null; trends: Trend[]; voice: string | null; google: boolean; social: boolean }): Promise<WeekItem[]> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true } })
  const recent = await db.mockActivity.findMany({ where: { userId, type: { in: ["post_draft", "draft_written"] } }, orderBy: { createdAt: "desc" }, take: 20, select: { title: true } })
  const facts = [
    ...(ctx.insights ? [...ctx.insights.working, ...ctx.insights.notWorking, ...ctx.insights.niche] : []),
    ...ctx.trends.map((t, i) => ({ key: `t${i + 1}`, text: `${t.title}${t.when ? ` (${t.when})` : ""}: ${t.why}` })),
    // Optional: posts and ads doing well in the owner's niche this week (lib/niche-posts.ts).
    ...(ctx.social ? await nicheFacts(userId).catch(() => []) : []),
  ]
  const ideas = ctx.insights?.ideas ?? []
  const want = [`1 blog post`, ctx.google ? `2 Google listing updates (on Monday, Tuesday, Thursday or Friday)` : null, ctx.social ? `3 social posts` : null].filter(Boolean).join(", ")
  const byKey = new Map(facts.map((f) => [f.key, f.text]))
  try {
    const msg = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 6000,
      output_config: { effort: "medium", format: zodOutputFormat(PlanSchema) },
      messages: [{
        role: "user",
        content: `Plan this week's marketing for ${user?.businessName ?? "a small business"}${user?.businessType ? `, a ${user.businessType}` : ""}${user?.city ? ` in ${user.city}` : ""}. Today is ${WEEKDAYS[new Date().getUTCDay()]}.

Create exactly: ${want}. Spread them across the next 7 days.
Each piece must build on the facts: what's working (do more of it), what isn't (fix it), what competitors or AI answers show customers want, or something timely this week (trends t1, t2…). Prefer the ideas already suggested when they fit. Mix topics; don't repeat recent pieces: ${recent.map((r) => r.title).join("; ") || "none"}.
Write "why" to the business owner ("your page", "you rank"), never "we" or "our", and never mention the fact keys. Keep titles under 70 characters. In "why", use only numbers that appear in the facts you cite. Titles must not promise facts the data doesn't give (prices, hours, offers). Never say "best", "#1" or "leading".
${ctx.voice ? `\n${ctx.voice}\n` : ""}Facts keyed niche:… are other accounts' posts doing well in this niche: use them only to shape a social post's format or angle, never copy them or name those accounts.

FACTS (key: text)
${facts.map((f) => `${f.key}: ${f.text}`).join("\n") || "none"}

SUGGESTED IDEAS
${ideas.map((i) => `- [${i.format}] ${i.title}: ${i.why}`).join("\n") || "none"}`,
      }],
    })
    const items = (msg.parsed_output?.items ?? []).flatMap((i) => {
      if (i.kind === "google" && !ctx.google) return []
      if (i.kind === "social" && !ctx.social) return []
      const keys = i.keys.filter((k) => byKey.has(k))
      const allowed = new Set(keys.flatMap((k) => numbers(byKey.get(k)!)))
      if (numbers(i.why).some((x) => !allowed.has(x))) return []
      if (/\b(best|#1|leading)\b/i.test(`${i.title} ${i.why}`)) return []
      return [{ kind: i.kind, day: i.day, title: i.title.trim().slice(0, 90), why: i.why.trim().slice(0, 300), status: "writing" as const }]
    })
    if (items.length) return items.slice(0, 6)
  } catch (err) {
    console.error("[week] plan failed", err instanceof Error ? err.message : err)
  }
  // Fallback: the ideas from the numbers.
  return ideas.filter((i) => (i.format !== "google" || ctx.google) && (i.format !== "social" || ctx.social)).slice(0, 4)
    .map((i, k) => ({ kind: i.format, day: ["Monday", "Tuesday", "Thursday", "Friday"][k], title: i.title, why: i.why, status: "writing" as const }))
}

export async function startWeekRun(userId: string): Promise<string> {
  // One weekly plan on the plan's quota (lib/quotas.ts week_run). Throws a QuotaError when out.
  await requireQuota(userId, "week_run")
  const run: WeekRun = { status: "running", startedAt: new Date().toISOString(), steps: [{ text: "Reading your brand: logo, colours and voice", done: false }], items: [], trends: [], notes: [] }
  const row = await db.mockActivity.create({ data: { userId, type: WEEK_RUN, title: "Ran your marketing for the week", metadata: run as object } })
  void runWeek(userId, row.id, run).catch(async (err) => {
    console.error("[week] failed", err)
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...run, status: "failed", finishedAt: new Date().toISOString() } as object } }).catch(() => null)
  })
  return row.id
}

async function runWeek(userId: string, id: string, run: WeekRun): Promise<void> {
  const save = () => db.mockActivity.update({ where: { id }, data: { metadata: run as object } })
  const step = async (text: string) => { run.steps.push({ text, done: false }); await save() }
  const done = async () => { const s = run.steps.find((x) => !x.done); if (s) s.done = true; await save() }

  const user = await db.user.findUnique({ where: { id: userId }, include: { integration: true } })
  if (!user) throw new Error("no user")
  const s = await getAgentSettings(userId)
  // Social posts and Google listing updates are Pro and up (2026-11-26); Starter gets the blog post.
  const growth = hasPro(user)
  const google = growth && !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)
  const siteConnected = !!(s.wp || s.site)
  const auto = !!s.autoPublishPosts && /pro|full|growth/i.test(user.plan)
  run.siteConnected = siteConnected

  // 1. Brand + voice
  const [brand, voice] = await Promise.all([ensureBrandKit(userId).catch(() => null), ensureVoice(userId).catch(() => null)])
  const voiceStr = voice ? voiceText(voice) : null
  await done()

  // 2 + 3. The numbers, and what's happening this week (in parallel; the web search is the slow one).
  run.steps.push({ text: "Checking what’s working: your Google searches, website visits and what AI says", done: false }, { text: `Looking up what’s happening this week${user.city ? ` in ${user.city}` : ""} and in your industry`, done: false })
  await save()
  const markDone = async (prefix: string) => { const st = run.steps.find((x) => x.text.startsWith(prefix)); if (st) st.done = true; await save() }
  const [insights, trends] = await Promise.all([
    (async () => {
      let i = await latestInsights(userId)
      if (!insightsFresh(i)) i = await buildInsights(userId).catch(() => i)
      await markDone("Checking what’s working")
      return i
    })(),
    (async () => {
      const t = await trendsFor(userId).catch((err) => { console.error("[week] trends", err instanceof Error ? err.message : err); return [] as Trend[] })
      await markDone("Looking up what’s happening")
      return t
    })(),
  ])
  run.trends = trends

  // 4. Plan
  await step("Planning your week")
  run.items = await plan(userId, { insights, trends: run.trends, voice: voiceStr, google, social: growth })
  await done()
  const label: Record<WeekKind, string> = { blog: "the blog post", google: "the Google update", social: "the social post" }
  for (const it of run.items) run.steps.push({ text: `Writing ${label[it.kind]}: “${it.title}”`, done: false })
  await save()

  // 5. Write (and publish what's allowed)
  const finish = async (it: WeekItem) => {
    const st = run.steps.find((x) => x.text.endsWith(`“${it.title}”`) && !x.done)
    if (st) st.done = true
    await save()
  }
  const write = async (it: WeekItem) => {
    try {
      if (it.kind === "blog") {
        const p = await writePost(user, it.title, { noPlaceholders: auto && siteConnected })
        const img = await generatePostImage(userId, { title: p.title, businessType: user.businessType, city: user.city })
        const row = await db.mockActivity.create({ data: { userId, type: "post_draft", title: `Drafted a post: “${p.title}”`, metadata: { ...p, status: "ready", imageId: img?.id ?? null, week: id } } })
        Object.assign(it, { title: p.title, text: p.markdown, image: img?.url ?? null, draftId: row.id, status: "ready" })
        if (auto && siteConnected && !containsPlaceholders(p.markdown)) {
          const r = await approveSitePost(userId, row.id)
          if (r.ok) Object.assign(it, { status: "published", href: r.url ?? null })
        }
      } else if (it.kind === "google") {
        const g = await generateGbpPost(user.integration?.gmbLocationName ?? user.businessName ?? "Our Business", user.businessType ?? "local business", user.city ?? "", "UPDATE", `${it.title}. ${it.why}`, voiceStr)
        const ok = auto && !containsPlaceholders(g.content)
        const post = await db.gbpPost.create({ data: { userId, content: g.content, postType: "UPDATE", status: ok ? "scheduled" : "draft", scheduledFor: ok ? dateFor(it.day) : null } })
        Object.assign(it, { text: g.content, postId: post.id, status: ok ? "scheduled" : "ready" })
      } else {
        const sp = await writeSocial(user, it.title, it.why)
        // In the owner's image style (text card / their photos / AI picture / Canva), text card as the fallback.
        const card = await postImageFor(userId, { headline: sp.headline, topic: it.title }).catch(() => renderSocialCard(userId, { headline: sp.headline, businessName: user.businessName, brand }).catch(() => null))
        await db.mockActivity.create({ data: { userId, type: "draft_written", title: `Wrote a social post: “${it.title}”`, metadata: { topic: it.title, text: sp.text, kind: "social", imageId: card?.id ?? null, week: id, day: it.day } } })
        Object.assign(it, { text: sp.text, image: card?.url ?? null, status: "ready" })
        // Queue it on the connected accounts: scheduled if the owner lets me post without asking.
        const accounts = (await listAccounts(userId)).filter((a) => a.status === "active" && (card || (a.platform !== "instagram" && a.platform !== "tiktok")))
        if (accounts.length) {
          const auto = s.autopilot?.social === "auto"
          const when = dateFor(it.day)
          when.setUTCHours(15, 0, 0, 0)
          const q = await createPost(userId, { text: sp.text, imageId: card?.id ?? null, accountIds: accounts.map((a) => a.id), status: auto ? "scheduled" : "draft", scheduledFor: when.toISOString(), source: "week", title: it.title })
          Object.assign(it, { socialId: q.id, socialStatus: auto ? "scheduled" : "draft", socialWhere: Array.from(new Set(accounts.map((a) => PLATFORM_NAME[a.platform]))), status: auto ? "scheduled" : "ready" })
        }
      }
    } catch (err) {
      // Out of this kind for the week/month: say so in the notes instead of a silent failure.
      if (isQuotaError(err) || err instanceof GuardrailError) { if (!run.notes.includes(err.message)) run.notes.push(err.message) }
      else console.error("[week] write failed", it.kind, err instanceof Error ? err.message : err)
      it.status = "failed"
    }
    await finish(it)
  }
  const blog = run.items.filter((i) => i.kind === "blog")
  await Promise.all([...blog.map(write), (async () => { for (const it of run.items.filter((i) => i.kind !== "blog")) await write(it) })()])

  // 6. Notes and summary
  const reviews = google ? await db.gmbReview.count({ where: { userId, reply: null, publishedAt: { gte: new Date(Date.now() - 60 * DAY) } } }) : 0
  if (reviews) run.notes.push(s.autopilot?.reviews && s.autopilot.reviews !== "ask" ? `I’m replying to your ${reviews} new ${reviews === 1 ? "review" : "reviews"} overnight, the way you told me to.` : `${reviews} new ${reviews === 1 ? "review is" : "reviews are"} waiting for a reply. I’ve written them; they’re on your home screen.`)
  // Google posts are Pro and up (2026-11-26): only nudge Pro users to connect.
  if (!google && growth) run.notes.push("Connect your Google listing and I’ll add 4 Google updates every week, so you show up when people nearby search for what you do.")
  if (!growth) run.notes.push("Want me to post on your social media and Google listing, reply to your reviews and email your past customers too? That’s the Pro plan.")
  else if (!hasGrowth(user)) run.notes.push("Want me to run your Google and Meta ads too? That’s the Growth plan, in early access.")
  else run.notes.push("Your ads join the week as soon as Google and Meta approve Alphaa. I’ll tell you here when they do.")
  const live = run.items.filter((i) => i.status === "published" || i.status === "scheduled").length
  const waiting = run.items.filter((i) => i.status === "ready").length
  const count = (k: WeekKind, one: string, many: string) => { const n = run.items.filter((i) => i.kind === k && i.status !== "failed").length; return n ? `${n} ${n === 1 ? one : many}` : null }
  const parts = [count("blog", "blog post", "blog posts"), count("google", "Google update", "Google updates"), count("social", "social post", "social posts")].filter(Boolean)
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0]
  run.summary = list
    ? `This week you’ll show up with ${list}, each aimed at customers your numbers say you’re missing or at what people care about right now.${live ? ` ${live} ${live === 1 ? "is" : "are"} already live or scheduled.` : ""}${waiting ? ` ${waiting} just ${waiting === 1 ? "needs" : "need"} your OK.` : ""}`
    : "I couldn’t write this week’s pieces this time. Nothing was published."
  run.spoken = list ? `Done. Your marketing for this week is ready.${live ? ` ${live} ${live === 1 ? "is" : "are"} live.` : ""}${waiting ? ` ${waiting} just ${waiting === 1 ? "needs" : "need"} your OK.` : ""}` : "Sorry, I couldn’t finish this week’s marketing. Nothing was published."
  run.status = "done"
  run.finishedAt = new Date().toISOString()
  for (const st of run.steps) st.done = true
  await save()
}

export async function getWeekRun(userId: string, id: string): Promise<WeekRun | null> {
  const row = await db.mockActivity.findFirst({ where: { id, userId, type: WEEK_RUN }, select: { metadata: true } })
  return (row?.metadata as WeekRun | null) ?? null
}
