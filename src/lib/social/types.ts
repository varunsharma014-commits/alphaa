// Social accounts the agent posts to, through Alphaa's own app on each platform.
// Each platform needs its app credentials in env; without them the connect button says
// "coming soon". Meta (Facebook Pages + Instagram), LinkedIn, TikTok and X.
export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "tiktok" | "x"
/** What the owner connects (one Meta login brings both Facebook Pages and Instagram). */
export type ConnectProvider = "meta" | "linkedin" | "linkedin_pages" | "tiktok" | "x"

export const PLATFORM_NAME: Record<SocialPlatform, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok", x: "X" }
export const PROVIDER_NAME: Record<ConnectProvider, string> = { meta: "Facebook & Instagram", linkedin: "LinkedIn profile", linkedin_pages: "LinkedIn company page", tiktok: "TikTok", x: "X" }
// X is off for now (Varun, 2026-11-18: its API is paid per call). The provider code stays; add "x" back here to offer it.
// LinkedIn company Pages need their own app: LinkedIn requires the Community Management API to be the only product on it.
// TikTok is off for now (owner decision 2026-11-28): hidden everywhere and "not configured" unless
// TIKTOK_ENABLED=1. The provider code stays so it can come back.
export const tiktokEnabled = () => process.env.TIKTOK_ENABLED === "1"
export const PROVIDERS: ConnectProvider[] = ["meta", "linkedin", "linkedin_pages", ...(tiktokEnabled() ? (["tiktok"] as const) : [])]

export function providerConfigured(p: ConnectProvider): boolean {
  if (p === "tiktok" && !tiktokEnabled()) return false
  if (p === "meta") return !!(process.env.META_APP_ID && process.env.META_APP_SECRET)
  if (p === "linkedin") return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
  if (p === "linkedin_pages") return !!(process.env.LINKEDIN_PAGES_CLIENT_ID && process.env.LINKEDIN_PAGES_CLIENT_SECRET)
  if (p === "tiktok") return !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET)
  return !!(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET)
}

export const isConnectProvider = (p: string): p is ConnectProvider => (PROVIDERS as string[]).includes(p)

/** A connected account, as stored (tokens encrypted). */
export type SocialAccount = {
  id: string // MockActivity row id
  platform: SocialPlatform
  externalId: string // page id, IG user id, person/org URN, TikTok open_id, X user id
  name: string
  handle?: string | null
  avatar?: string | null
  tokenEnc: string
  refreshEnc?: string | null
  expiresAt?: string | null
  /** Platform extras: LinkedIn author URN, Instagram's Facebook page id, X username. */
  extra?: Record<string, string>
  status: "active" | "expired"
  connectedAt: string
}

/**
 * What the platform reports for a published post: LinkedIn company Pages (impressions = views),
 * Instagram (reach, views, saves, shares with instagram_manage_insights) and Facebook Pages (views,
 * reach, clicks with read_insights). `level: "basic"` = only likes/comments/shares so far (lib/social/meta-stats.ts).
 * Profile posts on LinkedIn aren't readable by apps.
 */
export type PostStats = { impressions?: number; reach?: number; views?: number; likes: number; comments: number; shares?: number; saves?: number; clicks?: number; at: string; level?: "full" | "basic" }
export type PostResult = { accountId: string; platform: SocialPlatform; ok: boolean; url?: string | null; externalId?: string | null; error?: string; stats?: PostStats }
export type SocialPostStatus = "draft" | "scheduled" | "publishing" | "published" | "partial" | "failed"
export type SocialPost = {
  id: string
  text: string
  /** Signed public URL of the JPEG (platforms fetch it), from a post_image row. */
  imageId?: string | null
  accountIds: string[]
  status: SocialPostStatus
  scheduledFor?: string | null
  publishedAt?: string | null
  results?: PostResult[]
  source?: "week" | "manual" | "autopilot"
  title?: string | null
  /** A brand library video (lib/library): Facebook posts it as a video, Instagram as a Reel. Other platforms use the image. */
  videoAssetId?: string | null
  /** The owner approved this exact time (content calendar move, approval or an early-time OK). */
  ownerOk?: boolean
  /** End of the Autopilot stop window when Autopilot scheduled it (lib/calendar/rules.ts). */
  stopUntil?: string | null
}

/** What every provider implements. */
export type PublishInput = { text: string; imageUrl: string | null; imageBytes: Buffer | null; title?: string | null; /** Signed, short-lived URL of a brand library video (Meta pulls it). */ videoUrl?: string | null }
export type Provider = {
  authUrl(o: { state: string; redirectUri: string; challenge?: string }): string
  /** Exchange the code and return every account this login can post to. */
  connect(o: { code: string; redirectUri: string; verifier?: string; /** the brand connecting (Meta also saves ads access for it) */ userId?: string }): Promise<Omit<SocialAccount, "id" | "connectedAt" | "status">[]>
  publish(account: SocialAccount, post: PublishInput, save: (patch: Partial<SocialAccount>) => Promise<void>): Promise<{ url: string | null; externalId: string | null }>
  usesPkce?: boolean
}
