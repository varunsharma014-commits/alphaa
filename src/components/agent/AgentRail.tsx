"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { RailData } from "@/lib/agent/feed"
import { BRAND } from "@/lib/brand"

const CONVERSATIONS = [
  { href: "/dashboard", label: "Today", exact: true },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/vault", label: "What AI reads about you" },
  { href: "/dashboard/citations", label: "Where AI looks you up" },
  { href: "/dashboard/competitors", label: "Competitors" },
  { href: "/dashboard/reports", label: "Weekly notes" },
]

const DETAIL = [
  { href: "/dashboard/sandbox", label: "Ask the AIs a question" },
  { href: "/dashboard/visibility/chatgpt", label: "ChatGPT" },
  { href: "/dashboard/visibility/gemini", label: "Gemini" },
  { href: "/dashboard/visibility/claude", label: "Claude" },
  { href: "/dashboard/visibility/perplexity", label: "Perplexity" },
  { href: "/dashboard/posts", label: "Google listing" },
  { href: "/dashboard/content-plan", label: "Content calendar" },
  { href: "/dashboard/content-gaps", label: "Content ideas" },
  { href: "/dashboard/keywords", label: "Google rankings" },
  { href: "/dashboard/audit", label: "Website health" },
  { href: "/dashboard/speed", label: "Site speed" },
]

export function AgentRail({ rail, open, onClose }: { rail: RailData; open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const isOn = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href))
  const waiting = rail.waiting.reviews + rail.waiting.posts

  return (
    <aside className={`ag-rail ${open ? "ag-rail--open" : ""}`}>
      <div className="ag-rail__biz">
        <Link href="/" className="ag-brand" style={{ marginBottom: 10 }}>
          <span className="ag-dot ag-dot--live" />
          {BRAND.name}
        </Link>
        {rail.businessName}
        <span>
          {rail.location || "Location not set"} · day {rail.dayNumber}
        </span>
      </div>

      <div className="ag-rail__status">
        <div className="ag-rail__big">
          {rail.checked === 0 ? "—" : rail.named} <small>of 4 AIs name you</small>
        </div>
        <div className="ag-rail__bars">
          {rail.states.map((s, i) => (
            <i key={i} className={s === "found" ? "ok" : s === "partial" ? "half" : ""} />
          ))}
        </div>
        <div className="ag-rail__sub">{rail.checked === 0 ? "Not checked yet" : `${rail.checked} of 4 checked`}</div>
      </div>

      <div className="ag-rail__lbl">Conversations</div>
      {CONVERSATIONS.map((c) => (
        <Link key={c.href} href={c.href} className={isOn(c.href, c.exact) ? "on" : ""} onClick={onClose}>
          {c.label}
          {c.exact && waiting > 0 && <b>{waiting}</b>}
        </Link>
      ))}

      <div className="ag-rail__lbl">More detail</div>
      <details>
        <summary>Every report</summary>
        {DETAIL.map((c) => (
          <Link key={c.href} href={c.href} className={isOn(c.href) ? "on" : ""} onClick={onClose}>
            {c.label}
          </Link>
        ))}
      </details>

      <div className="ag-rail__lbl">Settings</div>
      <Link href="/dashboard/settings/integrations" onClick={onClose}>
        {rail.googleConnected ? "Google · connected" : "Connect Google"}
      </Link>
      <Link href="/dashboard/settings/account" onClick={onClose}>Account</Link>
      <Link href="/dashboard/settings/billing" onClick={onClose}>Billing</Link>
      <Link href="/dashboard/concierge" onClick={onClose}>Have a human do it</Link>

      <div className="ag-rail__foot">{BRAND.agentName} works for {rail.businessName}. Ask it anything.</div>
    </aside>
  )
}
