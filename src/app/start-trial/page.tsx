import { redirect } from "next/navigation"

// The paywall step now lives in the agent conversation at /onboarding (resume
// mode: one message, one "Start today" tap → Stripe). Kept as a redirect
// because the dashboard gate, old emails and bookmarks still point here.
export default function StartTrialPage() {
  redirect("/onboarding")
}
