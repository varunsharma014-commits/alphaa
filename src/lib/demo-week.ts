// The public "first week" preview: after the free AI check on /start (or the homepage box),
// the visitor gives their email and the real agent writes their first week of marketing:
// 1 Google update and 2 social posts, in their own voice, with images in their own logo and
// colours, planned around what the AIs said about them and what's happening this week.
//
// Stored on the visitor's ScanLead (ogData.demoWeek, images in ogData.demoWeekImages), so it
// rides the existing lead pipeline (/signup?scan= carries it into the account).
// Limits: one run per email (a second ask shows the first one), 3 per IP a day, and a daily
// cap across everyone (DEMO_WEEK_DAILY_CAP, default 150).
import { createHmac } from "crypto"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { readBrandKit } from "@/lib/brand-kit"
import { analyzeVoiceFor, voiceText } from "@/lib/voice"
import { searchTrends, type Trend } from "@/lib/trends"
import { renderCardPng } from "@/lib/social-card"
import { writeSocialFrom } from "@/lib/content"
import { generateGbpPost } from "@/lib/gbp-poster"
import { numbers } from "@/lib/insights"

export type DemoItem = { kind: "google" | "social"; day: string; title: string; why: string; text?: string; image?: number | null; failed?: boolean }
export type DemoWeek = {
  v: 1
  status: "running" | "done" | "failed"
  startedAt: string
  finishedAt?: string
  ip: string
  email: string
  steps: { text: string; done: boolean }[]
  items: DemoItem[]
  trends: Trend[]
  brand?: { primary: string | null; logo: string | null } | null
  voiceName?: string | null
}

const MODEL = "claude-opus-5-5"
const DAY = 86_400_000
const CAP = () => Number(process.env.DEMO_WEEK_DAILY_CAP || 150)
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

