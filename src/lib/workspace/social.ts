// Social Studio: the real queue (lib/social/store) and connected accounts. Stats only where a
// platform reports them (LinkedIn company Pages, Instagram, Facebook Pages: lib/social/stats.ts),
// per platform; follower growth from the daily snapshots (lib/social/meta-stats.ts).
import type { User } from "@prisma/client"
import { listAccounts, listPosts } from "@/lib/social/store"
import { PLATFORM_NAME, PROVIDERS, providerConfigured, type SocialPlatform } from "@/lib/social/types"
import { imageUrl } from "@/lib/images"
import { getAgentSettings } from "@/lib/agent/settings"
import { ago, headlineOf, whenAhead } from "./common"
import { db } from "@/lib/db"
import { startWeekRun, WEEK_RUN } from "@/lib/agent/week"
import { runAsUser } from "@/lib/usage"
import { refreshPostStats, statsLine } from "@/lib/social/stats"
import { audienceOf, metaGrants } from "@/lib/social/meta-stats"

const kicked = new Set<string>()

export type SocialCard = {
  id: string
  nets: string[]
  status: "scheduled" | "draft" | "published" | "partial" | "failed" | "publishing"
  title: string
  text: string
  image: string | null
  when: string
  /** ISO time behind `when`, so the page can show it in the owner's time zone. */
  at: string | null
  verb: "Posted " | "Goes out " | "Planned for " | null
  result: string | null
  /** Per platform: "Instagram" → "1,204 reached · 18 likes · 4 saves". */
  resultBy: { platform: string; line: string; basic: boolean }[]
  links: { label: string; url: string }[]
  error: string | null
}
export type SocialData = {
  /** For the preview frames (the name shown over each post). */
  brandName: string
  accounts: { id: string; name: string; platform: string; ok: boolean; fix: string | null; reconnect: string | null }[]
  /** Upcoming posts were fewer than 3, so I started planning the week (lib/agent/week.ts). */
  drafting: boolean
  island: string
  canConnect: boolean
  auto: boolean
  posts: SocialCard[]
  tabs: string[]
  /** Followers per Facebook Page / Instagram account, from the daily snapshots. */
  audience: { platform: string; name: string; followers: number; change: number | null; since: string | null; points: number[] }[]
  /** Shown when a connected Meta account can't share reach/saves yet: reconnect (once the login asks for it) or "coming soon". */
  statsAsk: { title: string; text: string; href: string | null } | null
}

