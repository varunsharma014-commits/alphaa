import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { normalizeShop, shopifyAuthUrl, verifyShopifyHmac } from "@/lib/connector/shopify"
import { siteForShop } from "@/lib/connector/shopify-sites"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SITE_COOKIE } from "@/lib/sites"
import { platformAvailability } from "@/lib/connector/availability"

export const dynamic = "force-dynamic"

// GET /api/connect/shopify/start?shop=brightsmile(.myshopify.com)
// Sends the signed-in owner to Shopify to approve the Alphaa app for their store.
// Also works as the app's "App URL": an install started from Shopify lands here
// with ?shop=…&hmac=…, and we run the same OAuth flow (after sign-in if needed).
export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
  const back = (params: Record<string, string>) => {
    const u = new URL("/dashboard?ask=site", base)
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
    return NextResponse.redirect(u)
  }

  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL(`/login?redirect_url=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`, base))

  if (!platformAvailability().shopify) return back({ connect: "shopify-unavailable" })

  const shop = normalizeShop(req.nextUrl.searchParams.get("shop"))
  if (!shop) return back({ connect_error: "Enter your store's Shopify address, like yourstore.myshopify.com." })

  // Opened from the Shopify admin (install, plan approval, "Open app"): work on this store's own
  // website, adding one if the owner's open website is a different business (lib/connector/shopify-sites.ts).
  let rowId = user.id
  let ownerRow = false
  if (req.nextUrl.searchParams.has("hmac") && verifyShopifyHmac(req.nextUrl.searchParams)) {
    const { userId: ownerClerk } = await realAuth()
    if (ownerClerk) {
      rowId = (await siteForShop(ownerClerk, user, shop)).id
      ownerRow = rowId !== user.id && (await db.user.count({ where: { id: rowId, clerkId: ownerClerk } })) > 0
    }
  }

  const state = Buffer.from(JSON.stringify({ userId: rowId, nonce: crypto.randomUUID(), shop })).toString("base64url")
  const res = NextResponse.redirect(shopifyAuthUrl(shop, state))
  if (rowId !== user.id) {
    if (ownerRow) res.cookies.delete(SITE_COOKIE)
    else res.cookies.set(SITE_COOKIE, rowId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 })
  }
  return res
}
