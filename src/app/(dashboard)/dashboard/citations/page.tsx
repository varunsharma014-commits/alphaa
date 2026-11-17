import { redirect } from "next/navigation"

// "Where AI looks you up" (the off-site listings work list) was retired 2026-11-17: it handed
// owners outreach work to do themselves. Old links land on the dashboard.
export default function CitationsPage() {
  redirect("/dashboard")
}
