// TikTok: photo posts through the Content Posting API (Direct Post). Until TikTok audits the
// app, posts can only be private ("SELF_ONLY"); set TIKTOK_AUDITED=1 once approved.
// The image URL's domain (alphaa.app) must be verified in the TikTok developer portal.
import { api } from "../oauth"
import type { Provider, SocialAccount } from "../types"
import { dec, enc } from "../store"

const O = "https://open.tiktokapis.com/v2"
type Tok = { access_token: string; expires_in: number; refresh_token: string; refresh_expires_in: number; open_id: string }

async function token(account: SocialAccount, save: (p: Partial<SocialAccount>) => Promise<void>): Promise<string> {
  if (account.expiresAt && Date.parse(account.expiresAt) - 60_000 > Date.now()) return dec(account.tokenEnc)
  if (!account.refreshEnc) throw new Error("TikTok access expired. Reconnect TikTok.")
  const t = await api<Tok>(`${O}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY!, client_secret: process.env.TIKTOK_CLIENT_SECRET!, grant_type: "refresh_token", refresh_token: dec(account.refreshEnc) }),
  })
  await save({ tokenEnc: enc(t.access_token), refreshEnc: enc(t.refresh_token), expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString() })
  return t.access_token
}

export const tiktok: Provider = {
  authUrl({ state, redirectUri }) {
    const q = new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY!, scope: "user.info.basic,video.publish", response_type: "code", redirect_uri: redirectUri, state })
    return `https://www.tiktok.com/v2/auth/authorize/?${q}`
  },

  async connect({ code, redirectUri }) {
    const t = await api<Tok>(`${O}/oauth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY!, client_secret: process.env.TIKTOK_CLIENT_SECRET!, code, grant_type: "authorization_code", redirect_uri: redirectUri }),
    })
    type Me = { data?: { user?: { display_name?: string; avatar_url?: string; username?: string } } }
    const me = await api<Me>(`${O}/user/info/?fields=open_id,display_name,avatar_url,username`, { headers: { Authorization: `Bearer ${t.access_token}` } }).catch((): Me => ({}))
    const u = me.data?.user ?? {}
    return [{ platform: "tiktok", externalId: t.open_id, name: u.display_name ?? "TikTok", handle: u.username ?? null, avatar: u.avatar_url ?? null, tokenEnc: enc(t.access_token), refreshEnc: enc(t.refresh_token), expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString() }]
  },

  async publish(account, post, save) {
    if (!post.imageUrl) throw new Error("TikTok photo posts need an image.")
    const tk = await token(account, save)
    const info = await api<{ data?: { privacy_level_options?: string[] } }>(`${O}/post/publish/creator_info/query/`, { method: "POST", headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json; charset=UTF-8" }, body: "{}" })
    const options = info.data?.privacy_level_options ?? ["SELF_ONLY"]
    const privacy = process.env.TIKTOK_AUDITED === "1" && options.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : options.includes("SELF_ONLY") ? "SELF_ONLY" : options[0]
    const r = await api<{ data?: { publish_id?: string } }>(`${O}/post/publish/content/init/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({
        post_info: { title: (post.title ?? post.text).slice(0, 90), description: post.text.slice(0, 4000), privacy_level: privacy, disable_comment: false, auto_add_music: true },
        source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [post.imageUrl] },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      }),
    })
    return { externalId: r.data?.publish_id ?? null, url: account.handle ? `https://www.tiktok.com/@${account.handle}` : null }
  },
}
