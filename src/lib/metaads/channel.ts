// The "Meta Ads" row in "Your marketing channels" (lib/agent/channels.ts).
import type { User } from "@prisma/client"
import type { Chip } from "@/lib/agent/types"
import { hasGrowth } from "@/lib/billing"
import type { SocialAccount } from "@/lib/social/types"
import { metaAdsConfigured } from "./connect"
import { getAccess, listCampaigns } from "./store"

export async function metaAdsChannel(user: User, accounts: SocialAccount[]): Promise<{ row: { name: string; detail: string; status: string; ok: boolean }; chip?: Chip }> {
  const name = "Meta Ads"
  const detail = "Facebook and Instagram campaigns, inside your budget"
  if (!hasGrowth(user)) return { row: { name, detail, status: "Growth plan · early access", ok: false } }
  if (!metaAdsConfigured()) return { row: { name, detail, status: "Opens soon", ok: false } }
  const access = await getAccess(user.id)
  if (!access) {
    const before = accounts.some((a) => a.platform === "facebook" || a.platform === "instagram")
    return { row: { name, detail, status: before ? "Reconnect to turn on ads" : "Not connected", ok: false }, chip: { label: before ? "Reconnect to turn on ads" : "Connect Meta Ads", action: { type: "link", href: "/api/social/connect/meta" } } }
  }
  const acct = access.adAccounts.find((a) => a.id === access.picks.adAccountId)
  const live = (await listCampaigns(user.id, 20)).filter((c) => c.status === "active" || c.status === "paused")
  const running = live.filter((c) => c.status === "active").length
  return {
    row: {
      name,
      detail: acct ? `${acct.name}${live[0] ? `: “${live[0].name}”` : ""}` : detail,
      status: !access.adAccounts.length ? "No ad account shared" : !acct || !access.picks.pageId ? "Pick your ad account" : running ? `${running} running` : live.length ? "Ready, paused" : "Connected",
      ok: !!acct && !!access.picks.pageId,
    },
    chip: { label: live.length ? "See my Meta ads" : "Plan my Meta ads", action: { type: "thread", topic: "ads" } },
  }
}
