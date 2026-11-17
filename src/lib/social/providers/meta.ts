// Meta: one Facebook Login brings the owner's Facebook Pages and the Instagram business
// accounts linked to them. Page tokens from a long-lived user token don't expire.
// Needs META_APP_ID / META_APP_SECRET and, for customers outside the app's roles, App Review
// for pages_manage_posts, pages_read_engagement, instagram_content_publish (docs/growth-platform-applications.md).
import { api } from "../oauth"
import type { Provider } from "../types"
import { dec, enc } from "../store"

const G = "https://graph.facebook.com/v21.0"
const SCOPES = ["pages_show_list", "pages_manage_posts", "pages_read_engagement", "instagram_basic", "instagram_content_publish", "business_management"]
const id = () => process.env.META_APP_ID!
const secret = () => process.env.META_APP_SECRET!

type Page = { id: string; name: string; access_token: string; picture?: { data?: { url?: string } }; instagram_business_account?: { id: string; username?: string; profile_picture_url?: string } }

export const meta: Provider = {
  authUrl({ state, redirectUri }) {
    const q = new URLSearchParams({ client_id: id(), redirect_uri: redirectUri, state, scope: SCOPES.join(","), response_type: "code" })
    return `https://www.facebook.com/v21.0/dialog/oauth?${q}`
  },

  async connect({ code, redirectUri }) {
    const short = await api<{ access_token: string }>(`${G}/oauth/access_token?${new URLSearchParams({ client_id: id(), client_secret: secret(), redirect_uri: redirectUri, code })}`)
    const long = await api<{ access_token: string }>(`${G}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: id(), client_secret: secret(), fb_exchange_token: short.access_token })}`)
    const pages = await api<{ data: Page[] }>(`${G}/me/accounts?${new URLSearchParams({ fields: "id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}", limit: "50", access_token: long.access_token })}`)
    const out: Awaited<ReturnType<Provider["connect"]>> = []
    for (const p of pages.data ?? []) {
      out.push({ platform: "facebook", externalId: p.id, name: p.name, avatar: p.picture?.data?.url ?? null, tokenEnc: enc(p.access_token) })
      const ig = p.instagram_business_account
      if (ig) out.push({ platform: "instagram", externalId: ig.id, name: ig.username ? `@${ig.username}` : p.name, handle: ig.username ?? null, avatar: ig.profile_picture_url ?? null, tokenEnc: enc(p.access_token), extra: { pageId: p.id } })
    }
    if (!out.length) throw new Error("No Facebook Pages came back. Make sure you picked your business Page when Facebook asked.")
    return out
  },

  async publish(account, post) {
    const token = dec(account.tokenEnc)
    if (account.platform === "facebook") {
      if (post.imageUrl) {
        const r = await api<{ id: string; post_id?: string }>(`${G}/${account.externalId}/photos`, { method: "POST", body: new URLSearchParams({ url: post.imageUrl, message: post.text, access_token: token }) })
        const pid = r.post_id ?? r.id
        return { externalId: pid, url: `https://www.facebook.com/${pid}` }
      }
      const r = await api<{ id: string }>(`${G}/${account.externalId}/feed`, { method: "POST", body: new URLSearchParams({ message: post.text, access_token: token }) })
      return { externalId: r.id, url: `https://www.facebook.com/${r.id}` }
    }
    // Instagram needs an image (JPEG) and a two-step container → publish.
    if (!post.imageUrl) throw new Error("Instagram posts need an image.")
    const c = await api<{ id: string }>(`${G}/${account.externalId}/media`, { method: "POST", body: new URLSearchParams({ image_url: post.imageUrl, caption: post.text.slice(0, 2200), access_token: token }) })
    for (let i = 0; i < 10; i++) {
      const s = await api<{ status_code?: string }>(`${G}/${c.id}?fields=status_code&access_token=${encodeURIComponent(token)}`)
      if (s.status_code === "FINISHED") break
      if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error("Instagram couldn’t process the image.")
      await new Promise((r) => setTimeout(r, 2000))
    }
    const m = await api<{ id: string }>(`${G}/${account.externalId}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: c.id, access_token: token }) })
    const link = await api<{ permalink?: string }>(`${G}/${m.id}?fields=permalink&access_token=${encodeURIComponent(token)}`).catch(() => ({ permalink: undefined }))
    return { externalId: m.id, url: link.permalink ?? null }
  },
}
