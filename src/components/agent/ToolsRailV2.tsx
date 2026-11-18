"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Megaphone, TrendingUp, Star, Search, Globe, Settings, Sun, ChevronDown, PanelLeftOpen, PanelLeftClose, X,
} from "lucide-react"

// Dashboard v2 left rail (lib/dash-v2.ts): "Today" on top, then six colour-coded groups.
// Colours are tokens in app/agent-v2.css (light + dark).

export type RailGroup = "mk" | "rs" | "rp" | "rc" | "ws" | "st"
/** Briefing → rail: what's waiting today, per group. */
export const TODAY_EVENT = "alphaa:today"
export type TodayDetail = { total: number; groups: Partial<Record<RailGroup, number>>; social?: number; reviews?: number }
/** Rail → briefing: "Today" was tapped on the home page. */
export const TODAY_FOCUS = "alphaa:today-focus"

type Item = { label: string; href?: string; ask?: string; tag?: string; soon?: boolean; dot?: "social" | "reviews"; ai?: boolean }
type Group = { key: RailGroup; label: string; icon: typeof Star; items: Item[] }

const AI_CHIPS = [
  { label: "ChatGPT", href: "/dashboard/visibility/chatgpt" },
  { label: "Gemini", href: "/dashboard/visibility/gemini" },
  { label: "Claude", href: "/dashboard/visibility/claude" },
  { label: "Perplexity", href: "/dashboard/visibility/perplexity" },
]

const GROUPS: Group[] = [
  { key: "mk", label: "Marketing", icon: Megaphone, items: [
    { label: "Social accounts & posts", ask: "social", dot: "social" },
    { label: "Ads", ask: "ads", tag: "Google · Meta" },
    { label: "Posts & pages", ask: "content" },
    { label: "Google listing posts", href: "/dashboard/posts" },
    { label: "Email", soon: true, tag: "Soon" },
  ] },
  { key: "rs", label: "Results", icon: TrendingUp, items: [
    { label: "What’s working", ask: "insights" },
    { label: "What’s working in your niche", ask: "niche" },
    { label: "Where you show up on Google", href: "/dashboard/keywords" },
    { label: "What AI says about you", href: "/dashboard/sandbox", ai: true },
    { label: "Weekly briefings", href: "/dashboard/reports" },
    { label: "What I’ve done", ask: "work" },
  ] },
  { key: "rp", label: "Reputation", icon: Star, items: [
    { label: "Reviews", href: "/dashboard/reviews", dot: "reviews" },
  ] },
  { key: "rc", label: "Research", icon: Search, items: [
    { label: "Competitors", href: "/dashboard/competitors" },
    { label: "Content ideas", href: "/dashboard/content-gaps" },
    { label: "Content calendar", href: "/dashboard/content-plan" },
  ] },
  { key: "ws", label: "Website", icon: Globe, items: [
    { label: "Website health", href: "/dashboard/audit" },
    { label: "Site speed", href: "/dashboard/speed" },
    { label: "What AI reads about you", href: "/dashboard/vault" },
    { label: "Lead tracking", ask: "tracking" },
  ] },
  { key: "st", label: "Setup", icon: Settings, items: [
    { label: "Finish setting up", ask: "setup" },
    { label: "Your marketing channels", ask: "channels" },
    { label: "Brand, voice & library", ask: "voice" },
    { label: "What I do without asking", ask: "autopilot" },
    { label: "Website connection", href: "/dashboard/settings/website" },
  ] },
]

const CLOSED_KEY = "alphaa.rail.groups.v1"
const DEFAULT_CLOSED: RailGroup[] = ["rc", "ws", "st"]
const TODAY_KEY = "alphaa.today.v1"

