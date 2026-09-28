import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { saveAgentSettings } from "@/lib/agent/settings"
import { encryptSecret } from "@/lib/checks/bing-webmaster"
import { currentUser } from "@/lib/connector/user"
import { wixExchange, wixSetup, wixVerifyInstance } from "@/lib/connector/wix"

export const dynamic = "force-dynamic"

const back = (params: Record<string, string>) => {
  const u = new URL("/dashboard/t/site", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return NextResponse.redirect(u.toString())
}
const fail = (msg: string) => back({ connect_error: msg })

// Wix's external install flow redirects here with appId, tenantId, instanceId, signedInstance,
// plus the `state` we put on the postInstallationUrl. Missing instanceId/signedInstance = cancelled.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const state = sp.get("state")
  const instanceId = sp.get("instanceId")
  const signedInstance = sp.get("signedInstance")
  const code = sp.get("code") // legacy (custom-auth) apps only
  const oauthError = sp.get("error")

  if (oauthError) return fail(oauthError === "access_denied" ? "You cancelled the Wix connection." : `Wix said: ${sp.get("error_description") || oauthError}`)
  if (!state) return fail("Wix didn’t send back our sign-in details. Try connecting again.")
  if (!code && (!instanceId || !signedInstance)) return fail("The Wix install didn’t finish, so nothing was connected. Try connecting again.")

  let stateUserId: string | null = null
  try {
    stateUserId = (JSON.parse(Buffer.from(state, "base64url").toString()) as { userId?: string }).userId ?? null
  } catch {
    stateUserId = null
  }

  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString())
  if (!stateUserId || stateUserId !== user.id) return fail("That Wix install didn’t match your account. Try connecting again.")

  // Query params can be forged: only trust instanceId once signedInstance checks out.
  if (instanceId) {
    const verified = signedInstance ? wixVerifyInstance(signedInstance) : null
    if (!verified || (verified.instanceId && verified.instanceId !== instanceId)) {
      return fail("We couldn’t verify that Wix install. Try connecting again.")
    }
  }

  try {
    const tokens = await wixExchange(code ?? "", instanceId ?? undefined)
    const setup = await wixSetup({ ...tokens, ...(instanceId ? { instanceId } : {}) })
    if ("error" in setup) return fail(setup.error)

    // One website per account: connecting Wix replaces any WordPress connection.
    await saveAgentSettings(user.id, {
      wp: undefined,
      site: {
        platform: "wix",
        siteUrl: setup.siteUrl,
        label: setup.label,
        tokenEnc: encryptSecret(JSON.stringify(tokens)),
        config: setup.config,
        connectedAt: new Date().toISOString(),
      },
    })
    await db.mockActivity.create({
      data: {
        userId: user.id,
        type: "site_connected",
        title: `Connected your Wix site ${setup.label}`,
        metadata: { platform: "wix", siteUrl: setup.siteUrl, label: setup.label },
      },
    })
    return back({ connected: "wix" })
  } catch (e) {
    console.error("[Wix Callback]", e)
    return fail(e instanceof Error ? e.message : "Couldn’t finish connecting Wix.")
  }
}
