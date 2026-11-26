// Tracking & Setup: every connection the agent relies on, read from real state, the daily lead
// tracking check (lib/tracking-health.ts), and the signals that actually arrived.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { healthItems, type HealthItem } from "@/lib/tracking-health"
import { eventDays, EVENT_KINDS } from "@/lib/tracking-events"
import { listAccounts } from "@/lib/social/store"
import { PLATFORM_NAME } from "@/lib/social/types"
import { getAccess, listLeads } from "@/lib/metaads/store"
import { getGadsAccount } from "@/lib/gads/store"
import { setupProgress } from "@/lib/agent/setup"
import { hasGrowth, hasPro } from "@/lib/billing"
import type { Chip } from "@/lib/agent/types"
import { ago } from "./common"

export type Conn = { key: string; name: string; sum: string; ok: boolean; soft?: boolean; act?: { label: string; href?: string; topic?: string; chip?: Chip }; detail: string }
export type Signal = { src: string; ev: string; t: string; at: string; tone: "g" | "b" | "p" | "a" }
export type TrackingData = {
  conns: Conn[]
  health: HealthItem[]
  trackingOn: boolean
  signals: Signal[]
  setup: { done: number; total: number; next: string | null } | null
  growth: boolean
}

const KIND_TEXT: Record<string, string> = { phone: "Phone tap", email: "Email tap", form: "Form sent", hubspot: "HubSpot form sent", typeform: "Typeform sent", calendly: "Calendly booking", test: "Test lead (self-check)" }

export async function getTrackingData(user: User): Promise<TrackingData> {
  const growth = hasGrowth(user)
  const [s, integ, accounts, meta, gacc, days, visits, leads, setup] = await Promise.all([
    getAgentSettings(user.id),
    db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true, gaPropertyId: true, gscSiteUrl: true } }),
    hasPro(user) ? listAccounts(user.id).catch(() => []) : Promise.resolve([]),
    getAccess(user.id).catch(() => null),
    getGadsAccount(user.id).catch(() => null),
    eventDays(user.id, 14).catch(() => []),
    db.mockActivity.findMany({ where: { userId: user.id, type: "ai_visit", createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 8, select: { metadata: true, createdAt: true } }),
    listLeads(user.id, { take: 5, sinceDays: 14 }).catch(() => []),
    setupProgress(user).catch(() => null),
  ])
  const google = { href: "/api/integrations/google/connect?go=1", label: "Connect Google" }
  const site = !!(s.wp || s.site?.platform)
  const conns: Conn[] = [
    { key: "gbp", name: "Google Business Profile", ok: !!integ?.gmbLocationId, sum: integ?.gmbLocationId ? "Calls, direction requests and reviews come in from here." : "Not connected. I can’t count calls from Google or reply to reviews yet.", act: integ?.gmbLocationId ? undefined : google, detail: "Your Google listing: I post updates, reply to reviews and read the calls and direction requests Google reports." },
    { key: "ga", name: "Google Analytics", ok: !!integ?.gaPropertyId, sum: integ?.gaPropertyId ? "Website visits, and visits sent by AI assistants." : "Not connected. I can’t see your website visits yet.", act: integ?.gaPropertyId ? undefined : { label: integ ? "Pick your property" : "Connect Google", href: integ ? "/dashboard/settings/integrations" : google.href }, detail: "Google Analytics tells me how many people visit your site and where they came from." },
    { key: "gsc", name: "Google Search Console", ok: !!integ?.gscSiteUrl, sum: integ?.gscSiteUrl ? "What people search on Google to find you." : "Not connected. I can’t see your Google searches yet.", act: integ?.gscSiteUrl ? undefined : { label: integ ? "Pick your site" : "Connect Google", href: integ ? "/dashboard/settings/integrations" : google.href }, detail: "Search Console shows the searches you appear for and how often people click." },
    { key: "site", name: "Your website", ok: site, sum: site ? `Connected${s.wp ? " (WordPress)" : s.site?.platform ? ` (${s.site.platform})` : ""}. I publish approved posts and fixes myself.` : "Not connected. I email your web person instead of publishing myself.", act: site ? undefined : { label: "Connect my website", chip: { label: "Connect my website", action: { type: "wp-connect" } } }, detail: "With your website connected I publish posts and fixes myself, and every change has an Undo." },
  ]
  if (growth) {
    const on = !!s.tracking?.on
    conns.push({ key: "leads", name: "Lead tracking on your site", ok: on && !healthItems(s, s.tracking?.check, days).some((h) => !h.ok && !h.soft), sum: on ? "Phone taps, email taps and form sends are counted." : "Off. Calls, forms and bookings from your website aren’t counted yet.", act: { label: on ? "Check it now" : "Set it up", topic: "tracking" }, detail: "I add Google Analytics and the Meta Pixel to your site, count every phone tap, email tap and form send, and test it myself." })
  }
  if (hasPro(user)) {
    conns.push({ key: "social", name: "Social accounts", ok: accounts.length > 0, sum: accounts.length ? accounts.map((a) => `${PLATFORM_NAME[a.platform]}: ${a.name}`).join(" · ") : "None connected. I write your posts, but I can’t post them yet.", act: accounts.length ? undefined : { label: "Connect", topic: "social" }, detail: "Facebook, Instagram, LinkedIn and TikTok accounts I post to." })
  }
  if (growth) {
    conns.push({ key: "meta", name: "Meta ads account", ok: !!meta, soft: !meta, sum: meta ? "Connected. I read results and leads from the campaigns I build." : "Not connected.", act: meta ? undefined : { label: "Connect", topic: "ads" }, detail: "Your Facebook & Instagram ad account, for the campaigns I build and their results." })
    conns.push({ key: "gads", name: "Google Ads account", ok: !!gacc?.customerId, soft: !gacc?.customerId, sum: gacc?.customerId ? `Connected${gacc.customerName ? `: ${gacc.customerName}` : ""}.` : "Not connected.", act: gacc?.customerId ? undefined : { label: "Connect", topic: "ads" }, detail: "Your Google Ads account: spend, clicks and conversions, and the search campaign I build." })
  }

  // Signals that actually arrived: lead beacons (per-day counters), AI visits and ad leads.
  const signals: Signal[] = []
  for (const d of days.slice(0, 7)) {
    for (const k of EVENT_KINDS) {
      const c = d.counts?.[k]
      if (!c) continue
      const at = `${d.day}T12:00:00.000Z`
      signals.push({ src: "Website", ev: `${KIND_TEXT[k] ?? k} × ${c}`, t: d.day === new Date().toISOString().slice(0, 10) ? "today" : new Date(at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), at, tone: k === "test" ? "b" : "g" })
    }
  }
  for (const v of visits) {
    const m = (v.metadata ?? {}) as { source?: string; path?: string }
    signals.push({ src: "AI answers", ev: `Visit from ${m.source ?? "an AI assistant"}${m.path ? ` · ${m.path}` : ""}`, t: ago(v.createdAt.toISOString()), at: v.createdAt.toISOString(), tone: "b" })
  }
  for (const l of leads) signals.push({ src: "Meta ad", ev: "New lead from your ad form", t: ago(l.createdTime), at: l.createdTime, tone: "p" })
  signals.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  return {
    conns,
    health: growth ? healthItems(s, s.tracking?.check, days) : [],
    trackingOn: !!s.tracking?.on,
    signals: signals.slice(0, 10),
    setup: setup ? { done: setup.done, total: setup.total, next: setup.next?.name ?? null } : null,
    growth,
  }
}
