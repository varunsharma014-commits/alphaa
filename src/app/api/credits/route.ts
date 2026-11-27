export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { isComped } from "@/lib/billing"
import { creditState, setAutoUse } from "@/lib/credits"
import { CREDIT_PACKS, creditCost } from "@/lib/credit-rules"
import { shopifyMerchantShop, shopifyPricingUrl } from "@/lib/connector/shopify-billing"

// GET: the brand's credit balance, the packs, and whether buying is possible here
// (Shopify-billed merchants upgrade in Shopify instead; comped accounts never need credits).
// POST { autoUse: boolean }: the "Use credits when I run out" switch.
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const [st, shop] = await Promise.all([creditState(user.id), shopifyMerchantShop(user)])
  const next = st.lots.filter((l) => l.left > 0 && new Date(l.expiresAt) > new Date()).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))[0]
  return NextResponse.json({
    balance: st.balance,
    autoUse: st.autoUse,
    bought: st.bought,
    nextExpiry: next ? { credits: next.left, at: next.expiresAt } : null,
    packs: CREDIT_PACKS.map((p) => ({ credits: p.credits, usd: p.usd })),
    costs: { blog: creditCost("content_piece:blog"), social: creditCost("content_piece:social"), gbp: creditCost("content_piece:gbp"), email: creditCost("content_piece:email"), week: creditCost("week_run") },
    comped: isComped(user.email),
    shopifyUrl: shop ? shopifyPricingUrl(shop) : null,
  })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { autoUse?: unknown }
  if (typeof body.autoUse !== "boolean") return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 })
  await setAutoUse(user.id, body.autoUse)
  return NextResponse.json({ ok: true, autoUse: body.autoUse })
}
