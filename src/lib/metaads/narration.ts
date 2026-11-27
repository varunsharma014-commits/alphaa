// Facebook + Instagram ads in the "ads" thread: connect / pick accounts, the plan to approve,
// build (paused) → turn on, results (7 and 30 days), new leads, and what I changed each week.
// Owner actions go to POST /api/agent/metaads.
import type { User } from "@prisma/client"
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { hasGrowth } from "@/lib/billing"
import { imageUrl } from "@/lib/images"
import { listAccounts } from "@/lib/social/store"
import { metaAdsConfigured } from "./connect"
import { getAccess, latestTune, listCampaigns, listLeads, markLeadsSeen, recentChanges, type MetaCampaign } from "./store"
import { metaReport, type MetaReport } from "./report"
import { SUGGESTED_DAILY } from "./plan"

const op = (body: Record<string, string>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "metaads", body } })
const CONNECT = "/api/social/connect/meta"
const money = (n: number, cur: string) => `${(Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${cur}`
const GOAL = { OUTCOME_LEADS: "Get leads: a short form on Facebook and Instagram sends you their name, email and phone", OUTCOME_TRAFFIC: "Get website visits from people nearby" } as const

export async function metaAdsMessages(user: User, note?: string | null): Promise<Message[]> {
  const out: Message[] = []
  if (note) out.push(agent([{ kind: "text", text: note }], "ma-note"))
  if (!hasGrowth(user)) {
    out.push(agent([
      { kind: "text", text: "Facebook and Instagram ads that bring you customers nearby." },
      { kind: "text", text: "On the Growth plan (early access while Meta approves ads access) I write the ads, show them only to people near you, and tune them every week inside your budget." },
      { kind: "chips", items: [{ label: "See the Growth plan", action: { type: "link", href: "/dashboard/upgrade?plan=growth" }, primary: true }] },
    ], "ma-upgrade"))
    return out
  }
  if (!metaAdsConfigured()) {
    out.push(agent([{ kind: "text", text: "Facebook & Instagram ads: opening soon. I’ll let you know the day you can connect." }], "ma-soon"))
    return out
  }

  const [access, social] = await Promise.all([getAccess(user.id), listAccounts(user.id)])
  const metaSocial = social.filter((a) => a.platform === "facebook" || a.platform === "instagram")
  if (!access) {
    out.push(agent([
      { kind: "text", text: "Facebook & Instagram ads", big: true },
      { kind: "text", text: metaSocial.length
        ? "You connected Facebook for posting before ads were ready. Reconnect once and pick your ad account too, then I can run ads for you."
        : "Connect Facebook once and I can post for you and run your ads. You choose which Page, Instagram account and ad account I can use. Ad spend is billed to you by Meta; I never mark it up." },
      { kind: "chips", items: [{ label: metaSocial.length ? "Reconnect to turn on ads" : "Connect Facebook & Instagram", primary: true, action: { type: "link", href: CONNECT } }] },
    ], "ma-connect"))
    return out
  }
  if (!access.adAccounts.length) {
    out.push(agent([
      { kind: "text", text: "Facebook didn’t share an ad account with me." },
      { kind: "text", text: "Reconnect and tick your ad account when Facebook asks. No ad account yet? Make one free in Meta Ads Manager, then reconnect." },
      { kind: "chips", items: [{ label: "Reconnect", primary: true, action: { type: "link", href: CONNECT } }, { label: "Open Meta Ads Manager", action: { type: "link", href: "https://adsmanager.facebook.com/" } }] },
    ], "ma-connect"))
    return out
  }

  // ── Picks: ad account, Page, Instagram, pixel ──────────────────────────────
  const p = access.picks
  const acct = access.adAccounts.find((a) => a.id === p.adAccountId)
  const pages = social.filter((a) => a.platform === "facebook" && a.status === "active")
  const igs = social.filter((a) => a.platform === "instagram" && a.status === "active")
  const pixels = acct ? access.pixels[acct.id] ?? [] : []
  if (!acct) {
    out.push(agent([
      { kind: "text", text: "Which ad account should I use? Your ads are billed to it by Meta." },
      { kind: "chips", items: access.adAccounts.slice(0, 8).map((a, i) => op({ op: "pick", key: "adAccount", value: a.id }, `${a.name} (${a.currency})${a.account_status === 1 ? "" : " · not active"}`, i === 0)) },
    ], "ma-picks"))
    return out
  }
  if (!p.pageId || !pages.some((x) => x.externalId === p.pageId)) {
    out.push(agent(pages.length ? [
      { kind: "text", text: "Which Facebook Page should the ads come from?" },
      { kind: "chips", items: pages.slice(0, 8).map((x, i) => op({ op: "pick", key: "page", value: x.externalId }, x.name, i === 0)) },
    ] : [
      { kind: "text", text: "Ads need a Facebook Page to come from, and Facebook didn’t share one. Reconnect and pick your Page." },
      { kind: "chips", items: [{ label: "Reconnect", primary: true, action: { type: "link", href: CONNECT } }] },
    ], "ma-picks"))
    return out
  }
  const page = pages.find((x) => x.externalId === p.pageId)!
  const ig = igs.find((x) => x.externalId === p.igUserId)
  const pixel = pixels.find((x) => x.id === p.pixelId)
  const pickBlocks: Block[] = [
    { kind: "text", text: "Facebook & Instagram ads", big: true },
    { kind: "sources", items: [
      { name: "Ad account", detail: `${acct.name} · ${acct.currency}`, status: acct.account_status === 1 ? "Ready" : "Not active in Meta", ok: acct.account_status === 1 },
      { name: "Facebook Page", detail: page.name, status: "Ready", ok: true },
      { name: "Instagram", detail: ig ? ig.name : igs.length ? "Not picked" : "None connected", status: ig ? "Ready" : "Optional", ok: !!ig },
      { name: "Meta Pixel", detail: pixel ? pixel.name : pixels.length ? "Not picked" : "None on this account", status: pixel ? "Ready" : "Optional", ok: !!pixel },
    ] },
  ]
  const pickChips: Chip[] = []
  if (!ig && igs.length) pickChips.push(...igs.slice(0, 3).map((x) => op({ op: "pick", key: "instagram", value: x.externalId }, `Use ${x.name} on Instagram`)))
  if (!pixel && pixels.length) pickChips.push(...pixels.slice(0, 3).map((x) => op({ op: "pick", key: "pixel", value: x.id }, `Use pixel “${x.name}”`)))
  if (access.adAccounts.length > 1) pickChips.push(op({ op: "pick", key: "adAccount", value: "" }, "Use a different ad account"))
  if (pages.length > 1) pickChips.push(op({ op: "pick", key: "page", value: "" }, "Use a different Page"))
  if (pickChips.length) pickBlocks.push({ kind: "chips", items: pickChips })
  if (acct.account_status !== 1) pickBlocks.push({ kind: "text", text: "Meta has this ad account on hold (often billing or a review). Fix it in Meta Ads Manager and I’ll carry on." })
  out.push(agent(pickBlocks, "ma-picks"))

  // ── Campaigns ──────────────────────────────────────────────────────────────
  const campaigns = (await listCampaigns(user.id, 20)).filter((c) => c.status !== "dismissed")
  const proposed = campaigns.find((c) => c.status === "proposed")
  if (proposed) out.push(planMessage(proposed))
  for (const c of campaigns.filter((c) => c.status === "paused" || c.status === "active" || c.status === "building" || c.status === "failed").slice(0, 5)) out.push(campaignMessage(c))
  if (!proposed) {
    out.push(agent([
      { kind: "text", text: campaigns.length ? "Want another campaign? I’ll plan it from what’s working for you." : "Ready when you are. I’ll plan your first campaign from your website and what’s working for you, and you approve it before anything is built." },
      { kind: "chips", items: [op({ op: "plan" }, campaigns.length ? "Plan another campaign" : "Plan my first campaign", !campaigns.length)] },
    ], "ma-plan-cta"))
  }

  // ── Results, leads, tuning ─────────────────────────────────────────────────
  const report = await metaReport(user.id)
  if (report) out.push(reportMessage(report))

  const leads = await listLeads(user.id, { take: 10, sinceDays: 30 })
  if (leads.length) {
    const fresh = leads.filter((l) => !l.seenAt)
    out.push(agent([
      { kind: "text", text: fresh.length ? `${fresh.length} new ${fresh.length === 1 ? "lead" : "leads"} from your ads. Reach out soon: people who just asked are the easiest to win.` : "Your latest leads from Facebook and Instagram:" },
      { kind: "receipt", title: "Leads (last 30 days)", items: leads.map((l) => [new Date(l.createdTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }), l.contact.name, l.contact.email, l.contact.phone].filter(Boolean).join(" · ")) },
      ...(leads.some((l) => l.contact.phone || l.contact.email) ? [{ kind: "chips" as const, items: leads.slice(0, 3).flatMap((l) => l.contact.phone ? [{ label: `Call ${l.contact.name?.split(" ")[0] ?? "them"}`, action: { type: "link" as const, href: `tel:${l.contact.phone.replace(/[^\d+]/g, "")}` } }] : l.contact.email ? [{ label: `Email ${l.contact.name?.split(" ")[0] ?? "them"}`, action: { type: "link" as const, href: `mailto:${l.contact.email}` } }] : []) }] : []),
    ], "ma-leads"))
    if (fresh.length) await markLeadsSeen(user.id).catch(() => undefined)
  }

  const tune = await latestTune(user.id)
  if (tune && tune.status !== "nothing" && Date.now() - Date.parse(tune.at) < 10 * 86_400_000) {
    const name = (id: string) => campaigns.find((c) => c.id === id)?.name ?? "a campaign"
    const lines = tune.actions.map((a) => a.kind === "pause_ad" ? `Pause an ad in “${name(a.campaignRowId)}”. ${a.why}` : `Daily budget of “${name(a.campaignRowId)}”: ${money(a.from, tune.currency)} → ${money(a.to, tune.currency)}. ${a.why}`)
    const blocks: Block[] = [
      { kind: "text", text: tune.status === "applied" ? "What I changed this week, and why." : tune.status === "proposed" ? "This week I’d change a few things. Your call." : "This week’s check." },
      { kind: "receipt", title: "Last 7 days", items: tune.summary },
    ]
    if (lines.length) blocks.push({ kind: "receipt", title: tune.status === "applied" ? "Changed" : "Proposed", items: lines })
    if (tune.status === "proposed") blocks.push({ kind: "chips", items: [op({ op: "tune_apply", id: tune.id }, "Make these changes", true), op({ op: "tune_dismiss", id: tune.id }, "Leave it as is")] })
    out.push(agent(blocks, "ma-tune"))
  }

  const changes = await recentChanges(user.id, 8)
  if (changes.length) out.push(agent([{ kind: "log", title: "Every change I made on Meta", items: changes.map((c) => ({ text: `${c.what[0].toUpperCase()}${c.what.slice(1)}. ${c.why}`, at: c.at })) }], "ma-log"))

  out.push(agent([{ kind: "chips", items: [op({ op: "disconnect" }, "Stop ads access")] }], "ma-foot"))
  return out
}

