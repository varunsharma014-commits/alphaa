// Guided setup: the one-time steps a new owner needs, asked one at a time at the top of the
// dashboard ("3 of 7 done"). Every "done" is read from real state (a connection, a choice
// saved), except the brand check, which only the owner can confirm. Steps that depend on
// something we don't have yet (our social apps) are shown as "opening soon" and not counted.
import { db } from "@/lib/db"
import { agent, type Chip, type Message } from "@/lib/agent/types"
import { getAgentSettings, saveAgentSettings, type AgentSettings } from "@/lib/agent/settings"
import { hasGrowth } from "@/lib/billing"
import { listAccounts } from "@/lib/social/store"
import { PROVIDERS, providerConfigured } from "@/lib/social/types"
import type { User } from "@prisma/client"

export type SetupStepKey = "google" | "site" | "voice" | "brand" | "autopilot" | "social" | "tracking"
export type SetupState = { done?: Partial<Record<SetupStepKey, string>>; skipped?: SetupStepKey[]; completedAt?: string; dismissedAt?: string }

type Step = {
  key: SetupStepKey
  name: string
  /** Why it matters, in owner words. */
  why: string
  ok: boolean
  /** Not available yet: shown, not counted, never "next". */
  soon?: boolean
  chips: Chip[]
}

const op = (body: Record<string, string>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "setup", body } })

async function steps(user: User, s: AgentSettings): Promise<Step[]> {
  const [integ, accounts] = await Promise.all([
    db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationId: true, gscSiteUrl: true, gaPropertyId: true } }),
    hasGrowth(user) ? listAccounts(user.id) : Promise.resolve([]),
  ])
  const st = s.setup ?? {}
  const google = !!(integ?.gmbLocationId || integ?.gscSiteUrl || integ?.gaPropertyId)
  const site = !!(s.wp || s.site?.platform)
  const out: Step[] = [
    {
      key: "google",
      name: "Connect Google",
      why: "One tap gives me your Google listing, your searches and your website visits. It’s how I post on Google, reply to reviews and see what’s working.",
      ok: google,
      chips: [{ label: "Connect Google", primary: true, action: { type: "link", href: "/api/integrations/google/connect?go=1" } }],
    },
    {
      key: "site",
      name: "Connect your website",
      why: "So I can publish your blog posts and fixes myself. WordPress, Shopify and Webflow take a minute. No passwords.",
      ok: site,
      chips: [{ label: "Connect my website", primary: true, action: { type: "wp-connect" } }],
    },
    {
      key: "voice",
      name: "Pick how you sound",
      why: "I read your own website and wrote three ways to sound like you. Pick one, so every post sounds like you wrote it.",
      ok: !!s.voice?.pickedAt || !!st.done?.voice,
      chips: [{ label: "Show me the options", primary: true, action: { type: "thread", topic: "voice" } }, ...(s.voice ? [op({ op: "done", step: "voice" }, "Use your closest match")] : [])],
    },
    {
      key: "brand",
      name: "Check your logo, colours and images",
      why: s.brand?.logo || s.brand?.primary
        ? `I took your logo and colours from your website for your posts. Take a look, and choose how your post pictures look.${libraryHint()}`
        : `Give me your logo and colours, and choose how your post pictures look.${libraryHint()}`,
      ok: s.brand?.source === "owner" || !!st.done?.brand,
      chips: [
        { label: "Show me", primary: true, action: { type: "thread", topic: "voice" } },
        ...(s.brand?.logo || s.brand?.primary ? [op({ op: "done", step: "brand" }, "Looks right")] : []),
      ],
    },
    {
      key: "autopilot",
      name: "Choose what I do without asking",
      why: "Decide once what I can post on my own and what waits for your tap. You can change it any time.",
      ok: !!s.autopilot?.at || !!st.done?.autopilot,
      chips: [{ label: "Choose", primary: true, action: { type: "thread", topic: "autopilot" } }, op({ op: "done", step: "autopilot" }, "Ask me before anything goes out")],
    },
  ]
  if (hasGrowth(user)) {
    const anyApp = PROVIDERS.some(providerConfigured)
    out.push({
      key: "social",
      name: "Connect your social accounts",
      why: anyApp
        ? "Facebook, Instagram, LinkedIn or TikTok. Then I post for you on the days that work best."
        : "Posting straight to Facebook, Instagram, LinkedIn and TikTok opens as the platforms approve us. Until then I write each post and you copy it with one tap.",
      ok: accounts.some((a) => a.status === "active"),
      soon: !anyApp,
      chips: [{ label: "Connect", primary: true, action: { type: "thread", topic: "social" } }],
    })
    const t = s.tracking
    const tested = t?.test?.result?.beacon === "yes"
    out.push({
      key: "tracking",
      name: "Count your leads",
      why: t?.on
        ? "Tracking is on. Run a 1-minute test so we know every call, email and form your marketing brings is counted."
        : "So you can see which calls, emails and forms your marketing brought in, and so your ads learn what a customer looks like.",
      ok: !!t?.on && tested,
      chips: [{ label: t?.on ? "Run the test" : "Set it up", primary: true, action: { type: "thread", topic: "tracking" } }],
    })
  }
  return out
}

