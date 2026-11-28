"use client"

import { useRouter } from "next/navigation"
import { Tabs } from "./ui"

// The Ads tab row (5 at most): Ads, Results, Automations, Share, Your plan. The first four live on
// /dashboard/ads (?tab=), "Your plan" is its own route (/dashboard/ads/plan), so the row works the
// same from both pages. Old links (?tab=f|a|r|t|x|p|s) map onto these in AdsView.
export type AdsTab = "ads" | "results" | "auto" | "share" | "plan" | "promote"
export const ADS_TABS: { key: AdsTab; label: string }[] = [
  { key: "ads", label: "Ads" },
  { key: "results", label: "Results" },
  { key: "auto", label: "Automations" },
  { key: "share", label: "Share" },
  { key: "plan", label: "Your plan" },
]

export function AdsTabs({ value, onChange }: { value: AdsTab; onChange?: (k: AdsTab) => void }) {
  const router = useRouter()
  return (
    <Tabs<AdsTab>
      label="Ads sections"
      tabs={ADS_TABS}
      value={value === "promote" ? "ads" : value}
      onChange={(k) => {
        if (k === "plan") return router.push("/dashboard/ads/plan")
        if (onChange) return onChange(k)
        router.push(k === "ads" ? "/dashboard/ads" : `/dashboard/ads?tab=${k}`)
      }}
    />
  )
}
