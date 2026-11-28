// One Facebook + Instagram campaign proposed from the business's real facts. Opus picks the goal
// and writes 2-3 ads; code decides the audience (their city), the budget (the owner's cap, or a
// starting amount the owner must approve) and checks every claim. Nothing goes to Meta here.
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { factsOf } from "@/lib/content"
import { voiceFor } from "@/lib/voice"
import { finishMetaAd, flagNote, rulesHere, withRules } from "@/lib/guardrails"
import { latestInsights } from "@/lib/insights"
import { BANNED, checkAds, clean, countryOf, numbers, specialFor } from "./rules"
export { BANNED, checkAds, countryOf, specialFor } from "./rules"
import { nicheFacts } from "@/lib/niche-posts"
import { getAgentSettings } from "@/lib/agent/settings"
import { postImageFor } from "@/lib/post-images"
import { findCity, type Goal, type SpecialCategory } from "./graph"
import { createCampaign, saveCampaign, decToken, getAccess, listCampaigns, liveCampaigns, type MetaCampaign, type MetaPlan, type PlannedAd } from "./store"

const anthropic = claudeFor("meta-ads")

const MODEL = "claude-opus-5-5"
const DAYS_PER_MONTH = 30.4
/** The starting daily amount I suggest when the owner hasn't set a budget. They change it before anything is built. */
export const SUGGESTED_DAILY = 10

/**
 * Monthly amount Meta may use: the owner's cap (autopilot.adBudget, shared by Google and Meta)
 * minus what the Google Ads campaign (lib/gads) is set to spend. Null when no cap is set.
 */
export async function metaMonthlyCap(userId: string): Promise<number | null> {
  const s = await getAgentSettings(userId)
  const cap = s.autopilot?.adBudget
  if (!cap || cap <= 0) return null
  const g = await import("@/lib/gads/store").then((m) => m.getGadsAccount(userId)).catch(() => null)
  const google = g?.status === "active" && g.campaign ? monthlyFromDaily(g.campaign.daily) : 0
  return Math.max(0, Math.round((cap - google) * 100) / 100)
}
export const dailyFromMonthly = (m: number) => Math.floor((m / DAYS_PER_MONTH) * 100) / 100
export const monthlyFromDaily = (d: number) => Math.round(d * DAYS_PER_MONTH * 100) / 100

/** What every Meta campaign I run commits per month (the Google Ads side can subtract it). */
export async function metaMonthlyCommitment(userId: string): Promise<number> {
  const live = liveCampaigns(await listCampaigns(userId, 50))
  return monthlyFromDaily(live.reduce((t, c) => t + c.plan.dailyBudget, 0))
}

const Schema = z.object({
  goal: z.enum(["OUTCOME_LEADS", "OUTCOME_TRAFFIC"]).describe("OUTCOME_LEADS = an instant form on Facebook/Instagram collects name, email and phone; OUTCOME_TRAFFIC = people go to the website"),
  why: z.string().describe("One sentence to the owner (you/your): why this campaign, citing the facts"),
  keys: z.array(z.string()).describe("Fact keys this rests on"),
  special: z.enum(["NONE", "HOUSING", "EMPLOYMENT", "FINANCIAL_PRODUCTS_SERVICES"]).describe("Meta special ad category if the business advertises housing, jobs, credit, loans, insurance or other financial products; else NONE"),
  ads: z.array(z.object({
    primaryText: z.string().describe("The main text above the image, 1-3 short sentences, under 125 characters"),
    headline: z.string().describe("Under 40 characters"),
    description: z.string().describe("Under 30 characters"),
    imageHeadline: z.string().describe("4-5 words drawn on the image"),
  })),
})

type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

/** Fact lines: profile (k:*), what's working (insights keys) and the niche (niche:*). */
async function factLines(user: U): Promise<{ key: string; text: string }[]> {
  const [voice, ins, niche] = await Promise.all([voiceFor(user.id).catch(() => null), latestInsights(user.id).catch(() => null), nicheFacts(user.id).catch(() => [])])
  const profile = factsOf(user, null).split("\n").map((t, i) => ({ key: `p${i + 1}`, text: t }))
  return [
    ...profile,
    ...(ins ? [...ins.working, ...ins.notWorking, ...ins.niche] : []),
    ...niche,
    ...(voice ? [{ key: "voice", text: voice.replace(/\n/g, " ") }] : []),
  ]
}

export type PlanResult = { ok: true; campaign: MetaCampaign } | { ok: false; reason: string }

/** Under the brand's guardrails (lib/guardrails.ts): banned words drop ads, the ads disclaimer is added where it fits. */
export function proposePlan(userId: string): Promise<PlanResult> {
  return withRules(userId, "ads", () => proposePlanUnruled(userId))
}

