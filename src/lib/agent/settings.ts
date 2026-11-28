import { db } from "@/lib/db"

// Per-user agent settings, kept as JSON on a single MockActivity row
// (type "agent_settings") — the schema has no migrations directory.
export type AgentSettings = {
  webPersonEmail?: string
  /** WordPress connector, set when the plugin checks in with its key. */
  wp?: { siteUrl: string; restUrl: string; version: string; connectedAt: string; lastSeenAt?: string }
  bingPlacesDone?: string // ISO date the owner said it's done
  appleConnectDone?: string
  reviewLink?: string // owner-supplied fallback when Google doesn't return one
  /** Customer questions tracked weekly across the four AIs. */
  questions?: string[]
  /** Extra locations (Pro: up to 3 including the main one). */
  locations?: Location[]
  /** Social/review profile URLs the owner confirmed or added. */
  profiles?: string[]
  /** Bing Webmaster Tools API key, encrypted (see lib/checks/bing-webmaster). */
  bingKeyEnc?: string
  bingSite?: string
  /** Webflow / Shopify / Wix connection (WordPress uses `wp`). */
  site?: import("@/lib/connector/types").SiteConnection
  /** Pro: publish blog posts without asking (only drafts with no [placeholders]). */
  autoPublishPosts?: boolean
  /** What one new customer is worth: my estimate until the owner edits it (lib/customer-value.ts). */
  customerValue?: { amount: number; source: "estimate" | "owner"; basis?: string; at: string }
  /** ROAS: telling Google / Meta about won sales, owner opt-in per platform (lib/roas/uploads.ts). */
  roas?: { uploads?: import("@/lib/roas/payloads").UploadSettings & { googleActionName?: string | null; at?: string } }
  /** Growth: GA4 + Meta Pixel the agent set up on the site (lib/tracking.ts). */
  tracking?: import("@/lib/tracking").Tracking
  /** How the business sounds: three options learned from the owner's own words + their choices (lib/voice.ts). */
  voice?: import("@/lib/voice").Voice
  /** What I do without asking (lib/agent/autopilot.ts). Blog/Google posts use autoPublishPosts. */
  autopilot?: Autopilot
  /** Banned words, mandatory hashtags/disclaimers, "always say" items, enforced in every writer (lib/guardrails.ts). */
  guardrails?: import("@/lib/guardrails").Guardrails
  /** Logo, colours and font read from the site, or set by the owner (lib/brand-kit.ts). */
  brand?: import("@/lib/brand-kit").BrandKit
  /** One-time note for the Social thread (the result of the last connect). */
  socialNote?: string
  /** When the owner last opened "What's working" (the briefing card shows weekly until then). */
  insightsSeenAt?: string
  /** The first-visit moment: the AI answer shown once, and when the owner saw it (lib/agent/first-answer.ts). */
  firstAnswer?: import("@/lib/agent/first-answer").FirstAnswer
  /** How social images look: text card, the owner's photos, an AI-made picture or their Canva template (lib/post-images.ts). */
  images?: import("@/lib/post-images").ImageSettings
  /** Guided first-run setup (lib/agent/setup.ts). */
  setup?: import("@/lib/agent/setup").SetupState
  /** Brand library (Drive / Dropbox links): the video picked for the next post, a one-time note (lib/library). */
  library?: import("@/lib/library/types").LibrarySettings
  /** Retired 2026-11-27 (the old dashboard v2 flag); kept so stored settings still parse. */
  dashV2?: boolean
  /** "Auto-approve and post": the owner accepted the warning (lib/agent/auto-approve.ts). Unset = off. */
  autoApprove?: { acceptedAt: string; version: string; consentId: string }
  /** Email outreach (Growth, lib/email-campaigns): the business mailing address every email must carry. */
  emailOutreach?: { address?: string; at?: string }
  /** Niche check per competitor host (lib/competitor-relevance.ts). */
  competitorRelevance?: Record<string, { ok: boolean; why?: string; at: string }>
  /** Does a niche post fit the business (lib/niche-fit.ts), per NicheItem id. */
  nicheFit?: Record<string, { ok: boolean; at: string }>
  /** Hook lines written for social ideas, per idea title (lib/workspace/research.ts). */
  ideaHooks?: Record<string, { hook: string; at: string }>
  /** Hosts the owner marked "Not a competitor". */
  competitorsDismissed?: string[]
  /** Billing add-ons, written by the Stripe webhook: extra ad accounts on top of Growth's 1 (lib/ad-accounts.ts). */
  billing?: { extraAdAccounts: number; subscriptionId?: string; at: string }
  /** Usage credits: "Use credits when I run out" (lib/credits.ts). On after the first purchase unless turned off. */
  credits?: { autoUse: boolean; at: string }
  /** Content calendar (lib/calendar): the owner's time zone and the cached "best time to post". */
  calendar?: { timezone?: string; tzAt?: string; best?: import("@/lib/calendar/best-time").BestTimes; /** Google posts the owner OK'd on the calendar (GbpPost has no metadata). */ okGbp?: string[] }
  /** The owner's own ad rules (lib/ad-rules) and when the daily check last ran. */
  adRules?: import("@/lib/ad-rules/engine").AdRule[]
  adRulesRun?: { at: string }
  /** Shareable ad report links + the optional monthly email (lib/ad-report). */
  adReports?: import("@/lib/ad-report/token").ReportLink[]
  adReportMail?: { monthly: boolean; to?: string | null; lastSent?: string | null; at: string }
}

export type Autopilot = {
  reviews?: "ask" | "positive" | "all"
  social?: "ask" | "auto"
  email?: "ask" | "auto"
  ads?: "each" | "budget"
  /** Monthly ad budget cap the owner set, in their billing currency. */
  adBudget?: number
  at?: string
}

export type Location = { id: string; name: string; street: string; city: string; state?: string; zip?: string; phone?: string; hours?: string }

const TYPE = "agent_settings"

export async function getAgentSettings(userId: string): Promise<AgentSettings> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: TYPE }, orderBy: { createdAt: "desc" } })
  return (row?.metadata as AgentSettings | null) ?? {}
}

export async function saveAgentSettings(userId: string, patch: Partial<AgentSettings>): Promise<AgentSettings> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: TYPE }, orderBy: { createdAt: "desc" } })
  const next = { ...((row?.metadata as AgentSettings | null) ?? {}), ...patch }
  for (const k of Object.keys(next) as (keyof AgentSettings)[]) if (next[k] === undefined) delete next[k]
  if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: next as object } })
  else await db.mockActivity.create({ data: { userId, type: TYPE, title: "Agent settings", metadata: next as object } })
  return next
}

/** Pro and Growth cover 3 locations in total (the main business + 2). */
export const maxExtraLocations = (plan: string) => (/pro|full|growth/i.test(plan) ? 2 : 0)
