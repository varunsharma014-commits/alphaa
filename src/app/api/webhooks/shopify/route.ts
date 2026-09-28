export const dynamic = "force-dynamic"

import { handleShopifyWebhook } from "@/lib/connector/shopify-webhooks"

// POST /api/webhooks/shopify: one URL for every topic (dispatches on X-Shopify-Topic),
// for when the app config uses a single compliance-webhook URL.
export async function POST(req: Request) {
  return handleShopifyWebhook(req, null)
}
