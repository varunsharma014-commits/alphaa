"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, LayoutDashboard, Search, Zap, Globe, MapPin, FileText, TrendingUp, Star, BarChart3, Settings, ChevronRight, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/audit", label: "Technical Audit", icon: Search },
  { href: "/dashboard/keywords", label: "Keyword Scan", icon: TrendingUp },
  { href: "/dashboard/speed", label: "Site Speed & Factors", icon: Zap },
  { href: "/dashboard/visibility", label: "AI Visibility", icon: Globe },
  { href: "/dashboard/posts", label: "Google Posts", icon: MapPin },
  { href: "/dashboard/content-gaps", label: "Content Gaps", icon: FileText },
  { href: "/dashboard/competitors", label: "Competitors", icon: Users },
  { href: "/dashboard/content-plan", label: "Content Plan", icon: BarChart3 },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-bg-secondary border-r border-white/[0.06] flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-orange" />
          <span className="text-white font-semibold text-lg">alphaa</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-brand-orange/15 text-brand-orange border-l-2 border-brand-orange pl-[10px]"
                  : "text-muted hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-brand-orange" : "text-muted group-hover:text-white")} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/[0.06] space-y-0.5">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
            pathname.startsWith("/dashboard/settings") ? "bg-brand-orange/15 text-brand-orange" : "text-muted hover:text-white hover:bg-white/[0.04]"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Link
          href="/pricing"
          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors"
        >
          <span>Upgrade plan</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  )
}
