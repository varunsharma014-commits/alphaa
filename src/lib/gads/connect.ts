// After the owner signs in to Google for Ads: save the refresh token (encrypted) and the ad
// accounts they can reach. Manager (MCC) accounts are skipped: we only run ads in the owner's
// own account. One account = picked automatically; several = the owner picks in the chat.
import { customerInfo, listAccessibleCustomers } from "./api"
import { exchangeGadsCode, ADWORDS_SCOPE } from "./oauth"
import { rememberToken, forgetToken } from "./client"
import { enc, getGadsAccount, saveGadsAccount, type GadsAccount, type GadsChoice } from "./store"

export async function connectGads(userId: string, code: string): Promise<GadsAccount> {
  const t = await exchangeGadsCode(code)
  if (!t.scope.split(" ").includes(ADWORDS_SCOPE)) throw new Error("Google didn’t give access to Google Ads. Tick the Google Ads box when you sign in.")
  const prev = await getGadsAccount(userId)
  const refresh = t.refreshToken ? enc(t.refreshToken) : prev?.refreshEnc
  if (!refresh) throw new Error("Google didn’t send a lasting sign-in. Try again.")
  forgetToken(userId)
  rememberToken(userId, t.accessToken, t.expiresAt)
  const choices = await accountChoices(t.accessToken)
  const one = choices.length === 1 ? choices[0] : null
  // Keep the campaign I built if they reconnect the same account.
  const same = prev?.customerId && choices.some((c) => c.id === prev.customerId)
  return saveGadsAccount(userId, {
    refreshEnc: refresh,
    scope: t.scope,
    connectedAt: new Date().toISOString(),
    status: "active",
    choices,
    ...(same ? {} : one ? { customerId: one.id, customerName: one.name, currency: one.currency, test: one.test, campaign: undefined } : { customerId: undefined, customerName: undefined, currency: undefined, campaign: undefined }),
  })
}

export async function accountChoices(token: string): Promise<GadsChoice[]> {
  const ids = (await listAccessibleCustomers({ token })).slice(0, 25)
  const infos = await Promise.all(ids.map((id) => customerInfo(id, { token }).catch(() => null)))
  return infos
    .filter((c): c is NonNullable<typeof c> => !!c && !c.manager && c.status !== "CANCELED" && c.status !== "CLOSED")
    .map((c) => ({ id: c.id, name: c.name, currency: c.currency, test: c.test }))
}

export async function pickAccount(userId: string, customerId: string): Promise<GadsAccount | null> {
  const a = await getGadsAccount(userId)
  const c = a?.choices?.find((x) => x.id === customerId)
  if (!a || !c) return null
  if (a.customerId === c.id) return a
  return saveGadsAccount(userId, { customerId: c.id, customerName: c.name, currency: c.currency, test: c.test, campaign: undefined })
}