export async function getSocialData(user: User): Promise<SocialData> {
  const [accounts, posts, settings] = await Promise.all([listAccounts(user.id).catch(() => []), listPosts(user.id, 40).catch(() => []), getAgentSettings(user.id)])
  const byId = new Map(accounts.map((a) => [a.id, a]))
  const cards: SocialCard[] = posts.map((p) => {
    const nets = Array.from(new Set(p.accountIds.map((id) => byId.get(id)?.platform).filter((x): x is SocialPlatform => !!x).map((x) => PLATFORM_NAME[x])))
    const ok = (p.results ?? []).filter((r) => r.ok)
    // Numbers per platform, never added up across them (reach on Instagram and views on LinkedIn aren't the same thing).
    const resultBy = ok.flatMap((r) => { const line = statsLine(r.stats, r.platform); return line ? [{ platform: PLATFORM_NAME[r.platform], line, basic: r.stats?.level === "basic" }] : [] })
    const result = resultBy.length === 1 ? resultBy[0].line : resultBy.length ? resultBy.map((x) => `${x.platform}: ${x.line}`).join(" · ") : null
    const at = p.status === "published" || p.status === "partial" ? p.publishedAt : p.scheduledFor
    const when = !at ? "No time set" : p.status === "published" || p.status === "partial" ? `Posted ${ago(at)}` : p.status === "scheduled" ? `Goes out ${whenAhead(at)}` : `Planned for ${whenAhead(at)}`
    return {
      id: p.id,
      nets: nets.length ? nets : ["No account yet"],
      status: p.status,
      title: p.title?.trim() || headlineOf(p.text),
      text: p.text,
      image: p.imageId ? imageUrl(p.imageId) : null,
      when,
      at: at ?? null,
      verb: !at ? null : p.status === "published" || p.status === "partial" ? "Posted " : p.status === "scheduled" ? "Goes out " : "Planned for ",
      result,
      resultBy,
      links: ok.filter((r) => r.url).map((r) => ({ label: PLATFORM_NAME[r.platform], url: r.url! })),
      error: (p.results ?? []).find((r) => !r.ok)?.error ?? null,
    }
  })
  // Tabs: every platform with a post, plus every connected account (LinkedIn shows once it's connected).
  const tabs = Array.from(new Set([...cards.flatMap((c) => c.nets), ...accounts.map((a) => PLATFORM_NAME[a.platform])].filter((x) => x !== "No account yet")))
  const auto = settings.autopilot?.social === "auto"
  const now = Date.now()
  const drafts = posts.filter((p) => p.status === "draft").length
  const upcoming = drafts + posts.filter((p) => p.status === "scheduled" && p.scheduledFor && Date.parse(p.scheduledFor) > now).length
  // Never an idle queue: fewer than 3 upcoming posts and an account to post to = plan the week
  // (the existing week run: plan limits, voice and the claims checks apply). At most every 3 days.
  let drafting = false
  if (upcoming < 3 && accounts.some((a) => a.status === "active")) {
    const recent = await db.mockActivity.findFirst({ where: { userId: user.id, type: WEEK_RUN, createdAt: { gte: new Date(now - 3 * 86_400_000) } }, orderBy: { createdAt: "desc" }, select: { metadata: true } })
    const running = (recent?.metadata as { status?: string } | null)?.status === "running"
    if (running) drafting = true
    else if (!recent && !kicked.has(user.id)) {
      kicked.add(user.id)
      setTimeout(() => kicked.delete(user.id), 3 * 3_600_000)
      drafting = await runAsUser(user.id, () => startWeekRun(user.id)).then(() => true).catch(() => false)
    }
  }
  const scheduledSoon = posts.filter((p) => p.status === "scheduled" && p.scheduledFor && Date.parse(p.scheduledFor) > now && Date.parse(p.scheduledFor) < now + 7 * 86_400_000).length
  const island = drafts && !auto ? `${drafts} post${drafts === 1 ? "" : "s"} ready for your OK`
    : scheduledSoon ? `${scheduledSoon} post${scheduledSoon === 1 ? "" : "s"} going out this week`
      : drafting ? "Drafting next week’s posts"
        : accounts.length ? "Watching what works · I plan your next posts every few days" : "Connect an account and I’ll start posting"
  // Numbers older than 6h (and today's follower counts) refresh in the background; they show on the next visit.
  if (accounts.some((a) => a.status === "active" && (a.platform === "facebook" || a.platform === "instagram" || a.extra?.kind === "organization"))) void runAsUser(user.id, () => refreshPostStats(user.id)).catch(() => {})
  const hasMeta = accounts.some((a) => a.status === "active" && (a.platform === "facebook" || a.platform === "instagram"))
  const [audience, grants] = hasMeta ? await Promise.all([audienceOf(user.id, accounts).catch(() => []), metaGrants(user.id, accounts).catch(() => null)]) : [[], null]
  const igOnly = grants && grants.instagram && !grants.igInsights
  const fbOnly = grants && grants.facebook && !grants.fbInsights
  const statsAsk: SocialData["statsAsk"] = !grants || (!igOnly && !fbOnly) ? null
    : grants.canAsk
      ? { title: `Reconnect to allow ${igOnly ? "Instagram" : "Facebook"} stats`, text: `Right now I only see likes and comments. Reconnect Facebook & Instagram once and allow ${[igOnly ? "Instagram insights" : null, fbOnly ? "Page insights" : null].filter(Boolean).join(" and ")}, and I’ll show how many people each post reached${igOnly ? ", saves and shares" : ""}.`, href: "/api/social/connect/meta" }
      : { title: "Reach and saves are coming", text: "I show likes and comments from Facebook and Instagram now. Reach, saves and shares come once Meta approves them for Alphaa.", href: null }
  const provider = (a: (typeof accounts)[number]) => a.platform === "facebook" || a.platform === "instagram" ? "meta" : a.platform === "linkedin" ? (a.extra?.org || /organization/i.test(a.extra?.author ?? "") ? "linkedin_pages" : "linkedin") : a.platform
  return {
    brandName: user.businessName?.trim() || "",
    drafting,
    island,
    accounts: accounts.map((a) => {
      const expired = a.status === "expired" || (!!a.expiresAt && Date.parse(a.expiresAt) < now && !a.refreshEnc)
      return {
        id: a.id, name: a.name, platform: PLATFORM_NAME[a.platform], ok: !expired,
        fix: expired ? `${PLATFORM_NAME[a.platform]} stopped letting me post as ${a.name} (the login expired). Reconnect it once and I carry on.` : null,
        reconnect: expired ? `/api/social/connect/${provider(a)}` : null,
      }
    }),
    canConnect: PROVIDERS.some(providerConfigured),
    auto,
    posts: cards,
    tabs,
    audience: audience.filter((a) => a.followers != null).map((a) => ({ platform: PLATFORM_NAME[a.platform], name: a.name, followers: a.followers!, change: a.change, since: a.since, points: a.points.map((p) => p.n) })),
    statsAsk,
  }
}
