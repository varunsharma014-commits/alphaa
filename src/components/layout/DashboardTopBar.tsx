"use client"

import { UserButton } from "@clerk/nextjs"
import { Bell } from "lucide-react"
import type { AppUser } from "@/types/user"

export function DashboardTopBar({ user }: { user: AppUser }) {
  const isTrialing = user.subscriptionStatus === "trialing"
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-white/[0.06] bg-bg-secondary/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Trial banner */}
        {isTrialing && trialDaysLeft !== null && trialDaysLeft <= 3 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            <span className="text-brand-orange text-xs font-medium">
              {trialDaysLeft === 0 ? "Trial ends today" : `Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"}`}
            </span>
            <a href="/pricing" className="text-xs text-white/80 hover:text-white underline">Add payment →</a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-white hover:bg-white/[0.06] transition-colors">
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
