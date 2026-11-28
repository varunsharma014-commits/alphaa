// Stale data: older than twice its schedule. Pure, client-safe (used by StaleBadge).
export function isStale(at: string | Date | null | undefined, scheduleDays: number, now = Date.now()): boolean {
  if (!at) return false
  const t = typeof at === "string" ? Date.parse(at) : at.getTime()
  if (!Number.isFinite(t)) return false
  return now - t > scheduleDays * 2 * 86_400_000
}
