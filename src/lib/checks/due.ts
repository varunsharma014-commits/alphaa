// Which weekly checks a brand still needs (pure, tested in scripts/test-cron-dedupe.ts). Each kind
// is stored as its own MockActivity row (check_<kind>, site_check), so dedupe is per kind and a
// run cut off half way through a brand resumes with the kinds it didn't reach.
import type { CheckKind } from "./run"

export type CheckStep = CheckKind | "site"
export const CHECK_STEPS: CheckStep[] = ["security", "profiles", "listings", "bing", "site"]

/** `recentTypes` = MockActivity types stored for the brand in the last 5 days. */
export function dueSteps(recentTypes: string[]): CheckStep[] {
  const have = new Set(recentTypes)
  return CHECK_STEPS.filter((k) => !have.has(k === "site" ? "site_check" : `check_${k}`))
}
