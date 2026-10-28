import { createHmac, timingSafeEqual } from "crypto"
import type { ApprovalKind } from "@/lib/approvals"

// Signed one-item approval links for the weekly briefing email, so an owner
// can approve from their inbox without logging in. A token names exactly one
// item (user + kind + id) and expires; it can only publish that item. Signed
// with CRON_SECRET like the unsubscribe links; without it, no links are issued.

const TTL_MS = 14 * 86_400_000
type Claim = { u: string; k: ApprovalKind; i: string; e: number }

function key(): string | null {
  const s = process.env.CRON_SECRET
  return s && s.length >= 16 ? s : null
}
const sign = (k: string, payload: string) => createHmac("sha256", k).update(`approve:${payload}`).digest("base64url").slice(0, 43)

export function makeApproveToken(userId: string, kind: ApprovalKind, id: string): string | null {
  const k = key()
  if (!k) return null
  const payload = Buffer.from(JSON.stringify({ u: userId, k: kind, i: id, e: Date.now() + TTL_MS } satisfies Claim)).toString("base64url")
  return `${payload}.${sign(k, payload)}`
}

export function readApproveToken(token: string): Claim | null {
  const k = key()
  const [payload, mac] = token.split(".")
  if (!k || !payload || !mac) return null
  const want = Buffer.from(sign(k, payload))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const c = JSON.parse(Buffer.from(payload, "base64url").toString()) as Claim
    if (typeof c.e !== "number" || c.e < Date.now()) return null
    if (!["review", "gbp", "post"].includes(c.k) || typeof c.u !== "string" || typeof c.i !== "string") return null
    return c
  } catch {
    return null
  }
}

export function approveUrl(userId: string, kind: ApprovalKind, id: string): string | null {
  const t = makeApproveToken(userId, kind, id)
  return t ? `${process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"}/approve?t=${t}` : null
}