function planMessage(c: MetaCampaign): Message {
  const pl = c.plan
  const where = `${pl.cityLabel ?? "your area"} and ${pl.radiusMiles} miles around, adults 18+`
  const budget = pl.budgetSource === "autopilot"
    ? `${money(pl.dailyBudget, c.currency)} a day, inside your monthly budget${pl.monthlyCap ? ` of ${money(pl.monthlyCap, c.currency)} for Meta` : ""}.`
    : `I suggest starting at ${money(pl.dailyBudget, c.currency)} a day. You set the amount before anything is built.`
  const blocks: Block[] = [
    { kind: "text", text: "Here’s the campaign I’d run.", big: true },
    { kind: "text", text: pl.why },
    { kind: "receipt", title: c.name, items: [GOAL[pl.goal], `Who sees it: ${where}`, `Budget: ${budget}`, ...(pl.special !== "NONE" ? ["Meta treats ads like yours as a special category, so the audience is kept broad (all adults, wider area)."] : [])] },
    ...pl.ads.map((a, i): Block => ({ kind: "doc", title: a.headline, meta: `Ad ${i + 1} of ${pl.ads.length}${a.description ? ` · ${a.description}` : ""}`, text: a.primaryText, image: a.imageId ? imageUrl(a.imageId) : undefined, square: true })),
    { kind: "text", text: "When you approve, I build it on Meta paused. Nothing spends until you tap Turn it on." },
    { kind: "chips", items: [
      { label: "Approve and build it (paused)", primary: true, action: { type: "agent-op", endpoint: "metaads", body: { op: "approve", id: c.id }, form: {
        text: "Last check before I build it.",
        fields: [
          { name: "dailyBudget", label: `Daily budget (${c.currency})`, type: "text", value: String(pl.dailyBudget || SUGGESTED_DAILY), required: true },
          ...(pl.goal === "OUTCOME_LEADS" ? [{ name: "privacyUrl", label: "Your privacy policy link (Meta shows it on the form)", type: "url" as const, value: c.privacyUrl ?? "", placeholder: "https://yoursite.com/privacy", required: true }] : []),
        ],
        cta: "Build it, paused",
        fine: "Meta bills your ad account directly. I never go over your monthly budget.",
      } } },
      op({ op: "plan" }, "Write a different plan"),
      op({ op: "dismiss", id: c.id }, "Not now"),
    ] },
  ]
  return agent(blocks, "ma-proposal")
}

