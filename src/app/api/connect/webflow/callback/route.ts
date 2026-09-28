import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { saveAgentSettings } from "@/lib/agent/settings"
import { encryptSecret } from "@/lib/checks/bing-webmaster"
import { currentUser } from "@/lib/connector/user"
import { webflowExchange, webflowSetup } from "@/lib/connector/webflow"

export const dynamic = "force-dynamic"

const back = (params: Record<string, string>) => {
  const u = new URL("/dashboard/t/site", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return NextResponse.redirect(u.toString())
}
const fail = (msg: string) => back({ connect_error: msg })

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const code = sp.get("code")
  const state = sp.get("state")
  const oauthError = sp.get("error")

  if (oauthError) {
    return fail(oauthError === "access_denied" ? "You cancelled the Webflow connection." : `Webflow said: ${sp.get("error_description") || oauthError}`)
  }
  if (!code || !state) return fail("Webflow didn’t send back a sign-in code. Try connecting again.")

  let stateUserId: string | null = null
  try {
    stateUserId = (JSON.parse(Buffer.from(state, "base64url").toString()) as { userId?: string }).userId ?? null
  } catch {
    stateUserId = null
  }

  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString())
  if (!stateUserId || stateUserId !== user.id) return fail("That Webflow sign-in didn’t match your account. Try connecting again.")

  try {
    const { accessToken } = await webflowExchange(code)
    let host: string | null = null
    try {
      host = user.websiteUrl ? new URL(/^https?:\/\//i.test(user.websiteUrl) ? user.websiteUrl : `https://${user.websiteUrl}`).hostname : null
    } catch {
      host = null
    }
    const setup = await webflowSetup(accessToken, host)
    if ("error" in setup) return fail(setup.error)

    await saveAgentSettings(user.id, {
      site: {
        platform: "webflow",
        siteUrl: setup.siteUrl,
        label: setup.label,
        tokenEnc: encryptSecret(JSON.stringify({ accessToken })),
        config: setup.config,
        connectedAt: new Date().toISOString(),
      },
    })
    await db.mockActivity.create({
      data: {
        userId: user.id,
        type: "site_connected",
        title: `Connected your Webflow site ${setup.label}`,
        metadata: { platform: "webflow", siteUrl: setup.siteUrl, label: setup.label },
      },
    })
    return back({ connected: "webflow" })
  } catch (e) {
    console.error("[Webflow Callback]", e)
    return fail(e instanceof Error ? e.message : "Couldn’t finish connecting Webflow.")
  }
}
