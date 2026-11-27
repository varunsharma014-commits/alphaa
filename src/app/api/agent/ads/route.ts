export const dynamic = "force-dynamic"
export const maxDuration = 180

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { agent, type Message } from "@/lib/agent/types"
import { getAgentSettings } from "@/lib/agent/settings"
import { gadsAvailable } from "@/lib/gads/oauth"
import { adsErrorText, forgetToken } from "@/lib/gads/client"
import { pickAccount } from "@/lib/gads/connect"
import { proposePlan, money } from "@/lib/gads/plan"
import { createFromPlan, setCampaignStatus, undoTune } from "@/lib/gads/create"
import { applyTune } from "@/lib/gads/tune"
import { getGadsAccount, getPlan, getTune, removeGadsAccount, savePlan, saveTune } from "@/lib/gads/store"
import { adsMessages, planMessages } from "@/lib/gads/thread"
import { checkDaily } from "@/lib/gads/rules"
import { askCityMessages } from "@/lib/agent/city"
import { checkAdAccount } from "@/lib/ad-accounts"
import { checkQuota } from "@/lib/quotas"

const id = z.string().min(5).max(40)
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("pick"), customerId: z.string().regex(/^\d{6,12}$/) }),
  z.object({ op: z.literal("plan") }),
  z.object({ op: z.literal("create"), id, daily: z.union([z.string(), z.number()]) }),
  z.object({ op: z.literal("discard"), id }),
  z.object({ op: z.literal("enable") }),
  z.object({ op: z.literal("pause") }),
  z.object({ op: z.literal("tune_apply"), id }),
  z.object({ op: z.literal("tune_skip"), id }),
  z.object({ op: z.literal("tune_undo"), id }),
  z.object({ op: z.literal("disconnect") }),
])

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await adsMessages(user) })
}

// Every write to the owner's Google Ads account starts here, from the owner's own tap.
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Google Ads comes with the Growth plan." }, { status: 403 })
  if (!gadsAvailable(user)) return NextResponse.json({ error: "Google Ads opens soon." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }

  const reply = async (said: string, extra: Message[] = []) => NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...extra, ...(await adsMessages(user, null))] })
  try {
    switch (input.op) {
      case "pick": {
        const allowed = await checkAdAccount(user, "google", input.customerId)
        if (!allowed.ok) return NextResponse.json({ error: allowed.message }, { status: 402 })
        const a = await pickAccount(user.id, input.customerId)
        return a ? reply(`I’ll use ${a.customerName}.`) : NextResponse.json({ error: "That account isn’t on your Google login." }, { status: 404 })
      }
      case "plan": {
        // No city yet: ask for it in the chat (small form) instead of failing.
        if (!user.city?.trim()) return NextResponse.json({ messages: askCityMessages("ads", user.state) })
        const q = await checkQuota(user, "ad_plan")
        if (!q.allowed) return NextResponse.json({ error: q.message }, { status: 429 })
        const p = await proposePlan(user.id)
        // The plan messages come back inside the thread (same ids replace older copies).
        return NextResponse.json({ messages: [agent([{ kind: "text", text: "I looked at the searches that already find you and checked each keyword with Google’s Keyword Planner." }]), ...planMessages(p)] })
      }
      case "create": {
        const p = await getPlan(user.id, input.id)
        if (!p || p.status !== "proposed") return NextResponse.json({ error: "That plan isn’t waiting any more. Ask me to plan it again." }, { status: 409 })
        const cap = (await getAgentSettings(user.id)).autopilot?.adBudget ?? null
        const d = checkDaily(input.daily, cap)
        if (!d.ok) return NextResponse.json({ error: d.error }, { status: 400 })
        const acct = (await getGadsAccount(user.id))?.customerId
        const allowed = acct ? await checkAdAccount(user, "google", acct) : { ok: true as const }
        if (!allowed.ok) return NextResponse.json({ error: allowed.message }, { status: 402 })
        const q = await checkQuota(user, "ad_change")
        if (!q.allowed) return NextResponse.json({ error: q.message }, { status: 429 })
        await createFromPlan(user.id, p, d.daily)
        return reply(`Built it in Google Ads, paused, at ${money(d.daily, p.currency)} a day. Nothing is spent until you turn it on.`)
      }
      case "discard": {
        const p = await getPlan(user.id, input.id)
        if (p) await savePlan(user.id, { ...p, status: "discarded" })
        return reply("No problem. Ask me any time and I’ll plan it fresh.")
      }
      case "enable": {
        // The only place a campaign is turned on: the owner's tap. Never from a cron.
        const acct = (await getGadsAccount(user.id))?.customerId
        const allowed = acct ? await checkAdAccount(user, "google", acct) : { ok: true as const }
        if (!allowed.ok) return NextResponse.json({ error: allowed.message }, { status: 402 })
        await setCampaignStatus(user.id, "ENABLED")
        return reply("It’s on. Your ads can start showing within a few hours, once Google reviews them.")
      }
      case "pause": {
        await setCampaignStatus(user.id, "PAUSED")
        return reply("Paused. Nothing more is spent until you turn it back on.")
      }
      case "tune_apply": {
        const t = await applyTune(user.id, input.id, "owner")
        return reply(t.status === "applied" ? "Done. Those changes are live in Google Ads." : `They didn’t all go through: ${t.error ?? "unknown error"}`)
      }
      case "tune_skip": {
        const t = await getTune(user.id, input.id)
        if (t?.status === "proposed") await saveTune(user.id, { ...t, status: "skipped" })
        return reply("Left as is.")
      }
      case "tune_undo": {
        const n = await undoTune(user.id, input.id)
        return reply(n ? "Undone. Those searches and keywords are back as they were." : "There was nothing to undo.")
      }
      case "disconnect": {
        await removeGadsAccount(user.id)
        forgetToken(user.id)
        return reply("Disconnected. Your campaign stays in your Google Ads account as it is; I won’t touch it again. You can also remove Alphaa’s access in your Google account settings.")
      }
    }
  } catch (err) {
    console.error("[agent/ads]", input.op, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: adsErrorText(err) }, { status: 502 })
  }
}
