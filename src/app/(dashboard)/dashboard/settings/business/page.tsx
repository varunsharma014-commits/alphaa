import { pageTitle } from "@/lib/page-title"
import { BusinessView } from "@/components/workspace/settings/BusinessView"

export const metadata = { title: pageTitle("Your business") }

export default function BusinessSettingsPage() {
  return <BusinessView />
}
