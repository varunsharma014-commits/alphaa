import { redirect } from "next/navigation"

// The human services (Full Service plan, $149 setup) were retired from sale on 2026-11-18.
// Old links and bookmarks land on the website connection, where I publish the changes myself.
export default function ConciergePage() {
  redirect("/dashboard/settings/website")
}
