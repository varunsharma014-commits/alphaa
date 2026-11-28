export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { CalendarView, ViewSwitch } from "@/components/workspace/CalendarView"
import "../../../calendar.css"
import { pageTitle } from "@/lib/page-title"
import { PageHeader } from "@/components/workspace/ui"

export const metadata = { title: pageTitle("Calendar") }

// Social Studio → Calendar: everything scheduled and published across social, Google listing,
// website and email (lib/calendar). Data loads client-side per month/week (/api/workspace/calendar).
export default async function SocialCalendarPage() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { plan: true, email: true } })
  if (!user) redirect("/login")
  const pro = hasPro(user)
  return (
    <>
      <PageHeader
        title="Calendar"
        sub={pro ? "Everything going out and everything that went out, in one place." : "Your website posts, scheduled and published. Pro adds social, Google and email."}
        actions={<ViewSwitch on="calendar" />}
      />
      <CalendarView />
    </>
  )
}
