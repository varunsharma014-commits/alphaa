// The 90-day AI Visibility Guarantee: if, in a customer's first 90 days on a
// paid plan, none of ChatGPT, Gemini, Claude or Perplexity named them in any
// of our weekly checks, their next month is free — applied automatically as a
// Stripe customer credit (one month at their plan's price), once per customer.
import { db } from "@/lib/db"
import { shopifyBilledShop } from "@/lib/billing"
import { getStripe } from "@/lib/stripe"
import { sendAs, shell, esc } from "@/lib/connector/mail"

export const GUARANTEE_DAYS = 90
const DAY = 86_400_000

export type GuaranteeVerdict =
  | { eligible: true; start: Date; amountCents: number; checks: number }
  | { eligible: false; reason: string }

export async function guaranteeVerdict(userId: string): Promise<GuaranteeVerdict> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user?.stripeSubscriptionId || !user.stripeCustomerId) return { eligible: false, reason: "no subscription" }
  if (shopifyBilledShop(user)) return { eligible: false, reason: "billed through Shopify" } // no Stripe customer credit possible
  if (await db.mockActivity.findFirst({ where: { userId, type: "guarantee_credit" } })) return { eligible: false, reason: "already credited" }
  const sub = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId)
  if (sub.status !== "active") return { eligible: false, reason: `subscription ${sub.status}` }
  const start = new Date(sub.start_date * 1000)
  const age = (Date.now() - start.getTime()) / DAY
  if (age < GUARANTEE_DAYS) return { eligible: false, reason: `day ${Math.floor(age)}` }
  if (age > GUARANTEE_DAYS + 60) return { eligible: false, reason: "past the guarantee window" }
  const end = new Date(start.getTime() + GUARANTEE_DAYS * DAY)

  // Any evidence of being named in the window voids it.
  const [scans, audits] = await Promise.all([
    db.mockActivity.findMany({ where: { userId, type: "question_scan", createdAt: { gte: start, lte: end } }, select: { metadata: true } }),
    db.audit.findMany({ where: { userId, createdAt: { gte: start, lte: end } }, select: { aiEngineResults: { select: { appeared: true } } } }),
  ])
  const namedInScans = scans.some((s) => ((s.metadata as { named?: number } | null)?.named ?? 0) > 0)
  const namedInAudits = audits.some((a) => a.aiEngineResults.some((r) => r.appeared))
  if (namedInScans || namedInAudits) return { eligible: false, reason: "named at least once" }

  const price = sub.items.data[0]?.price
  const unit = price?.unit_amount ?? 0
  const months = price?.recurring?.interval === "year" ? 12 * (price.recurring.interval_count ?? 1) : price?.recurring?.interval_count ?? 1
  const amountCents = Math.round(unit / months)
  if (amountCents <= 0) return { eligible: false, reason: "no price" }
  return { eligible: true, start, amountCents, checks: scans.length + audits.length }
}

/** Applies the credit if eligible. Idempotent: one credit per customer, ever. */
export async function applyGuarantee(userId: string): Promise<GuaranteeVerdict> {
  const v = await guaranteeVerdict(userId)
  if (!v.eligible) return v
  const user = (await db.user.findUnique({ where: { id: userId } }))!
  await getStripe().customers.createBalanceTransaction(
    user.stripeCustomerId!,
    { amount: -v.amountCents, currency: "usd", description: "Alphaa 90-day AI Visibility Guarantee — next month free" },
    { idempotencyKey: `alphaa-guarantee-${userId}` },
  )
  const dollars = (v.amountCents / 100).toFixed(2).replace(/\.00$/, "")
  await db.mockActivity.create({ data: { userId, type: "guarantee_credit", title: `Next month is free — the AI Visibility Guarantee applied $${dollars} to your account`, metadata: { amountCents: v.amountCents, start: v.start.toISOString(), checks: v.checks } } })
  const biz = user.businessName || "your business"
  const inner = `<p style="margin:0 0 16px">Hi${user.fullName ? ` ${esc(user.fullName.split(" ")[0])}` : ""},</p>
<p style="margin:0 0 16px">In your first 90 days, none of the AI assistants named ${esc(biz)} in my weekly checks. That’s what our guarantee covers, so I’ve applied a <b>$${dollars} credit</b> — your next month is free. Nothing to do on your side.</p>
<p style="margin:0">I’m still working on it every week, and I’ll tell you the moment one of them names you.</p>
<p style="margin:16px 0 0;color:#6e6e73">— Alphaa</p>`
  await sendAs({ fromName: "Alphaa", to: user.email, subject: "Your next month of Alphaa is free", html: shell(inner, "Alphaa 90-day AI Visibility Guarantee."), text: `In your first 90 days, none of the AI assistants named ${biz} in my weekly checks, so I've applied a $${dollars} credit — your next month is free.` }).catch((err) => console.error("[guarantee] email", err instanceof Error ? err.message : err))
  return v
}
