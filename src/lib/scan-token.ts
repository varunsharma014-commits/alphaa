import { createHmac, timingSafeEqual } from "crypto"

// Scan results are gated behind a token that only ever reaches the visitor by
// email, so a bot (or someone typing a throwaway address) can't read a report.
// Deliberately derived, not stored: no schema change, and the link keeps working
// for the owner of the address indefinitely — it is their own report.
//
// CRON_SECRET is reused as the signing key; it is already required in every
// environment. If it were ever absent we fail closed rather than issue tokens
// anyone could forge.
function key(): string | null {
  const s = process.env.CRON_SECRET
  return s && s.length >= 16 ? s : null
}

export function makeScanToken(scanId: string, email: string): string | null {
  const k = key()
  if (!k) return null
  return createHmac("sha256", k)
    .update(`${scanId}:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 32)
}

export function verifyScanToken(
  scanId: string,
  email: string,
  token: string | null | undefined
): boolean {
  if (!token) return false
  const expected = makeScanToken(scanId, email)
  if (!expected) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function scanResultsUrl(scanId: string, email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  const t = makeScanToken(scanId, email)
  return t
    ? `${base}/scan/results?id=${scanId}&t=${t}`
    : `${base}/scan/results?id=${scanId}`
}
