import { notFound } from "next/navigation"
import { WsPreview } from "./ws-preview"
import { isRole } from "@/lib/team/permissions"

// Dev-only: the workspace shell and pages with SAMPLE data, so the UI can be checked in a browser
// without a Clerk session. 404s in production.
// ?ws=briefing|research|social|calendar|email|ads|tracking|ds (ds = the design system gallery) (&empty=1, &dark=1, &role=admin|publisher|reviewer|creator)
export default async function PreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound()
  const sp = await searchParams
  return <WsPreview page={typeof sp.ws === "string" ? sp.ws : "briefing"} empty={sp.empty === "1"} dark={sp.dark === "1"} role={isRole(sp.role) ? sp.role : undefined} />
}
