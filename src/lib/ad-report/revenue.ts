// Which platforms' own sale values are real for this brand: the tracked ROAS source lib/roas
// picked (never the customer-value estimate). Meta purchases and Google conversion values come per
// campaign and per ad from the APIs, so rules and reports can use them for any date range; other
// sources (GA4, WooCommerce, won leads) are platform totals, so rules and reports leave ROAS "—".
import type { User } from "@prisma/client"
import { getRoas } from "@/lib/roas/sources"
import { within } from "@/lib/workspace/common"

export async function trackedOwnValues(user: Pick<User, "id">): Promise<{ meta: boolean; google: boolean }> {
  const r = await within(getRoas(user), 15_000, null)
  if (!r) return { meta: false, google: false }
  const src = (p: "meta" | "google") => [30, 7].map((d) => r.windows[d as 7 | 30]?.platforms.find((x) => x.platform === p)?.source ?? null).find(Boolean) ?? null
  return { meta: src("meta") === "meta_purchases", google: src("google") === "google_values" }
}
