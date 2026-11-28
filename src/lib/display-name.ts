// Account and page names as the owner should see them. Platforms sometimes hand back names
// with decoration in front ("━Varun Sharma", "• Sample Page", "@@shop"): strip anything before the
// first letter or digit, collapse spaces, and fall back when nothing readable is left.
export function displayName(raw: string | null | undefined, fallback = "Your account"): string {
  if (!raw) return fallback
  const s = raw
    .normalize("NFC")
    .replace(/^[^\p{L}\p{N}@]+/u, "")
    .replace(/[​-‍﻿]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  return s || fallback
}
