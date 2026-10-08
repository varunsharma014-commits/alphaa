import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { webflowAuthUrl } from "@/lib/connector/webflow"
import { platformAvailability } from "@/lib/connector/availability"

export const dynamic = "force-dynamic"

const app = (path: string) => new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString()

export async function GET() {
  const user = await currentUser()
  // Marketplace installs are mostly new owners: sign-up first (it links to sign-in), then straight
  // into one Webflow authorization.
  if (!user) return NextResponse.redirect(app(`/signup?redirect_url=${encodeURIComponent("/api/connect/webflow/start")}`))
  if (!platformAvailability().webflow) return NextResponse.redirect(app("/dashboard/t/site?connect=webflow-unavailable"))
  const state = Buffer.from(JSON.stringify({ userId: user.id, nonce: crypto.randomUUID() })).toString("base64url")
  return NextResponse.redirect(webflowAuthUrl(state))
}
