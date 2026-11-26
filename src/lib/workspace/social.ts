// Social Studio: the real queue (lib/social/store) and connected accounts. Stats only where a
// platform reports them (LinkedIn company Pages today); everything else says so.
import type { User } from "@prisma/client"
import { listAccounts, listPosts } from "@/lib/social/store"
import { PLATFORM_NAME, PROVIDERS, providerConfigured, type SocialPlatform } from "@/lib/social/types"
import { imageUrl } from "@/lib/images"
import { getAgentSettings } from "@/lib/agent/settings"
import { ago, headlineOf, n, whenAhead } from "./common"

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
  links: { label: string; url: string }[]
  error: string | null
}
export type SocialData = {
  accounts: { name: string; platform: string }[]
  canConnect: boolean
  auto: boolean
  posts: SocialCard[]
  tabs: string[]
}

export async function getSocialData(user: User): Promise<SocialData> {
  const [accounts, posts, settings] = await Promise.all([listAccounts(user.id).catch(() => []), listPosts(user.id, 40).catch(() => []), getAgentSettings(user.id)])
  const byId = new Map(accounts.map((a) => [a.id, a]))
  const cards: SocialCard[] = posts.map((p) => {
    const nets = Array.from(new Set(p.accountIds.map((id) => byId.get(id)?.platform).filter((x): x is SocialPlatform => !!x).map((x) => PLATFORM_NAME[x])))
    const ok = (p.results ?? []).filter((r) => r.ok)
    const st = ok.map((r) => r.stats).filter((s): s is NonNullable<typeof s> => !!s)
    const result = st.length
      ? [
          st.some((s) => s.impressions != null) ? `${n(st.reduce((a, s) => a + (s.impressions ?? 0), 0))} views` : null,
          `${n(st.reduce((a, s) => a + s.likes, 0))} likes`,
          `${n(st.reduce((a, s) => a + s.comments, 0))} comments`,
        ].filter(Boolean).join(" · ")
      : null
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
      links: ok.filter((r) => r.url).map((r) => ({ label: PLATFORM_NAME[r.platform], url: r.url! })),
      error: (p.results ?? []).find((r) => !r.ok)?.error ?? null,
    }
  })
  const tabs = Array.from(new Set(cards.flatMap((c) => c.nets).filter((x) => x !== "No account yet")))
  return {
    accounts: accounts.map((a) => ({ name: a.name, platform: PLATFORM_NAME[a.platform] })),
    canConnect: PROVIDERS.some(providerConfigured),
    auto: settings.autopilot?.social === "auto",
    posts: cards,
    tabs,
  }
}
