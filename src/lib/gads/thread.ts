// The "Ads" thread: connect Google Ads, pick the ad account, the campaign plan to approve,
// "Turn it on?", the numbers for the last 7/30 days, the weekly tune-up and every change I made.
import type { User } from "@prisma/client"
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { hasGrowth } from "@/lib/billing"
import { getAgentSettings } from "@/lib/agent/settings"
import { gadsAvailable } from "./oauth"
import { adsErrorText, gadsFor } from "./client"
import { getGadsAccount, latestPlan, latestTune, recentChanges, takeNote, type GadsAccount, type Tune } from "./store"
import { adsReport, type AdsTotals } from "./report"
import { money } from "./plan"
import { monthlyFromDaily } from "./rules"
import type { AdPlan } from "./plan-types"

const op = (body: Record<string, string | number | boolean>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "ads", body } })
export const connectAdsChip = (label = "Connect Google Ads"): Chip => ({ label, primary: true, action: { type: "link", href: "/api/gads/connect" } })
const n = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 1 })

export async function adsMessages(user: User, note?: string | null): Promise<Message[]> {
  if (!hasGrowth(user)) {
    return [agent([
      { kind: "text", text: "Google Ads for people already searching for what you sell.", big: true },
      { kind: "text", text: "On the Growth plan (early access while Google approves ads access) I build a Google Ads campaign from what your customers already search for, you approve it, and I tune it every week inside your budget." },
      { kind: "chips", items: [{ label: "See the Growth plan", action: { type: "link", href: "/dashboard/upgrade?plan=growth" }, primary: true }] },
    ], "ad-upgrade")]
  }
  if (!gadsAvailable(user)) {
    return [agent([
      { kind: "text", text: "Google Ads opens soon.", big: true },
      { kind: "text", text: "I’ll build your first campaign from the searches that already find you, and you approve every step before a cent is spent. Meanwhile, set your monthly ad budget in “What I do without asking”." },
      { kind: "chips", items: [{ label: "Set my ad budget", action: { type: "thread", topic: "autopilot" } }] },
    ], "ad-soon")]
  }
  const [acc, saved] = await Promise.all([getGadsAccount(user.id), note === undefined ? takeNote(user.id) : Promise.resolve(null)])
  const out: Message[] = []
  const shown = note ?? saved
  if (shown) out.push(agent([{ kind: "text", text: shown }], "ad-note"))

  if (!acc || acc.status !== "active") {
    out.push(agent([
      { kind: "text", text: acc ? "Google Ads needs reconnecting." : "Bring in customers who are searching right now.", big: true },
      { kind: "text", text: "Connect your Google Ads account and I’ll plan a campaign from the searches that already find you. Nothing goes live until you say so, and you sign in on Google itself: I never see your password." },
      { kind: "chips", items: [connectAdsChip(acc ? "Reconnect Google Ads" : "Connect Google Ads")] },
    ], "ad-connect"))
    return out
  }

  if (!acc.customerId) {
    const choices = acc.choices ?? []
    out.push(agent(choices.length ? [
      { kind: "text", text: "Which ad account should I use?", big: true },
      { kind: "chips", items: choices.slice(0, 10).map((c, i) => op({ op: "pick", customerId: c.id }, `${c.name} (${c.currency})${c.test ? " · test" : ""}`, i === 0)) },
    ] : [
      { kind: "text", text: "I couldn’t find an ad account on that Google login.", big: true },
      { kind: "text", text: "Create one on ads.google.com (it takes a few minutes and asks for billing details), then come back and tap Check again." },
      { kind: "chips", items: [{ label: "Open Google Ads", action: { type: "link", href: "https://ads.google.com" } }, connectAdsChip("Check again")] },
    ], "ad-pick"))
    out.push(manage())
    return out
  }

  const [plan, tune, changes, s] = await Promise.all([latestPlan(user.id), latestTune(user.id), recentChanges(user.id), getAgentSettings(user.id)])
  const cap = s.autopilot?.adBudget ?? null
  const c = acc.campaign
  const cur = acc.currency ?? "USD"

  if (!c) {
    if (plan?.status === "proposed" && plan.customerId === acc.customerId) out.push(...planMessages(plan))
    else out.push(agent([
      { kind: "text", text: `Connected to ${acc.customerName ?? "your ad account"}.`, big: true },
      { kind: "text", text: plan?.status === "failed" ? `Google didn’t accept the last one: ${plan.error ?? "unknown error"}. I can plan it again.` : "Want me to plan your first campaign? I’ll use your real Google searches and check every keyword with Google’s own numbers. You see it all before anything is created." },
      { kind: "chips", items: [op({ op: "plan" }, "Plan my first campaign", true)] },
    ], "ad-start"))
  } else {
    out.push(...(await liveMessages(user.id, acc, cur, cap)))
    if (tune) out.push(...tuneMessages(tune))
  }

  if (changes.length) out.push(agent([{ kind: "log", title: "Changes I made in Google Ads", sub: `${changes.length} most recent`, items: changes.map((r) => ({ text: r.title, at: r.createdAt.toISOString() })) }], "ad-log"))
  out.push(manage())
  return out
}

