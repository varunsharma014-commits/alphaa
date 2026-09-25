import { createHmac, timingSafeEqual } from "crypto"

// Connection keys are derived, not stored: key = "<userId>.<hmac(userId)>".
// Rotating CONNECTOR_SECRET (or CLERK_SECRET_KEY, the fallback) disconnects
// every site, so set CONNECTOR_SECRET once and leave it.
function secret(): string {
  const s = process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY
  if (!s) throw new Error("CONNECTOR_SECRET is not set")
  return s
}

const mac = (purpose: string, userId: string) => createHmac("sha256", secret()).update(`${purpose}:${userId}`).digest("hex")

export function connectionKey(userId: string): string {
  return `${userId}.${mac("wp", userId).slice(0, 40)}`
}

/** Returns the userId when the key is genuine, otherwise null. */
export function verifyConnectionKey(key: string): string | null {
  const [userId, sig] = key.trim().split(".")
  if (!userId || !sig || !/^[a-z0-9]{10,40}$/i.test(userId)) return null
  const want = Buffer.from(mac("wp", userId).slice(0, 40))
  const got = Buffer.from(sig)
  return want.length === got.length && timingSafeEqual(want, got) ? userId : null
}

/** IndexNow key the plugin serves at /<key>.txt on the customer's own domain. */
export function indexNowKey(userId: string): string {
  return mac("indexnow", userId).slice(0, 32)
}

/** Requests to the plugin are signed: HMAC-SHA256(key, timestamp + "." + body). */
export function sign(key: string, ts: string, body: string): string {
  return createHmac("sha256", key).update(`${ts}.${body}`).digest("hex")
}
