// WooCommerce orders through the Alphaa WordPress plugin (1.6.0+ "orders" route): order totals,
// dates and ad attribution only (click ids / UTM the plugin saved at checkout, or WooCommerce's own
// order attribution). Never names, emails, addresses or line items.
import type { AgentSettings } from "@/lib/agent/settings"
import { wpCall } from "@/lib/connector/wordpress"
import { versionAtLeast } from "@/lib/tracking"
import { cached } from "@/lib/workspace/common"
import { parseOrders, type WooRaw, type WooResult } from "./assemble"
export type { WooOrder, WooResult } from "./assemble"

export const WP_ORDERS_VERSION = "1.6.0"

/** Orders from the last 31 days, cached 30 minutes. */
export async function wooOrders(userId: string, wp: AgentSettings["wp"] | undefined): Promise<WooResult> {
  if (!wp) return { state: "no_wp" }
  if (!versionAtLeast(wp.version || "0", WP_ORDERS_VERSION)) return { state: "old_plugin" }
  return cached(`roas:woo:${userId}`, 30 * 60_000, async () => {
    try {
      return parseOrders(await wpCall<WooRaw>(userId, wp, "orders", { days: 31 }))
    } catch (err) {
      console.error("[roas] woo", err instanceof Error ? err.message.slice(0, 200) : "failed")
      return { state: "failed" as const }
    }
  })
}