function secret() { return process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev" }
export const demoImgSig = (leadId: string, n: number) => createHmac("sha256", secret()).update(`demo:${leadId}:${n}`).digest("hex").slice(0, 20)
export const demoImgUrl = (leadId: string, n: number) => `/api/scan/week/img?id=${leadId}&n=${n}&s=${demoImgSig(leadId, n)}`

export function demoOf(og: unknown): DemoWeek | null {
  return isRecord(og) && isRecord(og.demoWeek) && og.demoWeek.v === 1 ? (og.demoWeek as unknown as DemoWeek) : null
}

export type StartResult = { ok: true; leadId: string; again?: boolean } | { ok: false; status: number; error: string }

export async function startDemoWeek(leadId: string, ip: string): Promise<StartResult> {
  const lead = await db.scanLead.findUnique({ where: { id: leadId } })
  if (!lead) return { ok: false, status: 404, error: "I can’t find that check any more. Give me your website again." }
  if (!lead.email) return { ok: false, status: 403, error: "I need your email first." }
  const mine = demoOf(lead.ogData)
  if (mine) return { ok: true, leadId }
  // One per email: show the week that address already got.
  const prior = await db.scanLead.findFirst({ where: { email: lead.email, id: { not: lead.id }, ogData: { path: ["demoWeek", "v"], equals: 1 } }, orderBy: { createdAt: "desc" }, select: { id: true } })
  if (prior) return { ok: true, leadId: prior.id, again: true }
  const since = new Date(Date.now() - DAY)
  const [byIp, total] = await Promise.all([
    db.scanLead.count({ where: { createdAt: { gte: since }, ogData: { path: ["demoWeek", "ip"], equals: ip } } }),
    db.scanLead.count({ where: { createdAt: { gte: since }, ogData: { path: ["demoWeek", "v"], equals: 1 } } }),
  ])
  if (byIp >= 3) return { ok: false, status: 429, error: "You’ve had a few previews today. Start your plan and I’ll write the real thing every week." }
  if (total >= CAP()) return { ok: false, status: 503, error: "I’m writing a lot of first weeks right now. Leave it with me: I’ll email yours as soon as I can." }

  const week: DemoWeek = {
    v: 1, status: "running", startedAt: new Date().toISOString(), ip, email: lead.email,
    steps: [
      { text: "Reading your logo, colours and how you write", done: false },
      { text: `Looking up what’s happening this week${lead.city && lead.city !== "your area" ? ` in ${lead.city}` : ""}`, done: false },
      { text: "Planning your first week", done: false },
      { text: "Writing your Google update", done: false },
      { text: "Writing 2 social posts with your images", done: false },
    ],
    items: [], trends: [],
  }
  const og = isRecord(lead.ogData) ? lead.ogData : {}
  await db.scanLead.update({ where: { id: lead.id }, data: { ogData: { ...og, demoWeek: week } as object } })
  void runDemoWeek(lead.id, week).catch(async (err) => {
    console.error("[demo-week] failed", err)
    week.status = "failed"
    await saveWeek(lead.id, week).catch(() => null)
  })
  return { ok: true, leadId: lead.id }
}

async function saveWeek(leadId: string, week: DemoWeek, images?: string[]) {
  const row = await db.scanLead.findUnique({ where: { id: leadId }, select: { ogData: true } })
  const og = isRecord(row?.ogData) ? row!.ogData : {}
  await db.scanLead.update({ where: { id: leadId }, data: { ogData: { ...og, demoWeek: week, ...(images ? { demoWeekImages: images } : {}) } as object } })
}

const PlanSchema = z.object({
  items: z.array(z.object({
    kind: z.enum(["google", "social"]),
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    title: z.string().describe("The topic, under 70 characters"),
    why: z.string().describe("One sentence to the owner (“you”, “your”): why this, this week, citing the facts"),
    keys: z.array(z.string()),
  })),
})

/** Drop any fact key the model leaked into the text ("(ai:claude)", "t1"). */
const stripKeys = (s: string) => s.replace(/\s*\((?:ai:[a-z_]+|t\d+)(?:,\s*(?:ai:[a-z_]+|t\d+))*\)/gi, "").replace(/\b(?:ai:[a-z_]+|t\d)\b/gi, "").replace(/\s{2,}/g, " ").trim()

async function voiceWithRetry(site: string, name: string, industry: string | null) {
  for (let i = 0; i < 2; i++) {
    try {
      const v = await analyzeVoiceFor({ websiteUrl: site, businessName: name, businessType: industry })
      if (v) return v
    } catch (err) {
      console.error("[demo-week] voice", err instanceof Error ? err.message : err)
    }
  }
  return null
}

async function runDemoWeek(leadId: string, week: DemoWeek): Promise<void> {
  const lead = await db.scanLead.findUnique({ where: { id: leadId } })
  if (!lead) throw new Error("lead gone")
  const og = isRecord(lead.ogData) ? lead.ogData : {}
  const insights = isRecord(og.insights) ? og.insights : {}
  const industry = typeof insights.industry === "string" ? insights.industry : null
  const city = lead.city && lead.city !== "your area" ? lead.city : null
  const site = lead.businessUrl || null
  const name = lead.businessName || "your business"
  const step = async (i: number) => { week.steps[i].done = true; await saveWeek(leadId, week) }

  // 1 + 2: brand, voice and this week's news, in parallel.
  const [brand, voice, trends] = await Promise.all([
    site ? readBrandKit(site, { name: lead.businessName }).catch(() => null) : null,
    site ? voiceWithRetry(site, name, industry) : null,
    searchTrends({ businessName: name, businessType: industry, city, websiteUrl: site }).catch(() => [] as Trend[]),
  ])
  week.brand = brand ? { primary: brand.primary, logo: brand.logo } : null
  week.voiceName = voice?.options[0]?.name ?? null
  week.trends = trends
  week.steps[0].done = true
  await step(1)
  const vText = voice ? voiceText(voice) : null

  // Facts the plan may cite: what the AIs said, and what's happening.
  const facts: { key: string; text: string }[] = []
  const resp = isRecord(lead.engineResponses) ? lead.engineResponses : {}
  const names: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", google_ai: "Claude", perplexity: "Perplexity" }
  let q: string | null = typeof insights.query === "string" ? insights.query : null
  for (const [k, v] of Object.entries(resp)) {
    if (!isRecord(v)) continue
    q ??= typeof v.query === "string" ? v.query : null
    const mentioned = Array.isArray(v.mentioned) ? (v.mentioned as string[]).filter((m) => m.toLowerCase() !== name.toLowerCase()).slice(0, 2) : []
    facts.push({ key: `ai:${k}`, text: v.appeared ? `${names[k] ?? k} names ${name} when asked “${v.query ?? q}”.` : `${names[k] ?? k} doesn’t name ${name} when asked “${v.query ?? q}”${mentioned.length ? `; it names ${mentioned.join(" and ")}` : ""}.` })
  }
  trends.forEach((t, i) => facts.push({ key: `t${i + 1}`, text: `${t.title}${t.when ? ` (${t.when})` : ""}: ${t.why}` }))
  const desc = [typeof og.description === "string" ? og.description : "", typeof og.title === "string" ? og.title : ""].filter(Boolean).join(" · ").slice(0, 400)

  // 3: plan
  let items: DemoItem[] = []
  try {
    const msg = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(PlanSchema) },
      messages: [{ role: "user", content: `Plan the first week of marketing for ${name}${industry ? `, a ${industry}` : ""}${city ? ` in ${city}` : ""}${site ? ` (${site})` : ""}.${desc ? `\nTheir website says: ${desc}` : ""}

Create exactly 1 Google listing update and 2 social posts, spread over the next 7 days. Each should win customers: answer the question AI isn't naming them for, or tie into something happening this week (t1, t2…). Write "why" to the owner ("you") in plain words, never mentioning the fact keys, using only numbers that appear in the facts you cite. Titles must not promise facts the data doesn't give (prices, hours, offers). Never say "best", "#1" or "leading".
${vText ? `\n${vText}\n` : ""}
FACTS (key: text)
${facts.map((f) => `${f.key}: ${f.text}`).join("\n") || "none"}` }],
    })
    // Any number must come from the facts (all of them: the AI answers and this week's news).
    const allowed = new Set(facts.flatMap((f) => numbers(f.text)))
    items = (msg.parsed_output?.items ?? []).flatMap((i) => {
      const why = stripKeys(i.why)
      if (numbers(why).some((x) => !allowed.has(x)) || /\b(best|#1|leading)\b/i.test(`${i.title} ${why}`)) return []
      return [{ kind: i.kind, day: i.day, title: stripKeys(i.title).slice(0, 90), why: why.slice(0, 280) }]
    })
  } catch (err) {
    console.error("[demo-week] plan", err instanceof Error ? err.message : err)
  }
  const google = items.filter((i) => i.kind === "google").slice(0, 1)
  const social = items.filter((i) => i.kind === "social").slice(0, 2)
  if (!google.length) google.push({ kind: "google", day: "Tuesday", title: q ? `Answering: ${q.replace(/\bbest\b/gi, "good")}` : `What customers love about ${name}`, why: q ? "Customers ask AI this, so your Google listing should answer it." : "Keeps your Google listing active." })
  while (social.length < 2) social.push({ kind: "social", day: social.length ? "Friday" : "Wednesday", title: social.length ? `A day at ${name}` : `Why customers choose ${name}`, why: "Keeps you in front of customers this week." })
  const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  week.items = [...google, ...social].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day))
  await step(2)

  // 4: Google update
  const factsBlock = [`Business: ${name}`, industry ? `Type: ${industry}` : "", city ? `Location: ${city}` : "", site ? `Website: ${site}` : "", desc ? `About them (their words): ${desc}` : "", vText ?? ""].filter(Boolean).join("\n")
  const g = week.items.find((i) => i.kind === "google")!
  try {
    const out = await generateGbpPost(name, industry ?? "local business", city ?? "", "UPDATE", `${g.title}. ${g.why}`, vText)
    g.text = out.content
  } catch { g.failed = true }
  await step(3)

  // 5: social posts + images
  const images: string[] = []
  for (const it of week.items.filter((i) => i.kind === "social")) {
    try {
      const sp = await writeSocialFrom(factsBlock, it.title, it.why)
      it.text = sp.text
      const png = await renderCardPng({ headline: sp.headline, businessName: name, brand: week.brand }).catch(() => null)
      if (png) { images.push(png.toString("base64")); it.image = images.length - 1 }
    } catch { it.failed = true }
  }
  week.steps[4].done = true
  week.status = "done"
  week.finishedAt = new Date().toISOString()
  await saveWeek(leadId, week, images)
}

/** The run for the browser: no IP or email, images as signed URLs. */
export function publicWeek(leadId: string, w: DemoWeek) {
  return {
    status: w.status,
    steps: w.steps,
    trends: w.trends,
    voiceName: w.voiceName ?? null,
    items: w.items.map((i) => ({ kind: i.kind, day: i.day, title: i.title, why: i.why, text: i.text ?? null, failed: !!i.failed, image: typeof i.image === "number" ? demoImgUrl(leadId, i.image) : null })),
  }
}
export type PublicWeek = ReturnType<typeof publicWeek>
