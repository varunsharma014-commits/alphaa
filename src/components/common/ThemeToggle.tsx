"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

type Theme = "light" | "dark"

/**
 * Light/dark toggle for the dashboard. The actual theme attribute is set on
 * <html> before paint by the inline script in the root layout (anti-FOUC);
 * this button just flips it and persists the choice to localStorage.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme) || "dark"
    setTheme(current)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.setAttribute("data-theme", next)
    try {
      localStorage.setItem("alphaa-theme", next)
    } catch {
      // localStorage unavailable — theme still applies for this session
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-fg/30 hover:text-fg/80 hover:bg-fg/[0.06] transition-colors"
    >
      {/* Render the icon for the theme you'd switch TO. Avoid hydration
          mismatch by showing a stable icon until mounted. */}
      {!mounted ? (
        <Moon className="w-4 h-4" />
      ) : theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  )
}
