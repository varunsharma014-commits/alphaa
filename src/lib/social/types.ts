// Social accounts the agent posts to, through Alphaa's own app on each platform.
// Each platform needs its app credentials in env; without them the connect button says
// "coming soon". Meta (Facebook Pages + Instagram), LinkedIn, TikTok and X.
export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "tiktok" | "x"
/** What the owner connects (one Meta login brings both Facebook Pages and Instagram). */
export type ConnectProvider = "meta" | "linkedin" | "tiktok" | "x"

export const PLATFORM_NAME: Record<SocialPlatform, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", tiktok: "TikTok", x: "X" }
export const PROVIDER_NAME: Record<ConnectProvider, string> = { meta: "Facebook & Instagram", linkedin: "LinkedIn", tiktok: "TikTok", x: "X" }
export const PROVIDERS: ConnectProvider[] = ["meta", "linkedin", "tiktok", "x"]

export function providerConfigured(p: ConnectProvider): boolean {
  if (p === "meta") return !!(process.env.META_APP_ID && process.env.META_APP_SECRET)
  if (p === "linkedin") return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)
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

export type PostResult = { accountId: string; platform: SocialPlatform; ok: boolean; url?: string | null; externalId?: string | null; error?: string }
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
}

/** What every provider implements. */
export type PublishInput = { text: string; imageUrl: string | null; imageBytes: Buffer | null; title?: string | null }
export type Provider = {
  authUrl(o: { state: string; redirectUri: string; challenge?: string }): string
  /** Exchange the code and return every account this login can post to. */
  connect(o: { code: string; redirectUri: string; verifier?: string }): Promise<Omit<SocialAccount, "id" | "connectedAt" | "status">[]>
  publish(account: SocialAccount, post: PublishInput, save: (patch: Partial<SocialAccount>) => Promise<void>): Promise<{ url: string | null; externalId: string | null }>
  usesPkce?: boolean
}
