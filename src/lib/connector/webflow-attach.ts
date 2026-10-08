import { db } from "@/lib/db"
import { saveAgentSettings } from "@/lib/agent/settings"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"
import { webflowSetup } from "@/lib/connector/webflow"

// A Webflow install that starts on Webflow's side (Marketplace / Install button) often arrives
// before the owner is signed in to Alphaa. The OAuth code is exchanged immediately and the token
// is held in this short-lived, encrypted, httpOnly cookie until they sign in or sign up; then
// /api/connect/webflow/finish attaches it. One Webflow authorization, never two.
export const WF_PENDING_COOKIE = "wf_pending"
export const WF_PENDING_MAX_AGE = 60 * 30 // seconds

export function sealPending(accessToken: string): string {
  return encryptSecret(JSON.stringify({ accessToken, at: Date.now() }))
}

export function openPending(value: string | undefined): string | null {
  if (!value) return null
  try {
    const { accessToken, at } = JSON.parse(decryptSecret(value)) as { accessToken?: string; at?: number }
    if (!accessToken || !at || Date.now() - at > WF_PENDING_MAX_AGE * 1000) return null
    return accessToken
  } catch {
    return null
  }
}

type AttachUser = { id: string; websiteUrl: string | null }

/** Connect the Webflow site behind `accessToken` to this user. Returns an error message or null. */
export async function attachWebflow(user: AttachUser, accessToken: string): Promise<string | null> {
  let host: string | null = null
  try {
    host = user.websiteUrl ? new URL(/^https?:\/\//i.test(user.websiteUrl) ? user.websiteUrl : `https://${user.websiteUrl}`).hostname : null
  } catch {
    host = null
  }
  const setup = await webflowSetup(accessToken, host)
  if ("error" in setup) return setup.error

  // One website per account: connecting Webflow replaces any WordPress connection.
  await saveAgentSettings(user.id, {
    wp: undefined,
    site: {
      platform: "webflow",
      siteUrl: setup.siteUrl,
      label: setup.label,
      tokenEnc: encryptSecret(JSON.stringify({ accessToken })),
      config: setup.config,
      connectedAt: new Date().toISOString(),
    },
  })
  if (!user.websiteUrl) {
    await db.user.update({ where: { id: user.id }, data: { websiteUrl: setup.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") } })
  }
  await db.mockActivity.create({
    data: {
      userId: user.id,
      type: "site_connected",
      title: `Connected your Webflow site ${setup.label}`,
      metadata: { platform: "webflow", siteUrl: setup.siteUrl, label: setup.label },
    },
  })
  return null
}