async function proposePlanUnruled(userId: string): Promise<PlanResult> {
  const [user, access, existing] = await Promise.all([db.user.findUnique({ where: { id: userId } }), getAccess(userId), listCampaigns(userId, 50)])
  if (!user) return { ok: false, reason: "I couldn’t find your account." }
  if (!access?.picks.adAccountId || !access.picks.pageId) return { ok: false, reason: "Pick your ad account and Facebook Page first." }
  const acct = access.adAccounts.find((a) => a.id === access.picks.adAccountId)
  if (!acct) return { ok: false, reason: "That ad account isn’t shared with me any more. Reconnect Facebook & Instagram." }
  if (!user.city?.trim()) return { ok: false, reason: "Add your city to your profile first, so I only show your ads to people near you." }

  // Budget: inside the owner's cap, after what's already running.
  const cap = await metaMonthlyCap(userId)
  const committed = liveCampaigns(existing).reduce((t, c) => t + c.plan.dailyBudget, 0)
  let dailyBudget = SUGGESTED_DAILY
  let budgetSource: MetaPlan["budgetSource"] = "suggested"
  if (cap !== null) {
    const room = dailyFromMonthly(cap) - committed
    if (room < 1) return { ok: false, reason: cap === 0 ? "Your Google Ads campaign already uses your whole monthly ad budget. Raise it in “What I do without asking” first." : `Your ads already use the ${cap.toLocaleString("en-US")} a month left for Facebook & Instagram. Raise your budget in “What I do without asking” or pause a campaign first.` }
    dailyBudget = room >= 5 ? Math.floor(room) : room
    budgetSource = "autopilot"
  }

  const facts = await factLines(user)
  const factText = facts.map((f) => f.text).join("\n")
  const byKey = new Map(facts.map((f) => [f.key, f.text]))
  const site = user.websiteUrl?.trim() ? `https://${user.websiteUrl.replace(/^https?:\/\//, "")}` : null

  const prompt = `You plan one Facebook and Instagram ad campaign for ${user.businessName ?? "a local business"}${user.businessType ? `, a ${user.businessType}` : ""} in ${user.city}${user.state ? `, ${user.state}` : ""}. The ads only show to adults near the business.

Pick the goal: OUTCOME_LEADS (an instant form on Facebook/Instagram collects name, email and phone, good when customers book, ask for a quote or call) or OUTCOME_TRAFFIC (people visit the website, good when they buy or book online).${site ? "" : " The business has no website: use OUTCOME_LEADS."}
Write 2 or 3 different ads, each a different angle (a service, a customer question, a local reason). Use only facts given below. Never mention prices, discounts, offers, hours, years, ratings, awards or guarantees unless they appear in the facts. Never say "best", "#1", "leading", "top-rated" or "cheapest". No hashtags, no dashes. No claims about the reader's personal traits (age, health, finances, religion, etc.). Speak to the customer.
Set special to HOUSING, EMPLOYMENT or FINANCIAL_PRODUCTS_SERVICES when the business advertises housing, jobs, or credit, loans, insurance or other financial products. Otherwise NONE.
In "why", use only numbers that appear in the facts you cite in "keys".

FACTS (key: text)
${facts.map((f) => `${f.key}: ${f.text}`).join("\n")}`

  let ads: PlannedAd[] = []
  let out: z.infer<typeof Schema> | null = null
  for (let attempt = 0; attempt < 2 && ads.length < 2; attempt++) {
    const msg = await anthropic.messages.parse({ model: MODEL, max_tokens: 4000, output_config: { effort: "medium", format: zodOutputFormat(Schema) }, messages: [{ role: "user", content: prompt }] })
    out = msg.parsed_output ?? null
    if (out) ads = checkAds(out.ads, factText)
  }
  if (!out || ads.length < 2) return { ok: false, reason: "I couldn’t write ads I can stand behind from what I know about you yet. Tell me more about your services and try again." }

  const keys = out.keys.filter((k) => byKey.has(k))
  const allowed = new Set(keys.flatMap((k) => numbers(byKey.get(k)!)))
  const why = keys.length && !numbers(out.why).some((n) => !allowed.has(n)) && !BANNED.test(out.why) ? clean(out.why, 300) : "Ads near you, written from what your website says you do."
  const special: SpecialCategory = out.special !== "NONE" ? out.special : specialFor(user.businessType)
  const goal: Goal = site ? out.goal : "OUTCOME_LEADS"
  const country = countryOf(user.state)
  const token = decToken(access)
  const city = await findCity(token, user.city, country).catch(() => null)

  // The owner's ads disclaimer, on every ad it fits (Meta primary text, our 300-character cap).
  const rules = rulesHere()
  const notes: string[] = []
  if (rules) {
    for (const a of ads) {
      const f = finishMetaAd(a.primaryText, rules)
      a.primaryText = f.text
      for (const fl of f.flags) { const n = flagNote(fl, "ads"); if (n && !notes.includes(n)) notes.push(n) }
    }
  }

  // The pictures: the owner's image style (text card, their photos, Canva…), JPEG.
  for (const a of ads) {
    const img = await postImageFor(userId, { headline: a.imageHeadline || a.headline, topic: a.headline }).catch(() => null)
    a.imageId = img?.id ?? null
  }

  const plan: MetaPlan = {
    goal, why, keys, special, city, cityLabel: city ? [city.name, city.region].filter(Boolean).join(", ") : user.city, country,
    radiusMiles: special !== "NONE" ? 15 : 10,
    dailyBudget, budgetSource, monthlyCap: cap, ads,
    ...(notes.length ? { notes } : {}),
  }
  const name = `${(user.businessName ?? "Alphaa").slice(0, 60)} · ${goal === "OUTCOME_LEADS" ? "leads" : "website visits"} · ${new Date().toISOString().slice(0, 10)}`
  // A new proposal replaces an older unapproved one.
  for (const c of existing.filter((c) => c.status === "proposed")) {
    await saveCampaign(userId, { ...c, status: "dismissed" })
  }
  const campaign = await createCampaign(userId, { status: "proposed", name, adAccountId: acct.id, currency: acct.currency, pageId: access.picks.pageId, plan, createdAt: new Date().toISOString(), privacyUrl: site ? `${site.replace(/\/$/, "")}/privacy` : null })
  return { ok: true, campaign }
}
