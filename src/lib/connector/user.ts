import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

/** Signed-in Alphaa user for an API route, or null. */
export async function currentUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  return db.user.findUnique({ where: { clerkId } })
}

const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:|\[?fe80:)|\.(localhost|local|internal)$/i
// Local development talks to a local WordPress (e.g. alphaa-e2e.localhost); production never may.
const privateHostsAllowed = () => process.env.NODE_ENV !== "production"

/** A public http(s) URL we're willing to call from the server. */
export function publicUrl(raw: string): URL | null {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    if (!privateHostsAllowed() && (PRIVATE.test(u.hostname) || !u.hostname.includes("."))) return null
    return u
  } catch {
    return null
  }
}

/**
 * The name check above can't see where a hostname points. Before the server calls a
 * customer-supplied address, resolve it and refuse private/loopback/link-local IPs, so a
 * site can't steer our requests into Railway's internal network (also covers DNS changes
 * made after connecting).
 */
export async function assertPublicHost(hostname: string): Promise<void> {
  if (privateHostsAllowed()) return
  const { lookup } = await import("node:dns/promises")
  const addrs = await lookup(hostname.replace(/^\[|\]$/g, ""), { all: true })
  const bad = (ip: string) =>
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) ||
    /^(::1?$|f[cd][0-9a-f]{2}:|fe80:|::ffff:(127|10|192\.168|169\.254)\.)/i.test(ip)
  if (!addrs.length || addrs.some((a) => bad(a.address))) throw new Error("This site's address can't be reached from the internet.")
}

export const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "")
