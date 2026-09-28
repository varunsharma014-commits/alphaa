import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { normalizeShop, shopifyAuthUrl } from "@/lib/connector/shopify"
import { platformAvailability } from "@/lib/connector/availability"

export const dynamic = "force-dynamic"

// GET /api/connect/shopify/start?shop=brightsmile(.myshopify.com)
// Sends the signed-in owner to Shopify to approve the Alphaa app for their store.
// Also works as the app's "App URL": an install started from Shopify lands here
// with ?shop=…&hmac=…, and we run the same OAuth flow (after sign-in if needed).
export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  const back = (params: Record<string, string>) => {
    const u = new URL("/dashboard/t/site", base)
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
    return NextResponse.redirect(u)
  }

  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL(`/login?redirect_url=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, base))

  if (!platformAvailability().shopify) return back({ connect: "shopify-unavailable" })

  const shop = normalizeShop(req.nextUrl.searchParams.get("shop"))
  if (!shop) return back({ connect_error: "Enter your store's Shopify address, like yourstore.myshopify.com." })

  const state = Buffer.from(JSON.stringify({ userId: user.id, nonce: crypto.randomUUID(), shop })).toString("base64url")
  return NextResponse.redirect(shopifyAuthUrl(shop, state))
}
