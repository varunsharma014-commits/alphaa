// "Your marketing channels": every channel the agent works on, what's connected, what's
// waiting on the owner, and what opens later. One place to connect everything.
import { db } from "@/lib/db"
import { agent, type Chip, type Message } from "@/lib/agent/types"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasGrowth, hasPaidPlan, hasPro, isComped } from "@/lib/billing"
import { listAccounts } from "@/lib/social/store"
import { PLATFORM_NAME } from "@/lib/social/types"
import { canvaConfigured } from "@/lib/canva/client"
import { getCanvaAccount } from "@/lib/canva/store"
import { connectCanvaChip } from "@/lib/canva/narration"
import { gadsAvailable } from "@/lib/gads/oauth"
import { getGadsAccount } from "@/lib/gads/store"
import { connectAdsChip } from "@/lib/gads/thread"
import { metaAdsChannel } from "@/lib/metaads/channel"
import { getContacts } from "@/lib/email-campaigns/store"
import type { User } from "@prisma/client"

type Row = { name: string; detail: string; status: string; ok: boolean }

export async function channelsMessages(user: User): Promise<Message[]> {
  const [s, integ, accounts, recent] = await Promise.all([
    getAgentSettings(user.id),
    db.integration.findUnique({ where: { userId: user.id } }),
    listAccounts(user.id),
    db.mockActivity.count({ where: { userId: user.id, type: { in: ["social_published", "post_draft", "review_reply"] }, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } } }),
  ])
  const growth = hasGrowth(user)
  // Social media and Canva are Pro and up (2026-11-18); ads, email and tracking stay Growth.
  const pro = hasPro(user)
  const paid = hasPaidPlan(user) || isComped(user.email)
  const rows: Row[] = []
  const chips: Chip[] = []

  const gbp = !!(integ?.gmbAccountId && integ?.gmbLocationId)
  rows.push({ name: "Google Business Profile", detail: gbp ? "Posts and review replies" : "So I can post updates and reply to reviews", status: gbp ? "Connected" : "Not connected", ok: gbp })
  rows.push({ name: "Google Search Console", detail: integ?.gscSiteUrl ? "Which searches bring you visitors" : "Shows which searches bring you visitors", status: integ?.gscSiteUrl ? "Connected" : "Not connected", ok: !!integ?.gscSiteUrl })
  rows.push({ name: "Google Analytics", detail: integ?.gaPropertyId ? "Your website visits" : "Your website visits and where they come from", status: integ?.gaPropertyId ? "Connected" : "Not connected", ok: !!integ?.gaPropertyId })
  if (!integ || !gbp) chips.push({ label: "Connect Google", primary: true, action: { type: "link", href: "/api/integrations/google/connect?go=1" } })

  const site = s.wp ? "WordPress" : s.site?.platform ? s.site.platform[0].toUpperCase() + s.site.platform.slice(1) : null
  rows.push({ name: "Your website", detail: site ? `${site}: I publish posts and fixes` : "So I can publish posts and fixes for you", status: site ? "Connected" : "Not connected", ok: !!site })
  if (!site) chips.push({ label: "Connect my website", action: { type: "link", href: "/dashboard/settings/website" } })

  rows.push({ name: "AI assistants", detail: "ChatGPT, Gemini, Claude and Perplexity, asked every week", status: paid ? "Checking weekly" : "On any plan", ok: paid })

  const active = accounts.filter((a) => a.status === "active")
  const expired = accounts.filter((a) => a.status !== "active")
  rows.push({
    name: "Social media",
    detail: active.length ? Array.from(new Set(active.map((a) => PLATFORM_NAME[a.platform]))).join(", ") : pro ? "Facebook, Instagram, LinkedIn, TikTok" : "Pro plan",
    status: expired.length ? "Reconnect needed" : active.length ? `${active.length} connected` : pro ? "Not connected" : "Pro plan",
    ok: active.length > 0 && !expired.length,
  })
  if (pro) chips.push({ label: active.length ? "Manage social accounts" : "Connect social accounts", action: { type: "thread", topic: "social" } })

  // Canva (lib/canva): only once Alphaa's Canva app keys exist.
  if (canvaConfigured()) {
    const canva = await getCanvaAccount(user.id)
    const on = canva?.status === "active"
    rows.push({ name: "Canva", detail: on ? "Your designs on your posts, and edits to mine" : "Post your own designs and touch up mine", status: !pro ? "Pro plan" : on ? "Connected" : canva ? "Reconnect needed" : "Not connected", ok: !!on })
    if (pro) chips.push(on ? { label: "Use my Canva designs", action: { type: "agent-op", endpoint: "canva", body: { op: "designs" } } } : connectCanvaChip("channels"))
  }

  const t = s.tracking
  rows.push({ name: "Lead tracking", detail: t?.on ? [t.ga4 && "Google Analytics", t.pixel && "Meta Pixel"].filter(Boolean).join(" and ") + " counting calls, emails and forms" : "Counts the calls, emails and forms your marketing brings", status: t?.on ? "On" : growth ? "Not set up" : "Growth plan", ok: !!t?.on })
  if (growth && !t?.on) chips.push({ label: "Set up tracking", action: { type: "thread", topic: "tracking" } })

  // Google Ads (lib/gads): real status once it's open to this brand (GOOGLE_ADS_ENABLED=1 or a founder).
  const gads = growth && gadsAvailable(user) ? await getGadsAccount(user.id) : null
  if (growth && gadsAvailable(user)) {
    const live = gads?.status === "active"
    const c = gads?.campaign
    rows.push({
      name: "Google Ads",
      detail: live && gads?.customerName ? `${gads.customerName}${c ? `: “${c.name}”` : ""}` : "Campaigns built and tuned every week, inside your budget",
      status: !gads ? "Not connected" : !live ? "Reconnect needed" : !gads.customerId ? "Pick your ad account" : c?.status === "ENABLED" ? "Running" : c ? "Ready, paused" : "Connected",
      ok: live && !!gads?.customerId,
    })
    chips.push(!gads || !live ? connectAdsChip(gads ? "Reconnect Google Ads" : "Connect Google Ads") : { label: c ? "See my ads" : "Plan my Google Ads", action: { type: "thread", topic: "ads" } })
  } else {
    rows.push({ name: "Google Ads", detail: "Campaigns built and tuned every week, inside your budget", status: growth ? "Opens soon" : "Growth plan", ok: false })
  }
  // Meta Ads (lib/metaads): Facebook + Instagram campaigns on the same Meta login as posting.
  const meta = await metaAdsChannel(user, accounts)
  rows.push(meta.row)
  if (meta.chip && !chips.some((c) => c.label === meta.chip!.label)) chips.push(meta.chip)
  if (growth) {
    const [contacts, s2] = await Promise.all([getContacts(user.id), getAgentSettings(user.id)])
    const ready = contacts.length > 0 && !!s2.emailOutreach?.address
    rows.push({ name: "Email marketing", detail: contacts.length ? `${contacts.length.toLocaleString("en-US")} past customers on your list` : "Emails that bring past customers back", status: ready ? "Ready" : contacts.length ? "Add your address" : "Add your customers", ok: ready })
    if (!ready) chips.push({ label: "Set up customer emails", action: { type: "thread", topic: "email" } })
  } else {
    rows.push({ name: "Email marketing", detail: "Emails that bring past customers back", status: "Growth plan", ok: false })
  }

  const connected = rows.filter((r) => r.ok).length
  const out: Message[] = [agent([
    { kind: "text", text: `${connected} of ${rows.length} channels working for you.`, big: true },
    { kind: "text", text: recent ? `I did ${recent} things across them in the last 7 days. The more you connect, the more I can do without you lifting a finger.` : "The more you connect, the more I can do without you lifting a finger." },
    { kind: "sources", items: rows },
    ...(chips.length ? [{ kind: "chips" as const, items: chips }] : []),
  ], "ch-all")]
  if (!pro) out.push(agent([
    { kind: "text", text: "Want me to run your social media too? That’s the Pro plan." },
    { kind: "chips", items: [{ label: "See the Pro plan", action: { type: "link", href: "/dashboard/upgrade?plan=pro" } }] },
  ], "ch-growth"))
  else if (!growth) out.push(agent([
    { kind: "text", text: "Want me to run your ads and email too? That’s the Growth plan, in early access." },
    { kind: "chips", items: [{ label: "See the Growth plan", action: { type: "link", href: "/dashboard/upgrade?plan=growth" } }] },
  ], "ch-growth"))
  return out
}
