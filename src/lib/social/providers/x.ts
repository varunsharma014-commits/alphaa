// X (Twitter): OAuth 2.0 with PKCE, posts with one image. Access tokens last 2 hours and are
// refreshed with the offline refresh token. Posting volume depends on the X API tier.
import { api } from "../oauth"
import type { Provider, SocialAccount } from "../types"
import { dec, enc } from "../store"

const A = "https://api.x.com/2"
const basic = () => `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`
type Tok = { access_token: string; refresh_token?: string; expires_in: number }

async function token(account: SocialAccount, save: (p: Partial<SocialAccount>) => Promise<void>): Promise<string> {
  if (account.expiresAt && Date.parse(account.expiresAt) - 60_000 > Date.now()) return dec(account.tokenEnc)
  if (!account.refreshEnc) throw new Error("X access expired. Reconnect X.")
  const t = await api<Tok>(`${A}/oauth2/token`, { method: "POST", headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: dec(account.refreshEnc) }) })
  await save({ tokenEnc: enc(t.access_token), ...(t.refresh_token ? { refreshEnc: enc(t.refresh_token) } : {}), expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString() })
  return t.access_token
}

/** Fit a post into 280 characters at a sentence or word boundary. */
function fit(text: string): string {
  if (text.length <= 280) return text
  const cut = text.slice(0, 279)
  const at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("\n"))
  return at > 140 ? cut.slice(0, at + 1).trim() : `${cut.slice(0, cut.lastIndexOf(" ")).trim()}…`
}

export const x: Provider = {
  usesPkce: true,
  authUrl({ state, redirectUri, challenge }) {
    const q = new URLSearchParams({ response_type: "code", client_id: process.env.X_CLIENT_ID!, redirect_uri: redirectUri, scope: "tweet.read tweet.write users.read media.write offline.access", state, code_challenge: challenge!, code_challenge_method: "S256" })
    return `https://x.com/i/oauth2/authorize?${q}`
  },

  async connect({ code, redirectUri, verifier }) {
    const t = await api<Tok>(`${A}/oauth2/token`, { method: "POST", headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: verifier ?? "" }) })
    const me = await api<{ data: { id: string; name: string; username: string; profile_image_url?: string } }>(`${A}/users/me?user.fields=profile_image_url`, { headers: { Authorization: `Bearer ${t.access_token}` } })
    return [{ platform: "x", externalId: me.data.id, name: me.data.name, handle: me.data.username, avatar: me.data.profile_image_url ?? null, tokenEnc: enc(t.access_token), refreshEnc: t.refresh_token ? enc(t.refresh_token) : null, expiresAt: new Date(Date.now() + t.expires_in * 1000).toISOString(), extra: { username: me.data.username } }]
  },

  async publish(account, post, save) {
    const tk = await token(account, save)
    let mediaId: string | null = null
    if (post.imageBytes) {
      const form = new FormData()
      form.append("media", new Blob([new Uint8Array(post.imageBytes)], { type: "image/jpeg" }), "image.jpg")
      form.append("media_category", "tweet_image")
      const m = await api<{ data?: { id?: string } }>(`${A}/media/upload`, { method: "POST", headers: { Authorization: `Bearer ${tk}` }, body: form })
      mediaId = m.data?.id ?? null
    }
    const r = await api<{ data: { id: string } }>(`${A}/tweets`, { method: "POST", headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" }, body: JSON.stringify({ text: fit(post.text), ...(mediaId ? { media: { media_ids: [mediaId] } } : {}) }) })
    const user = account.extra?.username ?? account.handle
    return { externalId: r.data.id, url: user ? `https://x.com/${user}/status/${r.data.id}` : null }
  },
}
