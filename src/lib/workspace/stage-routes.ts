// Which dashboard routes render inside the workspace stage (`.ax-stage`, the new design)
// instead of the older `.ax-legacy` wrapper. WorkspaceShell reads `isStageRoute()`.
//
// A page package adds its route here ONLY once that page is rebuilt with the shared
// components in components/workspace/ds. One route per line, in your package's block, so
// parallel packages don't collide. Exact paths match exactly; entries ending in "/*" also
// match everything under them.
const CORE = [
  "/dashboard",
  "/dashboard/research",
  "/dashboard/social",
  "/dashboard/social/calendar",
  "/dashboard/email",
  "/dashboard/ads",
  "/dashboard/tracking",
  "/dashboard/citations",
]

// Package 0: design system gallery.
const P0 = [
  "/dashboard/admin/ds",
]

// Package 1: shell, navigation and overlays.
const P1: string[] = [
]

// Package 2: Briefing, Research, Social, Calendar.
const P2: string[] = [
]

// Package 3: Ads, Email, Tracking (+ site health).
const P3: string[] = [
]

// Package 4: Settings, billing, plans, admin.
const P4: string[] = [
  "/dashboard/settings/*",
  "/dashboard/upgrade",
  "/dashboard/admin/usage",
]

// Package 5: AI visibility and Google listing detail pages.
const P5: string[] = [
]

export const STAGE_ROUTES: readonly string[] = [...CORE, ...P0, ...P1, ...P2, ...P3, ...P4, ...P5]

export function isStageRoute(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  return STAGE_ROUTES.some((r) => (r.endsWith("/*") ? path === r.slice(0, -2) || path.startsWith(r.slice(0, -1)) : path === r))
}
