// Where to send someone after sign-in / sign-up. Only same-site paths the app expects
// (connector flows, dashboard, onboarding) — never an open redirect.
const ALLOWED = ["/api/connect/", "/dashboard", "/onboarding"]

export function safeNext(raw: string | undefined | null, fallback: string): string {
  if (!raw) return fallback
  let path = raw
  try {
    // Accept absolute alphaa.app URLs too, reduced to their path.
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw)
      const app = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
      if (u.host !== app.host) return fallback
      path = u.pathname + u.search
    }
  } catch {
    return fallback
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback
  return ALLOWED.some((p) => path.startsWith(p)) ? path : fallback
}