const manage = () => agent([{ kind: "chips", items: [op({ op: "disconnect" }, "Disconnect Google Ads")] }], "ad-manage")

export function planMessages(p: AdPlan): Message[] {
  const kws = p.adGroups.flatMap((g) => g.keywords)
  const searched = kws.filter((k) => (k.searches ?? 0) > 0)
  const total = searched.reduce((t, k) => t + (k.searches ?? 0), 0)
  const head: Block[] = [
    { kind: "text", text: "Here’s the campaign I’d run for you.", big: true },
    { kind: "text", text: p.keywordCheck === "checked" && searched.length ? `${kws.length} searches your customers type, about ${n(total)} searches a month near you by Google’s count. Your ad shows ${p.location.label}.` : `${kws.length} searches your customers type. Your ad shows ${p.location.label}.` },
  ]
  if (p.why.length) head.push({ kind: "receipt", title: "Why this campaign", items: p.why })
  const out: Message[] = [agent(head, "ad-plan")]
  p.adGroups.forEach((g, i) => {
    out.push(agent([
      { kind: "sources", title: `Searches: ${g.name}`, limit: 8, items: g.keywords.map((k) => ({ name: k.match === "EXACT" ? `[${k.text}]` : `“${k.text}”`, detail: k.match === "EXACT" ? "exactly this" : "this phrase", status: k.searches == null ? "no data" : `${n(k.searches)}/mo`, ok: (k.searches ?? 0) > 0 })) },
      { kind: "doc", title: "Your ad", meta: `${g.ad.headlines.length} headlines · ${g.ad.descriptions.length} descriptions · Google mixes them`, text: `${g.ad.headlines.join(" | ")}\n\n${g.ad.descriptions.join("\n")}` },
    ], `ad-plan-g${i}`))
  })
  out.push(agent([{ kind: "receipt", title: "Searches I’ll keep you out of", items: p.negatives.map((x) => `${x.theme}: ${x.keywords.join(", ")}`) }], "ad-plan-neg"))
  const fields = [{ name: "daily", label: `Daily budget (${p.currency})`, type: "text" as const, value: p.daily != null ? String(p.daily) : "", required: true, placeholder: "e.g. 20" }]
  const budget = p.daily != null
    ? `${money(p.daily, p.currency)} a day (about ${money(monthlyFromDaily(p.daily), p.currency)} a month). ${p.dailyBasis ?? ""}`
    : "Tell me your daily budget. Google charges only when someone clicks."
  out.push(agent([
    { kind: "text", text: `Budget: ${budget}${p.cap ? ` I’ll never go over your ${money(p.cap, p.currency)} a month.` : ""}` },
    { kind: "text", text: p.bidding === "conversions" ? "Google will aim for the most leads it can get inside that budget." : "Google will aim for the most clicks it can get inside that budget. Once your leads are counted in Google Ads, I’ll switch it to aim for leads." },
    { kind: "chips", items: [
      { label: "Create it (paused)", primary: true, action: { type: "agent-op", endpoint: "ads", body: { op: "create", id: p.id }, form: { text: "Confirm the daily budget. I’ll create the campaign paused, so nothing is spent until you turn it on.", fields, cta: "Create it (paused)", fine: "You can pause it or change it any time." } } },
      op({ op: "plan" }, "Plan it again"),
      op({ op: "discard", id: p.id }, "Not now"),
    ] },
  ], "ad-plan-go"))
  return out
}

