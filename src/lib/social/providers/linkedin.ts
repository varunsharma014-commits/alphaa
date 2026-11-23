// LinkedIn: posts to the owner's own profile ("Share on LinkedIn", self-serve product) and,
// once the Community Management API is approved (LINKEDIN_ORG_SCOPES=1), to the company
// Pages they administer. Tokens last 60 days with no refresh: after that, reconnect.
import { api } from "../oauth"
import type { Provider, SocialAccount } from "../types"
import { dec, enc } from "../store"

const V = () => process.env.LINKEDIN_VERSION || "202509"
const orgScopes = () => process.env.LINKEDIN_ORG_SCOPES === "1"
export const rest = (token: string, extra: Record<string, string> = {}) => ({ Authorization: `Bearer ${token}`, "LinkedIn-Version": V(), "X-Restli-Protocol-Version": "2.0.0", ...extra })

/** LinkedIn's "little" text format reserves these characters. */
const escapeCommentary = (s: string) => s.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`)

export const linkedin: Provider = {
  authUrl({ state, redirectUri }) {
    const scope = ["openid", "profile", "w_member_social", ...(orgScopes() ? ["w_organization_social", "r_organization_social", "rw_organization_admin"] : [])].join(" ")
    const q = new URLSearchParams({ response_type: "code", client_id: process.env.LINKEDIN_CLIENT_ID!, redirect_uri: redirectUri, state, scope })
    return `https://www.linkedin.com/oauth/v2/authorization?${q}`
  },

  async connect({ code, redirectUri }) {
    const t = await api<{ access_token: string; expires_in: number }>("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: process.env.LINKEDIN_CLIENT_ID!, client_secret: process.env.LINKEDIN_CLIENT_SECRET! }),
    })
    const expiresAt = new Date(Date.now() + t.expires_in * 1000).toISOString()
    const me = await api<{ sub: string; name?: string; picture?: string }>("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${t.access_token}` } })
    const out: Awaited<ReturnType<Provider["connect"]>> = [
      { platform: "linkedin", externalId: `urn:li:person:${me.sub}`, name: me.name ?? "Your LinkedIn profile", avatar: me.picture ?? null, tokenEnc: enc(t.access_token), expiresAt, extra: { author: `urn:li:person:${me.sub}`, kind: "person" } },
    ]
    if (orgScopes()) {
      const acl = await api<{ elements?: { organization: string }[] }>("https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED", { headers: rest(t.access_token) }).catch(() => ({ elements: [] }))
      for (const e of acl.elements ?? []) {
        const orgId = e.organization.split(":").pop()
        const org = await api<{ localizedName?: string }>(`https://api.linkedin.com/rest/organizations/${orgId}`, { headers: rest(t.access_token) }).catch(() => ({ localizedName: undefined }))
        out.push({ platform: "linkedin", externalId: e.organization, name: org.localizedName ?? "Company page", tokenEnc: enc(t.access_token), expiresAt, extra: { author: e.organization, kind: "organization" } })
      }
    }
    return out
  },

  async publish(account: SocialAccount, post) {
    if (account.expiresAt && Date.parse(account.expiresAt) < Date.now()) throw new Error("LinkedIn access expired. Reconnect LinkedIn.")
    const token = dec(account.tokenEnc)
    const author = account.extra?.author ?? account.externalId
    let media: string | null = null
    if (post.imageBytes) {
      const init = await api<{ value: { uploadUrl: string; image: string } }>("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers: rest(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
      })
      const up = await fetch(init.value.uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: new Uint8Array(post.imageBytes) })
      if (!up.ok) throw new Error(`LinkedIn image upload failed (${up.status}).`)
      media = init.value.image
    }
    const r = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: rest(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        author,
        commentary: escapeCommentary(post.text).slice(0, 3000),
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        ...(media ? { content: { media: { id: media, altText: (post.title ?? "").slice(0, 120) } } } : {}),
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!r.ok) throw new Error(`LinkedIn didn’t accept the post: ${(await r.text()).slice(0, 200)}`)
    const urn = r.headers.get("x-restli-id")
    return { externalId: urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}` : null }
  },
}

/**
 * LinkedIn company Pages, through Alphaa's second LinkedIn app (Community Management API only;
 * LinkedIn doesn't allow other products next to it). Lists the Pages the owner administers and
 * saves each one; posting is the same REST call as a profile post, with the Page as author.
 */
const PAGE_SCOPES = "w_organization_social r_organization_social rw_organization_admin"
export const linkedinPages: Provider = {
  authUrl({ state, redirectUri }) {
    const q = new URLSearchParams({ response_type: "code", client_id: process.env.LINKEDIN_PAGES_CLIENT_ID!, redirect_uri: redirectUri, state, scope: PAGE_SCOPES })
    return `https://www.linkedin.com/oauth/v2/authorization?${q}`
  },

  async connect({ code, redirectUri }) {
    const t = await api<{ access_token: string; expires_in: number }>("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: process.env.LINKEDIN_PAGES_CLIENT_ID!, client_secret: process.env.LINKEDIN_PAGES_CLIENT_SECRET! }),
    })
    const expiresAt = new Date(Date.now() + t.expires_in * 1000).toISOString()
    const acl = await api<{ elements?: { organization: string }[] }>("https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED", { headers: rest(t.access_token) })
    const out: Awaited<ReturnType<Provider["connect"]>> = []
    for (const e of acl.elements ?? []) {
      const orgId = e.organization.split(":").pop()
      const org = await api<{ localizedName?: string; vanityName?: string }>(`https://api.linkedin.com/rest/organizations/${orgId}`, { headers: rest(t.access_token) }).catch(() => ({ localizedName: undefined, vanityName: undefined }))
      out.push({ platform: "linkedin", externalId: e.organization, name: org.localizedName ?? "Company page", handle: org.vanityName ?? null, tokenEnc: enc(t.access_token), expiresAt, extra: { author: e.organization, kind: "organization" } })
    }
    if (!out.length) throw new Error("you’re not an admin of any LinkedIn company page. Ask a Page admin to add you, then connect again")
    return out
  },

  publish: (account, post, save) => linkedin.publish(account, post, save),
}
