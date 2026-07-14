"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Settings shell: without this, the Account / Business / Connections / Billing
// pages were unreachable from each other (sidebar only links to /settings).
const TABS = [
  { href: "/dashboard/settings/account", label: "Account" },
  { href: "/dashboard/settings/business", label: "Business details" },
  { href: "/dashboard/settings/integrations", label: "Google connection" },
  { href: "/dashboard/settings/billing", label: "Billing & plan" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tab nav */}
      <div className="flex items-center gap-1 mb-6 border-b border-line/[0.08] overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3.5 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                active
                  ? "border-brand-orange text-fg font-medium"
                  : "border-transparent text-fg/40 hover:text-fg/80"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {children}

      {/* Support footer — always one obvious way to reach a human */}
      <p className="text-fg/35 text-xs mt-10 pb-6">
        Stuck or have a question? Email{" "}
        <a
          href="mailto:hi@alphaa.app"
          className="text-brand-orange hover:underline"
        >
          hi@alphaa.app
        </a>{" "}
        — a real person reads every message.
      </p>
    </div>
  )
}