export async function setupMessages(user: User): Promise<Message[]> {
  const s = await getAgentSettings(user.id)
  const st = s.setup ?? {}
  const all = await steps(user, s)
  const counted = all.filter((x) => !x.soon)
  const done = counted.filter((x) => x.ok).length
  const skipped = new Set(st.skipped ?? [])
  const next = counted.find((x) => !x.ok && !skipped.has(x.key)) ?? counted.find((x) => !x.ok)
  const rows = all.map((x) => ({
    name: x.name,
    status: x.ok ? "Done" : x.soon ? "Opening soon" : skipped.has(x.key) ? "Skipped for now" : x === next ? "Next" : "To do",
    ok: x.ok,
  }))

  if (!next) {
    if (!st.completedAt) await saveAgentSettings(user.id, { setup: { ...st, completedAt: new Date().toISOString() } })
    return [agent([
      { kind: "text", text: "You’re all set.", big: true },
      { kind: "text", text: "Everything’s connected. Want me to plan and write your first week of marketing now?" },
      { kind: "sources", items: rows },
      { kind: "chips", items: [
        { label: "Run my marketing for this week", primary: true, action: { type: "ask", text: "Run my marketing for this week" } },
        op({ op: "dismiss" }, "Not now"),
      ] },
    ], "setup")]
  }

  const n = counted.indexOf(next) + 1
  return [agent([
    { kind: "text", text: `${done} of ${counted.length} done`, big: true },
    { kind: "sources", items: rows },
    { kind: "divider", text: `Step ${n}: ${next.name}` },
    { kind: "text", text: next.why },
    { kind: "chips", items: [...next.chips, op({ op: "skip", step: next.key }, "Skip for now")] },
  ], "setup")]
}

/** Shown on the dashboard until every step is done (or the owner closes it after finishing). */
export async function setupPending(user: User): Promise<boolean> {
  const st = (await getAgentSettings(user.id)).setup
  return !st?.dismissedAt
}

export async function setupOp(user: User, body: { op?: string; step?: string }): Promise<Message[]> {
  const s = await getAgentSettings(user.id)
  const st: SetupState = { ...(s.setup ?? {}) }
  const step = body.step as SetupStepKey | undefined
  if (body.op === "skip" && step) st.skipped = Array.from(new Set([...(st.skipped ?? []), step]))
  if (body.op === "done" && (step === "brand" || step === "voice" || step === "autopilot")) st.done = { ...(st.done ?? {}), [step]: new Date().toISOString() }
  if (body.op === "reset") st.skipped = []
  if (body.op === "dismiss") st.dismissedAt = new Date().toISOString()
  await saveAgentSettings(user.id, { setup: st })
  if (body.op === "dismiss") return [agent([{ kind: "text", text: "Done. Say “run my marketing for this week” whenever you’re ready." }], "setup")]
  return setupMessages(user)
}

/** The brand step mentions the brand library once Drive or Dropbox is on (lib/library). */
function libraryHint(): string {
  const where = [process.env.GOOGLE_PICKER_API_KEY && "Google Drive", process.env.NEXT_PUBLIC_DROPBOX_APP_KEY && "Dropbox"].filter(Boolean)
  return where.length ? ` You can also link your brand book, photos and videos from ${where.join(" or ")}.` : ""
}
