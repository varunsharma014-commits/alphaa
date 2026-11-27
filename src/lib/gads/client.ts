// One brand's Google Ads connection: access tokens from the encrypted refresh token (kept in
// memory only), and every write counted as usage ("ads_op", one per operation).
import { tallyUsage } from "@/lib/usage"
import { refreshGadsToken } from "./oauth"
import { dec, getGadsAccount, saveGadsAccount, type GadsAccount } from "./store"
import * as api from "./api"

const tokens = new Map<string, { token: string; exp: number }>()

export class NotConnected extends Error {}

/** A fresh access token for this brand's Google Ads connection. Marks the account expired if Google revoked it. */
export async function accessToken(userId: string, acc?: GadsAccount | null): Promise<string> {
  const hit = tokens.get(userId)
  if (hit && hit.exp > Date.now() + 60_000) return hit.token
  const a = acc ?? (await getGadsAccount(userId))
  if (!a?.refreshEnc || a.status !== "active") throw new NotConnected("Google Ads isn’t connected.")
  try {
    const t = await refreshGadsToken(dec(a.refreshEnc))
    tokens.set(userId, { token: t.accessToken, exp: t.expiresAt })
    return t.accessToken
  } catch (err) {
    if ((err as { code?: string }).code === "invalid_grant") {
      await saveGadsAccount(userId, { status: "expired" })
      throw new NotConnected("Google Ads access was removed. Connect it again.")
    }
    throw err
  }
}

export const forgetToken = (userId: string) => tokens.delete(userId)
export const rememberToken = (userId: string, token: string, exp: number) => tokens.set(userId, { token, exp })

export type Gads = {
  customerId: string
  account: GadsAccount
  search: <R = Record<string, unknown>>(query: string) => Promise<R[]>
  mutate: (service: api.MutateService, ops: api.Operation[]) => Promise<string[]>
  mutateAll: (ops: api.MutateOperation[]) => Promise<string[]>
  keywordIdeas: (body: ReturnType<typeof api.keywordIdeasBody>) => Promise<api.KeywordIdea[]>
  geoTarget: (city: string, country: string | null) => Promise<string | null>
}

/** The brand's chosen ad account, ready to call. Throws NotConnected if there isn't one. */
export async function gadsFor(userId: string): Promise<Gads> {
  const account = await getGadsAccount(userId)
  if (!account?.customerId) throw new NotConnected("Pick your Google Ads account first.")
  const token = await accessToken(userId, account)
  const o = { token }
  const cid = account.customerId
  return {
    customerId: cid,
    account,
    search: (q) => api.searchStream(cid, q, o),
    mutate: async (service, ops) => {
      const r = await api.mutate(cid, service, ops, o)
      tallyUsage(userId, "ads_op", ops.length)
      return r
    },
    mutateAll: async (ops) => {
      const r = await api.mutateAll(cid, ops, o)
      tallyUsage(userId, "ads_op", ops.length)
      return r
    },
    keywordIdeas: (body) => api.generateKeywordIdeas(cid, body, o),
    geoTarget: (city, country) => api.suggestGeoTarget(city, country, o),
  }
}

/** Owner-readable reason from any Google Ads failure. */
export function adsErrorText(err: unknown): string {
  if (err instanceof NotConnected) return err.message
  if (err instanceof api.GadsError) {
    if (err.codes.some((c) => c.includes("USER_PERMISSION_DENIED") || c.includes("ACTION_NOT_PERMITTED"))) return "Google says this login can’t make changes to that ad account. Ask the account’s admin for Standard access, then try again."
    if (err.codes.some((c) => c.includes("CLOUD_PROJECT_NOT_APPROVED"))) return "Google hasn’t approved Alphaa for live ad accounts yet. Nothing was changed."
    if (err.codes.some((c) => c.includes("CUSTOMER_NOT_ENABLED"))) return "That ad account isn’t active in Google Ads yet. Finish its setup (billing) on ads.google.com, then try again."
    return `Google Ads said: ${err.message}`
  }
  return err instanceof Error ? err.message.slice(0, 200) : "Something went wrong."
}
