// Called from the Meta connect step (lib/social/providers/meta.ts): keeps the business token
// (encrypted) plus the ad accounts and pixels the owner shared, so ads can run on the same login
// as posting. Never throws: a failure here must not break connecting Pages and Instagram.
import { providerConfigured } from "@/lib/social/types"
import { listAccounts } from "@/lib/social/store"
import { listAdAccounts, listPixels, type Pixel } from "./graph"
import { saveAccess } from "./store"

/** Ads need the Meta app keys and the Facebook Login for Business configuration (its permissions include ads_management). */
export const metaAdsConfigured = () => providerConfigured("meta") && !!process.env.META_LOGIN_CONFIG_ID

export async function saveMetaAdsAccess(userId: string, token: string): Promise<number> {
  try {
    const adAccounts = await listAdAccounts(token)
    const pixels: Record<string, Pixel[]> = {}
    for (const a of adAccounts.slice(0, 10)) pixels[a.id] = await listPixels(token, a.id).catch(() => [])
    await saveAccess(userId, { token, adAccounts, pixels })
    return adAccounts.length
  } catch (err) {
    console.error("[metaads] connect", err instanceof Error ? err.message : "failed")
    // Keep the token anyway, so a later fix can list the ad accounts without another login.
    await saveAccess(userId, { token, adAccounts: [], pixels: {} }).catch(() => null)
    return 0
  }
}

/** Facebook Pages and Instagram accounts already connected for posting (the ad identities). */
export async function adIdentities(userId: string) {
  const all = (await listAccounts(userId)).filter((a) => a.status === "active")
  const pages = all.filter((a) => a.platform === "facebook")
  const igs = all.filter((a) => a.platform === "instagram")
  return { pages, igs }
}
