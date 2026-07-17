"use client"

import { useState } from "react"
import { Moon, Sun } from "lucide-react"
import { THEME_COOKIE, type DashboardTheme } from "@/lib/theme"

// Light/dark switch for the app only. The preference lives in a cookie so the
// server renders the right theme on first paint (no flash), and it's applied to
// the dashboard wrapper — never <html> — so the marketing site stays dark.
export function ThemeToggle({ initial }: { initial: DashboardTheme }) {
  const [theme, setTheme] = useState<DashboardTheme>(initial)

  function apply(next: DashboardTheme) {
    setTheme(next)
    // 1 year, lax: it's a display preference, not a credential.
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    const root = document.querySelector("[data-dashboard-root]")
    if (root) root.setAttribute("data-theme", next)
  }

  const next: DashboardTheme = theme === "dark" ? "light" : "dark"
  const Icon = theme === "dark" ? Sun : Moon

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        border: "1px solid var(--ds-border)",
        background: "transparent",
        color: "var(--ds-text-mute)",
        cursor: "pointer",
        transition: "color 200ms, border-color 200ms",
      }}
    >
      <Icon size={15} />
    </button>
  )
}