export function ToolsRailV2({ open, onToggle, onAsk, setup }: { open: boolean; onToggle: (next: boolean) => void; onAsk: (topic: string, label: string) => void; setup: { done: number; total: number } | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const isHome = pathname === "/dashboard" || pathname === "/preview"
  const active = (href?: string) => !!href && (pathname === href || pathname.startsWith(`${href}/`))
  const narrow = () => typeof window !== "undefined" && window.innerWidth < 900

  const [closed, setClosed] = useState<RailGroup[]>(DEFAULT_CLOSED)
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(CLOSED_KEY) ?? "null")
      if (Array.isArray(v)) setClosed(v.filter((x): x is RailGroup => typeof x === "string"))
    } catch {}
  }, [])
  const setGroup = (k: RailGroup, isOpen: boolean) => setClosed((prev) => {
    const next = isOpen ? prev.filter((x) => x !== k) : Array.from(new Set([...prev, k]))
    try { localStorage.setItem(CLOSED_KEY, JSON.stringify(next)) } catch {}
    return next
  })

  // Today's counts come from the briefing; the last ones are kept for the other pages.
  const [today, setToday] = useState<TodayDetail | null>(null)
  useEffect(() => {
    try { const v = JSON.parse(sessionStorage.getItem(TODAY_KEY) ?? "null"); if (v && typeof v.total === "number") setToday(v) } catch {}
    const on = (e: Event) => {
      const d = (e as CustomEvent<TodayDetail>).detail
      if (!d) return
      setToday(d)
      try { sessionStorage.setItem(TODAY_KEY, JSON.stringify(d)) } catch {}
    }
    window.addEventListener(TODAY_EVENT, on)
    return () => window.removeEventListener(TODAY_EVENT, on)
  }, [])

  function goToday() {
    if (narrow()) onToggle(false)
    if (isHome) window.dispatchEvent(new CustomEvent(TODAY_FOCUS))
    else router.push("/dashboard")
  }

  const count = (g: Group): string | null => {
    if (g.key === "st") return setup && setup.done < setup.total ? `${setup.done} of ${setup.total}` : null
    const n = today?.groups[g.key] ?? 0
    if (!n) return null
    return g.key === "mk" ? `${n} waiting` : String(n)
  }

  const toggleBtn = (
    <button type="button" className="ag-tools__toggle" onClick={() => onToggle(!open)} aria-expanded={open} title={open ? "Hide menu" : "Show menu"}>
      {open ? (narrow() ? <X size={18} /> : <PanelLeftClose size={18} />) : <PanelLeftOpen size={18} />}
      <span>Menu</span>
    </button>
  )

  if (!open) {
    return (
      <nav className="ag-tools v2-rail" aria-label="Sections">
        {toggleBtn}
        <div className="ag-tools__icons">
          <button type="button" title="Today" aria-label="Today" className={`v2-icon-today ${isHome ? "on" : ""}`} onClick={goToday}>
            <Sun size={18} aria-hidden="true" />
            {!!today?.total && <i className="v2-icon-badge">{today.total}</i>}
          </button>
          {GROUPS.map((g) => (
            <button key={g.key} type="button" title={g.label} aria-label={g.label} className={`v2-g-${g.key} v2-icon-grp`} onClick={() => { setGroup(g.key, true); onToggle(true) }}>
              <span className="v2-tile"><g.icon size={15} aria-hidden="true" /></span>
            </button>
          ))}
        </div>
      </nav>
    )
  }

  return (
    <nav className="ag-tools ag-tools--open v2-rail" aria-label="Sections">
      {toggleBtn}
      <div className="ag-tools__list v2-list">
        <button type="button" className={`v2-today ${isHome ? "on" : ""}`} onClick={goToday}>
          <Sun size={17} aria-hidden="true" /> Today
          {!!today?.total && <span className="v2-today__badge">{today.total}</span>}
        </button>
        {GROUPS.map((g) => {
          const isOpen = !closed.includes(g.key)
          const c = count(g)
          return (
            <div key={g.key} className={`v2-grp v2-g-${g.key} ${isOpen ? "" : "v2-grp--closed"}`}>
              <button type="button" className="v2-grp__head" aria-expanded={isOpen} onClick={() => setGroup(g.key, !isOpen)}>
                <span className="v2-tile"><g.icon size={15} aria-hidden="true" /></span>
                <span className="v2-grp__label">{g.label}</span>
                {c && <span className="v2-grp__count">{c}</span>}
                <ChevronDown size={14} className="v2-grp__chev" aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="v2-items">
                  {g.items.map((it) => {
                    const dot = it.dot && (today?.[it.dot] ?? 0) > 0
                    const inner = <>{it.label}{it.tag ? <span className="v2-it__tag">{it.tag}</span> : dot ? <span className="v2-it__dot" aria-label="waiting" /> : null}</>
                    return (
                      <div key={it.label}>
                        {it.soon ? (
                          <span className="v2-it v2-it--soon" aria-disabled="true">{inner}</span>
                        ) : (
                          <Link
                            href={it.href ?? `/dashboard?ask=${it.ask}`}
                            className={`v2-it ${active(it.href) ? "on" : ""}`}
                            aria-current={active(it.href) ? "page" : undefined}
                            onClick={(e) => {
                              if (it.ask) { e.preventDefault(); onAsk(it.ask, it.label) }
                              if (narrow()) onToggle(false)
                            }}
                          >{inner}</Link>
                        )}
                        {it.ai && (
                          <div className="v2-ai">
                            {AI_CHIPS.map((a) => (
                              <Link key={a.href} href={a.href} className={active(a.href) ? "on" : ""} onClick={() => { if (narrow()) onToggle(false) }}>{a.label}</Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
