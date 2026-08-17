"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sparkles, Home, Bot, Globe, Search, TrendingUp, Activity, Gauge, MapPin, Star,
  CalendarDays, Lightbulb, Users, BarChart3, Settings, ChevronRight, LifeBuoy,
  MessagesSquare, BookOpen, Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    items: [
      { href: "/dashboard", label: "Home", icon: Home, exact: true },
    ],
  },
  {
    label: "Getting Found on AI",
    items: [
      { href: "/dashboard/vault", label: "What AI reads about you", icon: BookOpen },
      { href: "/dashboard/citations", label: "Where AI looks you up", icon: Link2 },
      { href: "/dashboard/sandbox", label: "Ask the AIs", icon: MessagesSquare },
      { href: "/dashboard/visibility/chatgpt", label: "ChatGPT", icon: Bot },
      { href: "/dashboard/visibility/claude", label: "Claude", icon: Globe },
      { href: "/dashboard/visibility/gemini", label: "Gemini", icon: Sparkles },
      { href: "/dashboard/visibility/perplexity", label: "Perplexity", icon: Search },
    ],
  },
  {
    label: "Getting Found on Google",
    items: [
      { href: "/dashboard/keywords", label: "Google rankings", icon: TrendingUp },
      { href: "/dashboard/audit", label: "Website health", icon: Activity },
      { href: "/dashboard/speed", label: "Site speed", icon: Gauge },
    ],
  },
  {
    label: "Your Reputation",
    items: [
      { href: "/dashboard/posts", label: "Google listing", icon: MapPin },
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/dashboard/content-plan", label: "Content calendar", icon: CalendarDays },
      { href: "/dashboard/content-gaps", label: "Content ideas", icon: Lightbulb },
    ],
  },
  {
    label: "Research",
    items: [
      { href: "/dashboard/competitors", label: "Competitor intel", icon: Users },
      { href: "/dashboard/reports", label: "Weekly reports", icon: BarChart3 },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-bg-secondary border-r border-line/[0.06] flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-line/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-[18px] h-[18px] text-brand-orange" />
          <span className="text-fg font-semibold text-[17px] tracking-tight">alphaa</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className={groupIdx > 0 ? "mt-6" : ""}>
            {group.label && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg/30 select-none">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, (item as { exact?: boolean }).exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-all duration-150 group",
                      active
                        ? "bg-brand-orange/[0.12] text-brand-orange font-medium"
                        : "text-fg/55 hover:text-fg/90 hover:bg-fg/[0.045] font-normal"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                        active
                          ? "text-brand-orange"
                          : "text-fg/35 group-hover:text-fg/70"
                      )}
                    />
                    <span className="truncate leading-none">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-line/[0.06] space-y-0.5">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-all duration-150",
            pathname.startsWith("/dashboard/settings")
              ? "bg-brand-orange/[0.12] text-brand-orange font-medium"
              : "text-fg/55 hover:text-fg/90 hover:bg-fg/[0.045]"
          )}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Settings</span>
        </Link>
        <a
          href="mailto:hi@alphaa.app?subject=Help%20with%20my%20alphaa%20account"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] text-fg/55 hover:text-fg/90 hover:bg-fg/[0.045] transition-all duration-150"
        >
          <LifeBuoy className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Email support</span>
        </a>
        <Link
          href="/pricing"
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[10px] text-[14px] font-semibold bg-brand-orange text-white hover:bg-brand-orange-light transition-colors"
        >
          <span>Upgrade plan</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-80" />
        </Link>
      </div>
    </aside>
  )
}
