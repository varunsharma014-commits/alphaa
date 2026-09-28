import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { saveAgentSettings } from "@/lib/agent/settings"
import { encryptSecret } from "@/lib/checks/bing-webmaster"
import { isShopDomain, shopifyExchange, shopifySetup, verifyShopifyHmac } from "@/lib/connector/shopify"
import { platformAvailability } from "@/lib/connector/availability"

export const dynamic = "force-dynamic"

// GET /api/connect/shopify/callback?code&hmac&shop&state&timestamp
// Shopify sends the owner back here after they approve the app.
export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  const back = (params: Record<string, string>) => {
    const u = new URL("/dashboard/t/site", base)
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
    return NextResponse.redirect(u)
  }
  const fail = (msg: string) => back({ connect_error: msg })

  const q = req.nextUrl.searchParams
  if (q.get("error")) return fail(q.get("error_description") || "Shopify didn't approve the connection.")

  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL(`/login?redirect_url=${encodeURIComponent(`/api/connect/shopify/start?shop=${encodeURIComponent(q.get("shop") ?? "")}`)}`, base))
  if (!platformAvailability().shopify) return back({ connect: "shopify-unavailable" })

  const shop = q.get("shop")
  const code = q.get("code")
  if (!isShopDomain(shop) || !code) return fail("Shopify sent back an incomplete answer. Please try connecting again.")
  if (!verifyShopifyHmac(q)) return fail("We couldn't confirm that answer came from Shopify. Please try connecting again.")

  let state: { userId?: string; shop?: string } = {}
  try {
    state = JSON.parse(Buffer.from(q.get("state") ?? "", "base64url").toString("utf8"))
  } catch {
    /* handled below */
  }
  if (state.userId !== user.id || state.shop !== shop) {
    return fail("This Shopify connection was started from a different account or store. Please start again from Alphaa.")
  }

  try {
    const tokens = await shopifyExchange(shop, code)
    const setup = await shopifySetup(shop, tokens.accessToken)
    if ("error" in setup) return fail(setup.error)

    // One website per account: connecting Shopify replaces any WordPress connection.
    await saveAgentSettings(user.id, {
      wp: undefined,
      site: {
        platform: "shopify",
        siteUrl: setup.siteUrl,
        label: shop,
        tokenEnc: encryptSecret(JSON.stringify(tokens)),
        config: setup.config,
        connectedAt: new Date().toISOString(),
      },
    })
    await db.mockActivity.create({
      data: {
        userId: user.id,
        type: "site_connected",
        title: `Connected to ${shop} (Shopify)`,
        metadata: { siteUrl: setup.siteUrl, platform: "shopify", shop },
      },
    })
    return back({ connected: "shopify" })
  } catch (e) {
    console.error("[shopify callback]", e instanceof Error ? e.message : e)
    return fail(e instanceof Error ? e.message : "Couldn't connect your Shopify store.")
  }
}
