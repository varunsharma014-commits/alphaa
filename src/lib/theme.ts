// Shared dashboard-theme constants.
//
// These MUST live in a neutral (non-"use client") module: a Server Component
// importing a value from a "use client" file gets a client-reference proxy
// rather than the value, which silently broke the cookie lookup in the
// dashboard layout (server always painted dark while the cookie said light).
export type DashboardTheme = "light" | "dark"

export const THEME_COOKIE = "alphaa-dashboard-theme"
