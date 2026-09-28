// Shopify webhooks: app/uninstalled plus the three mandatory privacy (GDPR)
// topics. We store no Shopify customer or order data, so the customer topics
// only need a verified 200; app/uninstalled and shop/redact drop the connection.
import { NextResponse } from "next/server"
import { verifyShopifyWebhook, isShopDomain } from "@/lib/connector/shopify"
import { clearShopifyShop } from "@/lib/connector/connection"

export const SHOPIFY_TOPICS = ["app/uninstalled", "customers/data_request", "customers/redact", "shop/redact"] as const
export type ShopifyTopic = (typeof SHOPIFY_TOPICS)[number]

/** Route slug ("customers-data-request") ↔ Shopify topic ("customers/data_request"). */
export const topicFromSlug = (slug: string): ShopifyTopic | null =>
  SHOPIFY_TOPICS.find((t) => t.replace(/[/_]/g, "-") === slug) ?? null

export async function handleShopifyWebhook(req: Request, expected: ShopifyTopic | null): Promise<Response> {
  const raw = await req.text()
  // Shopify's compliance check sends unsigned/garbled requests and expects a 401.
  if (!verifyShopifyWebhook(raw, req.headers.get("x-shopify-hmac-sha256"))) return new NextResponse("Unauthorized", { status: 401 })

  const topic = (expected ?? req.headers.get("x-shopify-topic") ?? "") as ShopifyTopic
  let body: { shop_domain?: string; myshopify_domain?: string; domain?: string } = {}
  try {
    body = JSON.parse(raw || "{}")
  } catch {
    /* still acknowledge */
  }
  const shop = req.headers.get("x-shopify-shop-domain") || body.shop_domain || body.myshopify_domain || ""

  if ((topic === "app/uninstalled" || topic === "shop/redact") && isShopDomain(shop)) {
    try {
      await clearShopifyShop(shop, topic === "app/uninstalled" ? "the Alphaa app was uninstalled in Shopify" : "Shopify asked us to erase the store's data")
    } catch (e) {
      console.error("[shopify webhook]", topic, e instanceof Error ? e.message : e)
      return new NextResponse("Error", { status: 500 }) // Shopify retries
    }
  }
  // customers/data_request and customers/redact: Alphaa never reads or stores Shopify customer data.
  return NextResponse.json({ ok: true })
}
