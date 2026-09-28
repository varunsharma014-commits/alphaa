import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { webflowAuthUrl } from "@/lib/connector/webflow"

export const dynamic = "force-dynamic"

const app = (path: string) => new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString()

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.redirect(app("/sign-in"))
  if (!process.env.WEBFLOW_CLIENT_ID) return NextResponse.redirect(app("/dashboard/t/site?connect=webflow-unavailable"))
  const state = Buffer.from(JSON.stringify({ userId: user.id, nonce: crypto.randomUUID() })).toString("base64url")
  return NextResponse.redirect(webflowAuthUrl(state))
}
