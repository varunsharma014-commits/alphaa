import { redirect } from "next/navigation"

// Page speed lives in Tracking & Setup → Site health now (2026-11-28), read from the weekly
// stored check instead of a live PageSpeed call on every visit.
export default function SpeedPage() {
  redirect("/dashboard/tracking?tab=health#vitals")
}
