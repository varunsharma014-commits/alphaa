"use client"

import { usePathname } from "next/navigation"

// Homepage is light; every other marketing page (pricing, how-it-works,
// case studies, etc.) stays on the original dark theme.
export function MarketingThemeScope({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const theme = pathname === "/" ? "light" : "dark"

  return (
    <div data-theme={theme} className="radial-bg min-h-screen flex flex-col">
      {children}
    </div>
  )
}
