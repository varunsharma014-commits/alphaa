// "Your marketing channels": every channel the agent works on, what's connected, what's
// waiting on the owner, and what opens later. One place to connect everything.
import { db } from "@/lib/db"
import { agent, type Chip, type Message } from "@/lib/agent/types"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasGrowth, hasPaidPlan, isComped } from "@/lib/billing"
import { listAccounts } from "@/lib/social/store"
import { PLATFORM_NAME } from "@/lib/social/types"
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
    detail: active.length ? Array.from(new Set(active.map((a) => PLATFORM_NAME[a.platform]))).join(", ") : growth ? "Facebook, Instagram, LinkedIn, TikTok, X" : "Growth plan",
    status: expired.length ? "Reconnect needed" : active.length ? `${active.length} connected` : growth ? "Not connected" : "Growth plan",
    ok: active.length > 0 && !expired.length,
  })
  if (growth) chips.push({ label: active.length ? "Manage social accounts" : "Connect social accounts", action: { type: "thread", topic: "social" } })

  const t = s.tracking
  rows.push({ name: "Lead tracking", detail: t?.on ? [t.ga4 && "Google Analytics", t.pixel && "Meta Pixel"].filter(Boolean).join(" and ") + " counting calls, emails and forms" : "Counts the calls, emails and forms your marketing brings", status: t?.on ? "On" : growth ? "Not set up" : "Growth plan", ok: !!t?.on })
  if (growth && !t?.on) chips.push({ label: "Set up tracking", action: { type: "thread", topic: "tracking" } })

  rows.push({ name: "Google Ads and Meta Ads", detail: "Campaigns built and tuned every week, inside your budget", status: growth ? "Opens soon" : "Growth plan", ok: false })
  rows.push({ name: "Email marketing", detail: "Emails that bring past customers back", status: growth ? "Opens soon" : "Growth plan", ok: false })

  const connected = rows.filter((r) => r.ok).length
  const out: Message[] = [agent([
    { kind: "text", text: `${connected} of ${rows.length} channels working for you.`, big: true },
    { kind: "text", text: recent ? `I did ${recent} things across them in the last 7 days. The more you connect, the more I can do without you lifting a finger.` : "The more you connect, the more I can do without you lifting a finger." },
    { kind: "sources", items: rows },
    ...(chips.length ? [{ kind: "chips" as const, items: chips }] : []),
  ], "ch-all")]
  if (!growth) out.push(agent([
    { kind: "text", text: "Want me to run your social media, ads and email too? That’s the Growth plan." },
    { kind: "chips", items: [{ label: "See the Growth plan", action: { type: "link", href: "/dashboard/upgrade" } }] },
  ], "ch-growth"))
  return out
}