async function liveMessages(userId: string, acc: GadsAccount, cur: string, cap: number | null): Promise<Message[]> {
  const c = acc.campaign!
  const out: Message[] = []
  if (c.status === "PAUSED") {
    out.push(agent([
      { kind: "text", text: `“${c.name}” is ready and paused.`, big: true },
      { kind: "text", text: `Turn it on? It spends up to ${money(c.daily, cur)} a day${cap ? `, inside your ${money(cap, cur)} a month` : ""}. You can pause it again here any time.` },
      { kind: "chips", items: [op({ op: "enable" }, "Turn it on", true), { label: "Keep it paused", action: { type: "dismiss" } }] },
    ], "ad-live"))
  } else {
    out.push(agent([
      { kind: "text", text: `“${c.name}” is running at ${money(c.daily, cur)} a day.`, big: true },
      { kind: "chips", items: [op({ op: "pause" }, "Pause it")] },
    ], "ad-live"))
  }
  try {
    const r = await adsReport(await gadsFor(userId))
    const rows = (t: AdsTotals, label: string) => ({ name: label, detail: `${n(t.clicks)} clicks · ${n(t.conversions)} leads${t.conversions > 0 ? ` · ${money(t.cost / t.conversions, cur)} a lead` : ""}`, status: money(t.cost, cur), ok: t.conversions > 0 })
    const items = [rows(r.account[0], "Last 7 days"), rows(r.account[1], "Last 30 days")]
    out.push(agent([
      { kind: "sources", title: `Your Google Ads, from ${acc.customerName ?? "your account"}`, items },
      { kind: "text", text: r.account[1].clicks === 0 ? "No clicks yet. Numbers show up here within a day of your ads running." : r.account[1].conversions === 0 ? "No leads are being counted in Google Ads yet. Until they are, I can’t tell which searches bring customers, so I only cut obvious waste." : "Leads are counted from Google Ads conversion tracking." },
    ], "ad-report"))
  } catch (err) {
    out.push(agent([{ kind: "text", text: `I couldn’t read your numbers just now. ${adsErrorText(err)}` }], "ad-report"))
  }
  return out
}

function tuneMessages(t: Tune): Message[] {
  const when = new Date(t.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const w = t.window
  const head = `${when}: ${money(w.cost, t.currency)} spent, ${n(w.clicks)} clicks and ${n(w.conversions)} leads over the last ${w.days} days.`
  if (t.status === "nothing") return [agent([{ kind: "text", text: `${head} ${t.tracking ? "Nothing needed changing." : "Leads aren’t counted in Google Ads yet, so I didn’t cut any searches or keywords."}` }], "ad-tune")]
  const items = t.actions.map((a) => a.why)
  if (t.status === "proposed") return [agent([
    { kind: "text", text: head },
    { kind: "receipt", title: "What I’d change, and why", items },
    { kind: "chips", items: [op({ op: "tune_apply", id: t.id }, "Make these changes", true), op({ op: "tune_skip", id: t.id }, "Leave it as is")] },
  ], "ad-tune")]
  if (t.status === "applied") return [agent([
    { kind: "text", text: head },
    { kind: "receipt", title: "What I changed, and why", items },
    { kind: "chips", items: [op({ op: "tune_undo", id: t.id }, "Undo these changes")] },
  ], "ad-tune")]
  if (t.status === "failed") return [agent([{ kind: "text", text: `${head} My changes didn’t go through: ${t.error ?? "unknown error"}` }], "ad-tune")]
  return []
}
