"use client"

import { UserButton } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"
import type { DashboardTheme } from "@/lib/theme"
import type { AppUser } from "@/types/user"

export function DashboardTopBar({ user, theme }: { user: AppUser; theme: DashboardTheme }) {
  const isTrialing = user.subscriptionStatus === "trialing"
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null

  const businessLabel =
    user.businessName ||
    (user.fullName ? `${user.fullName.split(" ")[0]}'s Business` : null)

  const locationLabel = [user.city, user.state].filter(Boolean).join(", ")

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-line/[0.06] bg-bg-secondary/70 backdrop-blur-md flex-shrink-0">
      {/* Left: business context */}
      <div className="flex items-center gap-3">
        {businessLabel && (
          <div className="flex items-center gap-2">
            <span className="text-fg/90 text-[15px] font-medium tracking-tight">{businessLabel}</span>
            {locationLabel && (
              <span className="text-fg/35 text-[13px] hidden sm:inline">{locationLabel}</span>
            )}
          </div>
        )}

        {isTrialing && trialDaysLeft !== null && trialDaysLeft <= 7 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 text-[13px] font-medium">
              {trialDaysLeft === 0
                ? "Trial ends today"
                : `${trialDaysLeft}d left in trial`}
            </span>
            <a
              href="/pricing"
              className="text-[13px] text-fg/60 hover:text-fg underline ml-0.5 transition-colors"
            >
              Upgrade →
            </a>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle initial={theme} />
        <UserButton
          appearance={{
            variables: { colorPrimary: "#0071E3" },
            elements: { avatarBox: "w-8 h-8" },
          }}
        />
      </div>
    </header>
  )
}
