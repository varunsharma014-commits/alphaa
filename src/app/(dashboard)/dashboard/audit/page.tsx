import { redirect } from "next/navigation"

// Website health lives in Tracking & Setup → Site health now (2026-11-28): problems grouped
// once with their pages, links, speed and structured data in one place.
export default function AuditPage() {
  redirect("/dashboard/tracking?tab=health")
}