function campaignMessage(c: MetaCampaign): Message {
  const status = c.status === "active" ? "Running" : c.status === "paused" ? "Paused" : c.status === "building" ? "Building…" : "Didn’t build"
  const blocks: Block[] = [
    { kind: "receipt", title: c.name, sub: `${status} · ${money(c.plan.dailyBudget, c.currency)} a day`, items: [GOAL[c.plan.goal], `${c.plan.ads.length} ads · ${c.plan.cityLabel ?? "near you"}`] },
  ]
  if (c.error) blocks.push({ kind: "text", text: `Meta said: ${c.error}` })
  const chips: Chip[] = []
  if (c.status === "paused" && !c.error) chips.push(op({ op: "enable", id: c.id }, "Turn it on", true))
  if (c.status === "active") chips.push(op({ op: "pause", id: c.id }, "Pause it"))
  if (c.built?.campaignId) chips.push({ label: "See it in Meta Ads Manager", action: { type: "link", href: `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${c.adAccountId.replace(/^act_/, "")}&selected_campaign_ids=${c.built.campaignId}` } })
  if (chips.length) blocks.push({ kind: "chips", items: chips })
  return agent(blocks, `ma-c-${c.id}`)
}

function reportMessage(r: MetaReport): Message {
  const line = (label: string, w: MetaReport["d7"]) => `${label}: ${money(w.spend, r.currency)} spent · ${w.impressions.toLocaleString("en-US")} views · ${w.clicks.toLocaleString("en-US")} clicks · ${w.leads} ${w.leads === 1 ? "lead" : "leads"}${w.costPerLead !== null ? ` · ${money(w.costPerLead, r.currency)} per lead` : ""}`
  return agent([{ kind: "receipt", title: "Facebook & Instagram results", items: [line("Last 7 days", r.d7), line("Last 30 days", r.d30)] }], "ma-report")
}
