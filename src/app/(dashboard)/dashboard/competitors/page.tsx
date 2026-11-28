import { redirect } from "next/navigation"
import { pageTitle } from "@/lib/page-title"

export const metadata = { title: pageTitle("Competitors") }

// Moved into Research & Ideas (UI audit package 2): one place, one set of dates, the shared look.
export default function Page() {
  redirect("/dashboard/research?tab=competitors")
}
