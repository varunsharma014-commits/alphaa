"use client"

import { LinkTabs } from "@/components/workspace/ui"
import { useRole } from "@/components/workspace/role"

// The settings tabs, under each settings page's PageHeader. Tab names match the page titles
// (UI audit: Your business, Your account, Google, Your website, Plan & billing). Billing is owner only.
export const SETTINGS_TABS = [
  { href: "/dashboard/settings/business", label: "Your business" },
  { href: "/dashboard/settings/account", label: "Your account" },
  { href: "/dashboard/settings/integrations", label: "Google" },
  { href: "/dashboard/settings/website", label: "Your website" },
  { href: "/dashboard/settings/billing", label: "Plan & billing" },
]

export function SettingsTabs() {
  const role = useRole()
  const tabs = SETTINGS_TABS.filter((t) => role === "owner" || t.href !== "/dashboard/settings/billing")
  return <LinkTabs tabs={tabs} label="Settings" />
}
