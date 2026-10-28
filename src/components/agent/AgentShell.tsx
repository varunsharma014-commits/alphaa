"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import type { DashboardTheme } from "@/lib/theme"
import type { RailData } from "@/lib/agent/feed"
import { BRAND } from "@/lib/brand"
import { AgentMemory } from "./AgentMemory"
import { AccountMenu } from "./AccountMenu"

// No menu to hunt through: one conversation with the agent, chips to ask it
// things, and a Memory panel on the right with the score, results,
// connections and the work it has done. Settings live under the avatar.

// v2: the panel is on by default for everyone (owners who closed it before start open again).
const MEM_KEY = "alphaa.memory.v2"

/** Ask the agent to bring a topic into the chat (handled by DashboardAgent). */
export const ASK_EVENT = "alphaa:ask"
export type AskDetail = { topic: string; label: string }

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
  void theme
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/dashboard" || pathname === "/preview"
  const [memOpen, setMemOpen] = useState(false)

  // Open by default on wide screens; remember the owner's choice.
  useEffect(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem(MEM_KEY) } catch {}
    setMemOpen(saved ? saved === "open" : window.innerWidth >= 1180)
  }, [])
  const toggle = (next: boolean) => {
    setMemOpen(next)
    try { localStorage.setItem(MEM_KEY, next ? "open" : "closed") } catch {}
  }

  function ask(topic: string, label: string) {
    if (window.innerWidth < 1180) toggle(false)
    if (isHome) window.dispatchEvent(new CustomEvent<AskDetail>(ASK_EVENT, { detail: { topic, label } }))
    else router.push(`/dashboard?ask=${encodeURIComponent(topic)}`)
  }

  const waiting = rail.waiting.reviews + rail.waiting.posts

  return (
    <div className={`ag-app ${memOpen ? "ag-app--mem" : ""}`}>
      <div className="ag-main">
        <header className="ag-head">
          <div className="ag-head__left">
            <Link href="/dashboard" className="ag-brand" aria-label={`${BRAND.name} home`}>
              <Sparkles className="ag-brand__mark" aria-hidden="true" />
              {BRAND.name}
            </Link>
            <span className="ag-head__sep" />
            <span className="ag-head__biz">{rail.businessName}</span>
            {isHome ? (
              <span className="ag-head__since">
                <span className="ag-dot ag-dot--live" style={{ width: 6, height: 6 }} /> working for you
              </span>
            ) : (
              <Link href="/dashboard" className="ag-head__back">← Back to your agent</Link>
            )}
          </div>
          <div className="ag-head__right">
            {trialDaysLeft !== null && trialDaysLeft <= 7 && (
              <a href="/dashboard/settings/billing" style={{ fontSize: 13 }}>
                {trialDaysLeft === 0 ? "Trial ends today" : `${trialDaysLeft}d left in trial`} →
              </a>
            )}
            <button className={`ag-head__mem ${memOpen ? "on" : ""}`} onClick={() => toggle(!memOpen)} aria-pressed={memOpen}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
              Memory
              {waiting > 0 && !memOpen && <b>{waiting}</b>}
            </button>
            {showUser && <AccountMenu />}
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
      <AgentMemory rail={rail} open={memOpen} onClose={() => toggle(false)} onAsk={ask} />
      {memOpen && <div className="ag-mem__scrim" onClick={() => toggle(false)} aria-hidden="true" />}
    </div>
  )
}
