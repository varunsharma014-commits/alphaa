export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { describeRule, MAX_RULES, PRESETS, validateRule, type AdRule } from "@/lib/ad-rules/engine"
import { rulesView, runAdRules, undoRuleChange } from "@/lib/ad-rules/run"
import { quotaBody, isQuotaError } from "@/lib/quotas"

// The owner's ad rules (Ads → Your rules): list + presets (GET), save / delete / switch on-off,
// "Check now" (a dry run: decides, changes nothing) and Undo of a change a rule made.
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("save"), rule: z.record(z.string(), z.unknown()) }),
  z.object({ op: z.literal("delete"), id: z.string().min(4).max(40) }),
  z.object({ op: z.literal("toggle"), id: z.string().min(4).max(40), on: z.boolean() }),
  z.object({ op: z.literal("check") }),
  z.object({ op: z.literal("undo"), key: z.string().min(4).max(40) }),
])

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Ad rules come with the Growth plan." }, { status: 403 })
  return NextResponse.json({ ...(await rulesView(user)), presets: PRESETS })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasGrowth(user)) return NextResponse.json({ error: "Ad rules come with the Growth plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const s = await getAgentSettings(user.id)
  const rules: AdRule[] = s.adRules ?? []
  const view = async (said: string, extra: Record<string, unknown> = {}) => NextResponse.json({ said, ...(await rulesView(user)), presets: PRESETS, ...extra })

  try {
    switch (input.op) {
      case "save": {
        const v = validateRule(input.rule as Partial<AdRule>)
        if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
        const i = rules.findIndex((r) => r.id === v.rule.id)
        if (i < 0 && rules.length >= MAX_RULES) return NextResponse.json({ error: `That’s ${MAX_RULES} rules already. Delete one first.` }, { status: 400 })
        const next = i >= 0 ? rules.map((r, j) => (j === i ? { ...v.rule, createdAt: r.createdAt } : r)) : [...rules, v.rule]
        await saveAgentSettings(user.id, { adRules: next })
        return view(`Saved. ${describeRule(v.rule)} I check it once a day.`)
      }
      case "delete": {
        await saveAgentSettings(user.id, { adRules: rules.filter((r) => r.id !== input.id) })
        return view("Deleted. I won’t use that rule any more.")
      }
      case "toggle": {
        await saveAgentSettings(user.id, { adRules: rules.map((r) => (r.id === input.id ? { ...r, on: input.on } : r)) })
        return view(input.on ? "On. I check it once a day." : "Off. I won’t act on it.")
      }
      case "check": {
        const r = await runAdRules(user, { dryRun: true })
        return view(r.ran ? (r.actions.length ? `If I checked now, ${r.actions.length} ${r.actions.length === 1 ? "rule would act" : "rules would act"}. Nothing changed.` : "If I checked now, no rule would act. Nothing changed.") : r.reason ?? "Nothing to check.", { preview: r.actions.map((a) => ({ ruleId: a.ruleId, kind: a.kind, why: a.why })), waiting: r.checks.filter((c) => c.result === "not_enough_data").length, errors: r.errors })
      }
      case "undo": {
        const r = await undoRuleChange(user, input.key)
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status ?? 409 })
        return view(r.said)
      }
    }
  } catch (err) {
    if (isQuotaError(err)) { const [b, o] = quotaBody(err); return NextResponse.json(b, o) }
    console.error("[ad-rules]", input.op, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: err instanceof Error ? err.message.slice(0, 200) : "That didn’t work. Nothing changed." }, { status: 502 })
  }
}
