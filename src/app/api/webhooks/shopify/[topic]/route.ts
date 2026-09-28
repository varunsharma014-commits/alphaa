export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { handleShopifyWebhook, topicFromSlug } from "@/lib/connector/shopify-webhooks"

// POST /api/webhooks/shopify/{app-uninstalled | customers-data-request | customers-redact | shop-redact}
// HMAC-verified with the app secret (see lib/connector/shopify-webhooks).
export async function POST(req: Request, { params }: { params: Promise<{ topic: string }> }) {
  const topic = topicFromSlug((await params).topic)
  if (!topic) return NextResponse.json({ error: "Unknown topic" }, { status: 404 })
  return handleShopifyWebhook(req, topic)
}
