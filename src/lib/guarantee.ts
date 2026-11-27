// The 90-day AI Visibility Guarantee: if, in a customer's first 90 days on a
// paid plan, none of ChatGPT, Gemini, Claude or Perplexity named them in any
// of our weekly checks, their next month is free — applied automatically as a
// Stripe customer credit (one month at their plan's price), once per customer.
// Merchants billed through Shopify get the same guarantee: Shopify bills them,
// so the month is credited through Shopify (a Partner Dashboard app credit);
// the merchant is told and hi@alphaa.app gets the to-do.
import { db } from "@/lib/db"
import { SUPPORT_EMAIL } from "@/lib/constants"
import { shopifyBilledShop } from "@/lib/billing"
import { getStripe, planItem } from "@/lib/stripe"
import { sendAs, shell, esc } from "@/lib/connector/mail"
import { AGENT_SENDER_NAME, REPLY_TO } from "@/lib/email-sender"

export const GUARANTEE_DAYS = 90
const DAY = 86_400_000

export type GuaranteeVerdict =
  | { eligible: true; start: Date; amountCents: number; checks: number; shop?: string }
  | { eligible: false; reason: string }

export async function guaranteeVerdict(userId: string): Promise<GuaranteeVerdict> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user?.stripeSubscriptionId) return { eligible: false, reason: "no subscription" }
  const shop = shopifyBilledShop(user)
  if (!shop && !user.stripeCustomerId) return { eligible: false, reason: "no subscription" }
  if (await db.mockActivity.findFirst({ where: { userId, type: "guarantee_credit" } })) return { eligible: false, reason: "already credited" }
  let start: Date
  let amountCents = 0
  if (shop) {
    // Shopify Managed Pricing: the plan started when Shopify last reported it ACTIVE for this account.
    if (user.subscriptionStatus !== "active") return { eligible: false, reason: `subscription ${user.subscriptionStatus}` }
    const began = await db.mockActivity.findFirst({
      where: { userId, type: "shopify_billing", metadata: { path: ["status"], equals: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })
    if (!began) return { eligible: false, reason: "no Shopify start date" }
    start = began.createdAt
    amountCents = 9900 // the Shopify plan is Starter, $99/mo
  } else {
    const sub = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId)
    if (sub.status !== "active") return { eligible: false, reason: `subscription ${sub.status}` }
    start = new Date(sub.start_date * 1000)
    const price = planItem(sub.items.data)?.price // the plan, not an "Extra ad account" add-on
    const unit = price?.unit_amount ?? 0
    const months = price?.recurring?.interval === "year" ? 12 * (price.recurring.interval_count ?? 1) : price?.recurring?.interval_count ?? 1
    amountCents = Math.round(unit / months)
  }
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

  if (amountCents <= 0) return { eligible: false, reason: "no price" }
  return { eligible: true, start, amountCents, checks: scans.length + audits.length, ...(shop ? { shop } : {}) }
}

/** Applies the credit if eligible. Idempotent: one credit per customer, ever. */
export async function applyGuarantee(userId: string): Promise<GuaranteeVerdict> {
  const v = await guaranteeVerdict(userId)
  if (!v.eligible) return v
  const user = (await db.user.findUnique({ where: { id: userId } }))!
  const dollars = (v.amountCents / 100).toFixed(2).replace(/\.00$/, "")
  if (v.shop) {
    // Shopify bills this merchant, so the credit is issued in Shopify (Partner Dashboard → store →
    // app credit). Recorded first so the daily cron never applies it twice.
    await db.mockActivity.create({ data: { userId, type: "guarantee_credit", title: `Next month is free — the AI Visibility Guarantee: a $${dollars} credit is being applied through Shopify`, metadata: { amountCents: v.amountCents, start: v.start.toISOString(), checks: v.checks, via: "shopify", shop: v.shop, pending: true } } })
    const todo = `${user.email} (${v.shop}) qualified for the 90-day AI Visibility Guarantee. Issue a one-month app credit of $${dollars} in the Shopify Partner Dashboard within 5 business days.`
    await sendAs({ fromName: "Alphaa guarantee", to: SUPPORT_EMAIL, subject: `Action: issue a $${dollars} Shopify app credit to ${v.shop}`, html: shell(`<p style="margin:0">${esc(todo)}</p>`, "Alphaa"), text: todo }).catch((err) => console.error("[guarantee] owner alert", err instanceof Error ? err.message : err))
  } else {
    await getStripe().customers.createBalanceTransaction(
      user.stripeCustomerId!,
      { amount: -v.amountCents, currency: "usd", description: "Alphaa 90-day AI Visibility Guarantee — next month free" },
      { idempotencyKey: `alphaa-guarantee-${userId}` },
    )
    await db.mockActivity.create({ data: { userId, type: "guarantee_credit", title: `Next month is free — the AI Visibility Guarantee applied $${dollars} to your account`, metadata: { amountCents: v.amountCents, start: v.start.toISOString(), checks: v.checks } } })
  }
  const howText = v.shop ? `I am applying a $${dollars} credit through your Shopify billing within 5 business days.` : `I have applied a $${dollars} credit to your account.`
  const how = v.shop ? `I am applying a <b>$${dollars} credit</b> through your Shopify billing within 5 business days.` : `I have applied a <b>$${dollars} credit</b> to your account.`
  const biz = user.businessName?.trim() || "your business"
  const first = user.fullName?.trim().split(/\s+/)[0]
  const hiLine = first ? `Hi ${first},` : "Hi,"
  const inner = `<p style="margin:0 0 16px">${esc(hiLine)}</p>
<p style="margin:0 0 16px">In your first 90 days, none of the 4 major AIs named ${esc(biz)} during my weekly checks.</p>
<p style="margin:0 0 16px">That is exactly what our guarantee covers. ${how} Your next month is free, and there is nothing you need to do.</p>
<p style="margin:0">I am still working on this every week, and I will alert you the moment your name comes up.</p>
<p style="margin:16px 0 0;color:#6e6e73">— Your AI Agent</p>`
  const text = `${hiLine}\n\nIn your first 90 days, none of the 4 major AIs named ${biz} during my weekly checks.\n\nThat is exactly what our guarantee covers. ${howText} Your next month is free, and there is nothing you need to do.\n\nI am still working on this every week, and I will alert you the moment your name comes up.\n\n— Your AI Agent`
  await sendAs({ fromName: AGENT_SENDER_NAME, replyTo: REPLY_TO, to: user.email, subject: "Your next month is free.", html: shell(inner, "Alphaa 90-day AI Visibility Guarantee."), text }).catch((err) => console.error("[guarantee] email", err instanceof Error ? err.message : err))
  return v
}
