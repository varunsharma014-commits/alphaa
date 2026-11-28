import { Suspense } from "react"
import { pageTitle } from "@/lib/page-title"
import { GoogleView } from "@/components/workspace/settings/GoogleView"

export const metadata = { title: pageTitle("Google") }

// Google connection (Business Profile, Search Console, Analytics). The URL keeps its old name
// because the Google OAuth callback returns here (?connected=true / ?error=).
export default function IntegrationsPage() {
  return <Suspense><GoogleView /></Suspense>
}
