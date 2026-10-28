"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot, BookOpen, Link2, MessagesSquare, Globe, Sparkles, Search, TrendingUp, Activity, Gauge,
  MapPin, Star, CalendarDays, Lightbulb, Users, BarChart3, PanelLeftOpen, PanelLeftClose, X,
} from "lucide-react"

// The detail pages for owners who want to see under the hood. Folded to a
// slim strip of section icons by default; the briefing stays the main screen.

const GROUPS = [
  {
    label: "AI search", icon: Bot,
    items: [
      { href: "/dashboard/sandbox", label: "Ask the AIs", icon: MessagesSquare },
      { href: "/dashboard/vault", label: "What AI reads about you", icon: BookOpen },
      { href: "/dashboard/citations", label: "Where AI looks you up", icon: Link2 },
      { href: "/dashboard/visibility/chatgpt", label: "ChatGPT", icon: Bot },
      { href: "/dashboard/visibility/claude", label: "Claude", icon: Globe },
      { href: "/dashboard/visibility/gemini", label: "Gemini", icon: Sparkles },
      { href: "/dashboard/visibility/perplexity", label: "Perplexity", icon: Search },
    ],
  },
  {
    label: "Google", icon: TrendingUp,
    items: [
      { href: "/dashboard/keywords", label: "Google rankings", icon: TrendingUp },
      { href: "/dashboard/audit", label: "Website health", icon: Activity },
      { href: "/dashboard/speed", label: "Site speed", icon: Gauge },
    ],
  },
  {
    label: "Reputation", icon: Star,
    items: [
      { href: "/dashboard/posts", label: "Google listing posts", icon: MapPin },
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Content", icon: CalendarDays,
    items: [
      { href: "/dashboard/content-plan", label: "Content calendar", icon: CalendarDays },
      { href: "/dashboard/content-gaps", label: "Content ideas", icon: Lightbulb },
    ],
  },
  {
    label: "Research", icon: Users,
    items: [
      { href: "/dashboard/competitors", label: "Competitors", icon: Users },
      { href: "/dashboard/reports", label: "Weekly reports", icon: BarChart3 },
    ],
  },
]

export function ToolsRail({ open, onToggle }: { open: boolean; onToggle: (next: boolean) => void }) {
  const pathname = usePathname()
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const narrow = () => typeof window !== "undefined" && window.innerWidth < 900

  return (
    <nav className={`ag-tools ${open ? "ag-tools--open" : ""}`} aria-label="Details">
      <button type="button" className="ag-tools__toggle" onClick={() => onToggle(!open)} aria-expanded={open} title={open ? "Hide details" : "Show details"}>
        {open ? (narrow() ? <X size={18} /> : <PanelLeftClose size={18} />) : <PanelLeftOpen size={18} />}
        <span>Details</span>
      </button>
      {open ? (
        <div className="ag-tools__list">
          {GROUPS.map((g) => (
            <div key={g.label} className="ag-tools__group">
              <p>{g.label}</p>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className={active(it.href) ? "on" : ""} aria-current={active(it.href) ? "page" : undefined} onClick={() => narrow() && onToggle(false)}>
                  <it.icon size={16} aria-hidden="true" />
                  {it.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="ag-tools__icons">
          {GROUPS.map((g) => (
            <button key={g.label} type="button" title={g.label} aria-label={g.label} className={g.items.some((it) => active(it.href)) ? "on" : ""} onClick={() => onToggle(true)}>
              <g.icon size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
