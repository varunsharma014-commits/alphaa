export const dynamic = "force-dynamic"
export const maxDuration = 180

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { agent } from "@/lib/agent/types"
import { metaAdsConfigured } from "@/lib/metaads/connect"
import { metaAdsMessages } from "@/lib/metaads/narration"
import { getAccess, getCampaign, listCampaigns, patchAccess, removeAccess } from "@/lib/metaads/store"
import { proposePlan } from "@/lib/metaads/plan"
import { askCityMessages } from "@/lib/agent/city"
import { approveAndBuild, dismissPlan, setLeadsOn, setLive } from "@/lib/metaads/ops"
import { startPromotion } from "@/lib/metaads/promote"
import { applyTune, dismissTune } from "@/lib/metaads/tune"
import { forget } from "@/lib/metaads/report"
import { checkAdAccount } from "@/lib/ad-accounts"
import { checkQuota } from "@/lib/quotas"
import { requireCan } from "@/lib/team/actor"
import type { Action } from "@/lib/team/permissions"

// Facebook + Instagram ads, owner choices from the ads thread. Answers with the updated messages.
const id = z.string().min(5).max(40)
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("pick"), key: z.enum(["adAccount", "page", "instagram", "pixel"]), value: z.string().max(60) }),
  z.object({ op: z.literal("plan") }),
  z.object({ op: z.literal("approve"), id, dailyBudget: z.union([z.string(), z.number()]), privacyUrl: z.string().max(500).optional() }),
  z.object({ op: z.literal("dismiss"), id }),
  z.object({ op: z.literal("leads_on"), id, value: z.enum(["form", "website"]) }),
  z.object({ op: z.literal("enable"), id }),
  z.object({ op: z.literal("pause"), id }),
  z.object({ op: z.literal("tune_apply"), id }),
  z.object({ op: z.literal("tune_dismiss"), id }),
  z.object({ op: z.literal("disconnect") }),
])

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await metaAdsMessages(user) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Ads come with the Growth plan." }, { status: 403 })
  if (!metaAdsConfigured()) return NextResponse.json({ error: "Facebook & Instagram ads are opening soon." }, { status: 409 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  // Teams (lib/team/routes.ts "self"): what this op needs.
  const denied = await requireCan(({ pick: "connect", disconnect: "connect", plan: "create" } as Record<string, Action>)[input.op] ?? "ads")
  if (denied) return denied

  let said = "Done."
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })

  switch (input.op) {
    case "pick": {
      const a = await getAccess(user.id)
      if (!a) return fail("Connect Facebook & Instagram first.", 409)
      const v = input.value || null
      const picks = { ...a.picks }
      if (input.key === "adAccount") {
        if (v && !a.adAccounts.some((x) => x.id === v)) return fail("That ad account isn’t shared with me.")
        if (v) {
          const allowed = await checkAdAccount(user, "meta", v)
          if (!allowed.ok) return fail(allowed.message, 402)
        }
        picks.adAccountId = v ?? undefined
        picks.pixelId = null
      } else if (input.key === "page") picks.pageId = v ?? undefined
      else if (input.key === "instagram") picks.igUserId = v
      else picks.pixelId = v
      await patchAccess(user.id, { picks })
      said = v ? "Got it." : "Pick again below."
      break
    }
    case "plan": {
      // No city yet: ask for it in the chat (small form) instead of failing.
      if (!user.city?.trim()) return NextResponse.json({ messages: askCityMessages("metaads", user.state) })
      const q = await checkQuota(user, "ad_plan")
      if (!q.allowed) return fail(q.message ?? "", 429)
      const r = await proposePlan(user.id)
      if (!r.ok) return fail(r.reason, 409)
      said = "Here’s my plan. Nothing is built until you approve it."
      break
    }
    case "approve": {
      const daily = Number(String(input.dailyBudget).replace(/[^\d.]/g, ""))
      const planned = await getCampaign(user.id, input.id)
      if (planned) {
        const allowed = await checkAdAccount(user, "meta", planned.adAccountId)
        if (!allowed.ok) return fail(allowed.message, 402)
      }
      const q = await checkQuota(user, "ad_change")
      if (!q.allowed) return fail(q.message ?? "", 429)
      const r = await approveAndBuild(user.id, input.id, { dailyBudget: daily, privacyUrl: input.privacyUrl ?? null })
      if (!r.ok) return fail(r.error, 409)
      said = r.said
      break
    }
    case "leads_on": {
      const r = await setLeadsOn(user.id, input.id, input.value)
      if (!r.ok) return fail(r.error, 409)
      said = r.said
      break
    }
    case "dismiss": {
      const r = await dismissPlan(user.id, input.id)
      if (!r.ok) return fail(r.error, 409)
      said = r.said
      break
    }
    case "enable":
    case "pause": {
      // Pausing is never blocked; turning on counts against the ad-account allowance.
      if (input.op === "enable") {
        const c = await getCampaign(user.id, input.id)
        if (c) {
          const allowed = await checkAdAccount(user, "meta", c.adAccountId)
          if (!allowed.ok) return fail(allowed.message, 402)
        }
      }
      // A promoted post gets its end date when it's turned on (lib/metaads/promote.ts).
      const promo = input.op === "enable" ? await getCampaign(user.id, input.id) : null
      const r = promo?.promoted ? await startPromotion(user, input.id) : await setLive(user.id, input.id, input.op === "enable")
      if (!r.ok) return fail(r.error, 409)
      forget(user.id)
      said = r.said
      break
    }
    case "tune_apply": {
      const t = await applyTune(user.id, input.id, "owner")
      said = t?.status === "applied" ? `Done. I made ${t.actions.length} ${t.actions.length === 1 ? "change" : "changes"}.` : t?.status === "dismissed" ? "I didn’t change anything: it would go over your budget now." : "Those changes aren’t waiting any more."
      forget(user.id)
      break
    }
    case "tune_dismiss": {
      await dismissTune(user.id, input.id)
      said = "Left as is."
      break
    }
    case "disconnect": {
      // Pause what I'm running first, so nothing keeps spending without me watching it.
      const running = (await listCampaigns(user.id, 50)).filter((c) => c.status === "active")
      let paused = 0
      for (const c of running) if ((await setLive(user.id, c.id, false)).ok) paused++
      const left = running.length - paused
      said = (await removeAccess(user.id))
        ? `Done. I can’t see or change your ads any more.${paused ? ` I paused ${paused} running ${paused === 1 ? "campaign" : "campaigns"} first.` : ""}${left ? ` ${left} couldn’t be paused: pause ${left === 1 ? "it" : "them"} in Meta Ads Manager.` : ""} Posting is unchanged.`
        : "Ads access wasn’t on."
      break
    }
  }
  return NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...(await metaAdsMessages(user))] })
}
