"use client"

// Wraps the embedded agent so it follows the OS light/dark setting on v3 pages
// (agent.css themes itself from [data-agent][data-theme]).
import { useEffect, useState, type ReactNode } from "react"

export function FollowTheme({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)")
    const on = () => setDark(m.matches)
    on()
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [])
  return <div data-agent="" data-theme={dark ? "dark" : "light"} data-brand="blue" style={{ background: "transparent" }}>{children}</div>
}
