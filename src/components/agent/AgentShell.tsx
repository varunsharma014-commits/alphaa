"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import type { DashboardTheme } from "@/lib/theme"
import type { RailData } from "@/lib/agent/feed"
import { AgentRail } from "./AgentRail"

const TITLES: [string, string][] = [
  ["/dashboard/reviews", "Reviews"],
  ["/dashboard/vault", "What AI reads about you"],
  ["/dashboard/citations", "Where AI looks you up"],
  ["/dashboard/competitors", "Competitors"],
  ["/dashboard/reports", "Weekly notes"],
  ["/dashboard/sandbox", "Ask the AIs"],
  ["/dashboard/settings", "Settings"],
  ["/dashboard/concierge", "Have a human do it"],
  ["/dashboard/posts", "Google listing"],
  ["/dashboard/content", "Content"],
  ["/dashboard/keywords", "Google rankings"],
  ["/dashboard/audit", "Website health"],
  ["/dashboard/speed", "Site speed"],
  ["/dashboard/visibility", "AI answers"],
]

export function AgentShell({
  rail,
  theme,
  trialDaysLeft,
  showUser = true,
  children,
}: {
  rail: RailData
  theme: DashboardTheme
  trialDaysLeft: number | null
  showUser?: boolean // dev preview renders without a Clerk session
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === "/dashboard" || pathname === "/preview"
  const title = isHome ? "Today" : TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Detail"

  return (
    <div className="ag-app">
      <AgentRail rail={rail} open={open} onClose={() => setOpen(false)} />
      <div className="ag-main">
        <header className="ag-head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="ag-head__menu" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? "Close" : "Menu"}
            </button>
            <h1>{title}</h1>
            {isHome && (
              <span className="ag-head__since">
                <span className="ag-dot ag-dot--live" style={{ width: 6, height: 6 }} /> working for you
              </span>
            )}
          </div>
          <div className="ag-head__right">
            {trialDaysLeft !== null && trialDaysLeft <= 7 && (
              <a href="/dashboard/settings/billing" style={{ fontSize: 13 }}>
                {trialDaysLeft === 0 ? "Trial ends today" : `${trialDaysLeft}d left in trial`} →
              </a>
            )}
            {showUser && <UserButton appearance={{ variables: { colorPrimary: "#0071E3" }, elements: { avatarBox: "w-8 h-8" } }} />}
          </div>
        </header>
        {/* Home owns its own scroll area so the composer stays pinned; legacy
            pages scroll inside the shell. */}
        {isHome ? children : (
          <div className="ag-scroll">
            <div className="ag-legacy">{children}</div>
          </div>
        )}
      </div>
    </div>
  )
}
