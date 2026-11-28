export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { CalendarView, ViewSwitch } from "@/components/workspace/CalendarView"
import "../../../calendar.css"

export const metadata = { title: "Content calendar — Alphaa" }

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
      <div className="ax-hdr">
        <div>
          <h1 className="ax-h1">Content calendar</h1>
          <p className="ax-sub">{pro ? "Everything going out and everything that went out: social, your Google listing, your website and email." : "Your website posts, scheduled and published. Pro adds social, Google listing posts and email."}</p>
        </div>
        <ViewSwitch on="calendar" />
      </div>
      <CalendarView />
    </>
  )
}
