import { createHmac, timingSafeEqual } from "crypto"
import type { ApprovalKind } from "@/lib/approvals"

// Signed one-item approval links for the weekly briefing email, so an owner
// can approve from their inbox without logging in. A token names exactly one
// item (user + kind + id) and expires; it can only publish that item. Signed
// with CRON_SECRET like the unsubscribe links; without it, no links are issued.
//
// Teams (2026-11-28): a link in a MEMBER's copy of the briefing also names the member (`m`). The
// /approve step then re-reads that member's CURRENT role: publisher/admin publish, a reviewer
// only approves for a publisher, a creator or a removed member can't use it. A link without `m`
// is the owner's and keeps the owner's rights.

const TTL_MS = 14 * 86_400_000
type Claim = { u: string; k: ApprovalKind; i: string; e: number; m?: string }

function key(): string | null {
  const s = process.env.CRON_SECRET
  return s && s.length >= 16 ? s : null
}
const sign = (k: string, payload: string) => createHmac("sha256", k).update(`approve:${payload}`).digest("base64url").slice(0, 43)

export function makeApproveToken(userId: string, kind: ApprovalKind, id: string, memberId?: string): string | null {
  const k = key()
  if (!k) return null
  const claim: Claim = { u: userId, k: kind, i: id, e: Date.now() + TTL_MS, ...(memberId ? { m: memberId } : {}) }
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url")
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
    if (c.m !== undefined && typeof c.m !== "string") return null
    return c
  } catch {
    return null
  }
}

export function approveUrl(userId: string, kind: ApprovalKind, id: string, memberId?: string): string | null {
  const t = makeApproveToken(userId, kind, id, memberId)
  return t ? `${process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"}/approve?t=${t}` : null
}
