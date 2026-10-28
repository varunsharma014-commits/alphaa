// What one new customer is worth to the business. I estimate it from the kind
// of business and where it is, so the briefing can show results in money with
// nothing asked of the owner; they can replace it with their own number.
// Always shown as an estimate until they do.

import { anthropic } from "@/lib/claude"
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings, type AgentSettings } from "@/lib/agent/settings"

export type CustomerValue = NonNullable<AgentSettings["customerValue"]>

export async function getCustomerValue(userId: string): Promise<CustomerValue | null> {
  const s = await getAgentSettings(userId)
  if (s.customerValue) return s.customerValue
  const user = await db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true, state: true, websiteUrl: true } })
  if (!user?.businessType && !user?.businessName) return null
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Estimate the typical revenue ONE new customer brings a business like this over their first year (first job plus typical repeat business). Be conservative: a typical, not best-case, figure in the local currency's dollars.
Business: ${user.businessName ?? "unknown"}
Type: ${user.businessType ?? "unknown"}
Location: ${[user.city, user.state].filter(Boolean).join(", ") || "unknown"}
Website: ${user.websiteUrl ?? "unknown"}
Reply with JSON only: {"amount": <whole number>, "basis": "<under 12 words, e.g. 'one furnace repair plus a yearly tune-up'>"}`,
      }],
    })
    const text = msg.content[0]?.type === "text" ? msg.content[0].text : ""
    const j = JSON.parse(text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()) as { amount?: unknown; basis?: unknown }
    const amount = Math.round(Number(j.amount))
    if (!Number.isFinite(amount) || amount < 20 || amount > 1_000_000) return null
    // Round so it reads as an estimate, not a false-precision figure.
    const rounded = amount >= 1000 ? Math.round(amount / 100) * 100 : Math.round(amount / 10) * 10
    const value: CustomerValue = { amount: rounded, source: "estimate", basis: typeof j.basis === "string" ? j.basis.slice(0, 90) : undefined, at: new Date().toISOString() }
    await saveAgentSettings(userId, { customerValue: value })
    return value
  } catch (err) {
    console.error("[customer-value]", err)
    return null
  }
}
