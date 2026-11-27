import { db } from "@/lib/db"
import { saveAgentSettings } from "@/lib/agent/settings"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"
import { randomBytes } from "crypto"
import { webflowRevoke, webflowSetup } from "@/lib/connector/webflow"

// A Webflow install that starts on Webflow's side (Marketplace / Install button) often arrives
// before the owner is signed in to Alphaa. The OAuth code is exchanged immediately; the token is
// kept SERVER-SIDE ONLY (in this process's memory, never written to disk, the database or the
// browser) for up to 30 minutes. The browser gets only an httpOnly cookie holding a random,
// encrypted handle. After sign-up / sign-in, /api/connect/webflow/finish swaps the handle for the
// token and attaches it. One Webflow authorization, never two. Unclaimed tokens are revoked at
// Webflow when they expire. (Railway runs one replica; a deploy mid-install means "connect again".)
export const WF_PENDING_COOKIE = "wf_pending"
export const WF_PENDING_MAX_AGE = 60 * 30 // seconds

// The nonce of the authorization request this browser started (/api/connect/webflow/start). Webflow
// codes are valid for 15 minutes, so the nonce is too.
export const WF_STATE_COOKIE = "wf_state"
export const WF_STATE_MAX_AGE = 60 * 15 // seconds

type Pending = { accessToken: string; at: number }
const g = globalThis as unknown as { __wfPending?: Map<string, Pending> }
const pending = (g.__wfPending ??= new Map<string, Pending>())

function prune(now = Date.now()) {
  for (const [handle, p] of pending) {
    if (now - p.at > WF_PENDING_MAX_AGE * 1000) {
      pending.delete(handle)
      void webflowRevoke(p.accessToken) // never claimed: give the access back
    }
  }
}

/** Park a freshly exchanged token server-side; returns the cookie value (an encrypted random handle). */
export function sealPending(accessToken: string): string {
  prune()
  const handle = randomBytes(24).toString("base64url")
  pending.set(handle, { accessToken, at: Date.now() })
  return encryptSecret(JSON.stringify({ h: handle }))
}

/** Swap the cookie's handle for the parked token (one use). Null when unknown or expired. */
export function openPending(value: string | undefined): string | null {
  prune()
  if (!value) return null
  try {
    const { h } = JSON.parse(decryptSecret(value)) as { h?: string }
    const p = h ? pending.get(h) : undefined
    if (!h || !p) return null
    pending.delete(h)
    return p.accessToken
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
