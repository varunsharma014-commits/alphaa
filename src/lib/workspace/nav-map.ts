// Route → the ONE sidebar item that is lit. Pure and client-safe. WorkspaceShell (package 1)
// reads `activeNav(pathname)` instead of matching hrefs one by one, so exactly one item is on.
//
// Keys are the sidebar items. "more" means an item inside the More list; `moreHref` says which.
export type NavKey = "briefing" | "research" | "social" | "calendar" | "email" | "ads" | "tracking" | "settings" | "more" | "admin"

export type NavHit = { key: NavKey; moreHref?: string }

// Longest prefix wins. Order doesn't matter.
const RULES: { prefix: string; key: NavKey; moreHref?: string }[] = [
  { prefix: "/dashboard/research", key: "research" },
  { prefix: "/dashboard/social/calendar", key: "calendar" },
  { prefix: "/dashboard/social", key: "social" },
  { prefix: "/dashboard/email", key: "email" },
  { prefix: "/dashboard/ads", key: "ads" },
  { prefix: "/dashboard/ad-strategy", key: "ads" },
  { prefix: "/dashboard/tracking", key: "tracking" },
  { prefix: "/dashboard/settings", key: "settings" },
  { prefix: "/dashboard/upgrade", key: "settings" },
  { prefix: "/dashboard/admin", key: "admin" },
  { prefix: "/dashboard/concierge", key: "settings" },
  // Old pages folded into a workspace (their content lives there now): light the workspace.
  { prefix: "/dashboard/keywords", key: "research" },
  { prefix: "/dashboard/competitors", key: "research" },
  { prefix: "/dashboard/content-gaps", key: "research" },
  { prefix: "/dashboard/audit", key: "tracking" },
  { prefix: "/dashboard/speed", key: "tracking" },
  // Inside More.
  { prefix: "/dashboard/sandbox", key: "more", moreHref: "/dashboard/sandbox" },
  { prefix: "/dashboard/vault", key: "more", moreHref: "/dashboard/vault" },
  { prefix: "/dashboard/visibility", key: "more", moreHref: "/dashboard/visibility" },
  { prefix: "/dashboard/citations", key: "more", moreHref: "/dashboard/citations" },
  { prefix: "/dashboard/posts", key: "more", moreHref: "/dashboard/posts" },
  { prefix: "/dashboard/content-plan", key: "more", moreHref: "/dashboard/posts" },
  { prefix: "/dashboard/reviews", key: "more", moreHref: "/dashboard/reviews" },
  { prefix: "/dashboard/reports", key: "more", moreHref: "/dashboard/reports" },
]

export function activeNav(pathname: string): NavHit {
  const path = pathname.replace(/\/+$/, "") || "/"
  let best: (typeof RULES)[number] | null = null
  for (const r of RULES) {
    if ((path === r.prefix || path.startsWith(`${r.prefix}/`)) && (!best || r.prefix.length > best.prefix.length)) best = r
  }
  if (best) return { key: best.key, moreHref: best.moreHref }
  return { key: "briefing" }
}

/** True when the More list should start open (the lit item lives inside it). */
export const moreOpenFor = (pathname: string) => activeNav(pathname).key === "more"
