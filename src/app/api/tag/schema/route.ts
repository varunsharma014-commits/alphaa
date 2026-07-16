export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { generateBusinessSchema } from "@/lib/business-schema"
import type { SchemaItem } from "@/lib/schema-generator"

// Public JSON-LD for a business, fetched by the tag.js snippet from the
// customer's own domain — so CORS must allow any origin.
const CORS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "no-store",
}

// Response shape (v2): { v: 2, schemas: [{ pageUrl, jsonLd }] }. The snippet
// injects every entry whose pageUrl matches the visitor's page ("/" entries
// go everywhere). Customers still running a cached v1 snippet fail its
// data['@type'] check and simply inject nothing until the 1h cache expires.
export async function GET(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return new Response("{}", { headers: CORS })

  const user = await db.user.findUnique({ where: { id } })
  if (!user) return new Response("{}", { headers: CORS })

  const businessSchema = generateBusinessSchema(user)
  const schemas: { pageUrl: string; jsonLd: unknown }[] = [
    { pageUrl: "/", jsonLd: businessSchema },
  ]

  // Claude-generated schemas (FAQPage, Service, …) saved on Website Health.
  // Skip types the live business schema already covers to avoid duplicates.
  const latest = await db.schemaMarkup.findFirst({
    where: { userId: user.id },
    orderBy: { generatedAt: "desc" },
  })
  if (latest && Array.isArray(latest.schemas)) {
    for (const raw of latest.schemas as unknown as SchemaItem[]) {
      if (!raw || typeof raw !== "object" || !raw.jsonLd) continue
      if (raw.type === businessSchema["@type"]) continue
      schemas.push({ pageUrl: raw.pageUrl || "/", jsonLd: raw.jsonLd })
    }
  }

  return new Response(JSON.stringify({ v: 2, schemas }), { headers: CORS })
}

export function OPTIONS(): Response {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
    },
  })
}
