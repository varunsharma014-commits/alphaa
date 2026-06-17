export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { generateBusinessSchema } from "@/lib/business-schema"

// Public JSON-LD for a business, fetched by the tag.js snippet from the
// customer's own domain — so CORS must allow any origin.
const CORS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "no-store",
}

export async function GET(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return new Response("{}", { headers: CORS })

  const user = await db.user.findUnique({ where: { id } })
  if (!user) return new Response("{}", { headers: CORS })

  return new Response(JSON.stringify(generateBusinessSchema(user)), { headers: CORS })
}

export function OPTIONS(): Response {
  return new Response(null, {
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
    },
  })
}
