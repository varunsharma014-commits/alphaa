import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { wixInstallUrl } from "@/lib/connector/wix"

export const dynamic = "force-dynamic"

const app = (path: string) => new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString()

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.redirect(app("/sign-in"))
  if (!process.env.WIX_APP_ID) return NextResponse.redirect(app("/dashboard/t/site?connect=wix-unavailable"))
  const state = Buffer.from(JSON.stringify({ userId: user.id, nonce: crypto.randomUUID() })).toString("base64url")
  return NextResponse.redirect(wixInstallUrl(state))
}
