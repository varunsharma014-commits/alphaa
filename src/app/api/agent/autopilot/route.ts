export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { hasGrowth } from "@/lib/billing"
import { autopilotMessages, PRO_RE } from "@/lib/agent/autopilot"
import { agent } from "@/lib/agent/types"
import { acceptAutoApprove, needsConsent, revokeAutoApprove } from "@/lib/agent/auto-approve"

// "What I do without asking": one-tap standing approvals. Answers with the thread's messages.
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("set"), key: z.enum(["posts", "reviews", "social", "email", "ads"]), value: z.string().max(20) }),
  z.object({ op: z.literal("budget"), amount: z.string().max(20) }),
  // "Auto-approve and post": accepted in the warning modal (accept must be true), or turned off.
  z.object({ op: z.literal("auto_on"), accept: z.literal(true), key: z.enum(["posts", "reviews", "social"]).optional(), value: z.string().max(20).optional() }),
  z.object({ op: z.literal("auto_off") }),
])

const VALUES: Record<string, string[]> = {
  posts: ["ask", "auto"],
  reviews: ["ask", "positive", "all"],
  social: ["ask", "auto"],
  email: ["ask", "auto"],
  ads: ["each", "budget"],
}
const SAID: Record<string, string> = {
  "posts:ask": "Done. I’ll ask you before publishing any post.",
  "posts:auto": "Done. I’ll publish finished posts myself and tell you here each time.",
  "reviews:ask": "Done. Every review reply waits for your tap.",
  "reviews:positive": "Done. I’ll post replies to 4 and 5 star reviews myself. Anything lower waits for you.",
  "reviews:all": "Done. I’ll post every review reply myself and show you each one here.",
  "social:ask": "Done. Social posts will wait for your tap.",
  "social:auto": "Done. I’ll post to your social accounts myself once they’re connected.",
  "email:ask": "Done. I’ll ask before every email campaign goes out.",
  "email:auto": "Done. I’ll send your email campaigns myself and show you each one here.",
  "ads:each": "Done. I’ll ask before starting any new campaign.",
  "ads:budget": "Done. I’ll start and tune campaigns myself, always inside your monthly budget.",
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: await autopilotMessages(user) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 })
  }
  const s = await getAgentSettings(user.id)
  const a = s.autopilot ?? {}
  const now = new Date().toISOString()
  let said: string

  if (input.op === "auto_on") {
    if (input.key && input.key !== "reviews" && !(input.key === "posts" ? PRO_RE.test(user.plan) : hasGrowth(user))) return NextResponse.json({ error: input.key === "posts" ? "Publishing without asking comes with the Pro plan." : "That comes with the Growth plan." }, { status: 403 })
    said = (await acceptAutoApprove(user, req, input.key, input.value)).said
    return NextResponse.json({ on: true, messages: [agent([{ kind: "text", text: said }]), ...(await autopilotMessages(user))] })
  }
  if (input.op === "auto_off") {
    said = (await revokeAutoApprove(user, req)).said
    return NextResponse.json({ on: false, messages: [agent([{ kind: "text", text: said }]), ...(await autopilotMessages(user))] })
  }

  if (input.op === "budget") {
    if (!hasGrowth(user)) return NextResponse.json({ error: "Ads come with the Growth plan." }, { status: 403 })
    const amount = Math.round(Number(input.amount.replace(/[^\d.]/g, "")))
    if (!Number.isFinite(amount) || amount < 1 || amount > 1_000_000) return NextResponse.json({ error: "Type the amount as a number, like 500." }, { status: 400 })
    await saveAgentSettings(user.id, { autopilot: { ...a, adBudget: amount, at: now } })
    said = `Saved. I’ll never spend more than ${amount.toLocaleString("en-US")} a month on your ads.`
  } else {
    const { key, value } = input
    if (!VALUES[key].includes(value)) return NextResponse.json({ error: "That one isn’t an option." }, { status: 400 })
    // Publishing without asking needs the accepted warning first (the page opens it).
    const only = needsConsent(key, value)
    if (only && !s.autoApprove) return NextResponse.json({ needsConsent: true, key: only, value, error: "Accept the auto-approve terms first." }, { status: 409 })
    if (key === "posts") {
      if (value === "auto" && !PRO_RE.test(user.plan)) return NextResponse.json({ error: "Publishing without asking comes with the Pro plan." }, { status: 403 })
      await saveAgentSettings(user.id, { autoPublishPosts: value === "auto" })
    } else {
      if ((key === "social" || key === "email" || key === "ads") && !hasGrowth(user)) return NextResponse.json({ error: "That comes with the Growth plan." }, { status: 403 })
      if (key === "ads" && value === "budget" && !a.adBudget) return NextResponse.json({ error: "Set your monthly budget first, so I know where to stop." }, { status: 400 })
      await saveAgentSettings(user.id, { autopilot: { ...a, [key]: value, at: now } })
    }
    said = SAID[`${key}:${value}`] ?? "Done."
  }
  return NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...(await autopilotMessages(user))] })
}
