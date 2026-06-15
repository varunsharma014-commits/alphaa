"use client"

import { UserButton } from "@clerk/nextjs"
import { Bell } from "lucide-react"
import type { AppUser } from "@/types/user"

export function DashboardTopBar({ user }: { user: AppUser }) {
  const isTrialing = user.subscriptionStatus === "trialing"
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null

  const businessLabel =
    user.businessName ||
    (user.fullName ? `${user.fullName.split(" ")[0]}'s Business` : null)

  const locationLabel = [user.city, user.state].filter(Boolean).join(", ")

  return (
    <header className="h-14 px-5 flex items-center justify-between border-b border-white/[0.06] bg-bg-secondary/60 backdrop-blur-sm flex-shrink-0">
      {/* Left: business context */}
      <div className="flex items-center gap-3">
        {businessLabel && (
          <div className="flex items-center gap-2">
            <span className="text-white/85 text-sm font-medium">{businessLabel}</span>
            {locationLabel && (
              <span className="text-white/30 text-xs hidden sm:inline">{locationLabel}</span>
            )}
          </div>
        )}

        {isTrialing && trialDaysLeft !== null && trialDaysLeft <= 7 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 text-xs font-medium">
              {trialDaysLeft === 0
                ? "Trial ends today"
                : `${trialDaysLeft}d left in trial`}
            </span>
            <a
              href="/pricing"
              className="text-xs text-white/60 hover:text-white underline ml-0.5 transition-colors"
            >
              Upgrade →
            </a>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/[0.06] transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <UserButton
          appearance={{
            variables: { colorPrimary: "#FF6B1A" },
            elements: { avatarBox: "w-8 h-8" },
          }}
        />
      </div>
    </header>
  )
}
