import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

/** Signed-in Alphaa user for an API route, or null. */
export async function currentUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  return db.user.findUnique({ where: { clerkId } })
}

const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i

/** A public http(s) URL we're willing to call from the server. */
export function publicUrl(raw: string): URL | null {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    if (PRIVATE.test(u.hostname) || !u.hostname.includes(".")) return null
    return u
  } catch {
    return null
  }
}

export const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "")
