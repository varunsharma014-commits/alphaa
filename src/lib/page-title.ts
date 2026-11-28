import type { Metadata } from "next"

// One browser-tab title format for the signed-in app: "Briefing · Alphaa".
// Returns an absolute title so it reads the same whatever layout template sits above it.
// Usage: export const metadata = { title: pageTitle("Briefing") }
export const TITLE_SUFFIX = "Alphaa"

export function pageTitle(name: string): NonNullable<Metadata["title"]> {
  const clean = name.replace(/\s*[|—–-]\s*Alphaa\s*$/i, "").trim()
  return { absolute: clean ? `${clean} · ${TITLE_SUFFIX}` : TITLE_SUFFIX }
}
