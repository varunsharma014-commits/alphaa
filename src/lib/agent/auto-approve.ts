// "Auto-approve and post": the owner accepts a warning once (components/agent/AutoApproveModal),
// then I publish without asking where their plan allows it. Every accept and every turn-off is
// kept as a MockActivity "autopilot_consent" row (the exact text, its hash, who, when, from where).
import { createHash } from "crypto"
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { realEmail } from "@/lib/sites"
import { hasGrowth, hasPro } from "@/lib/billing"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { PRO_RE } from "@/lib/agent/autopilot"
import { CONSENT_VERSION, consentText, type ConsentOnly, type ConsentScope } from "@/lib/auto-approve-text"

export const CONSENT_TYPE = "autopilot_consent"

function who(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || null
  return { ip, userAgent: (req.headers.get("user-agent") ?? "").slice(0, 400) || null }
}

export const autoApproveOn = (s: { autoApprove?: unknown }) => !!s.autoApprove

/** Settings that publish without asking, as allowed by the plan. */
export function scopeFor(user: User, only?: ConsentOnly): ConsentScope {
  return { pro: PRO_RE.test(user.plan), growth: hasPro(user), only }
}

export async function acceptAutoApprove(user: User, req: Request, only?: ConsentOnly, value?: string): Promise<{ said: string }> {
  const scope = scopeFor(user, only)
  const text = consentText(scope)
  const acceptedAt = new Date().toISOString()
  const row = await db.mockActivity.create({
    data: {
      userId: user.id,
      type: CONSENT_TYPE,
      title: "Accepted auto-approve and post",
      metadata: {
        version: CONSENT_VERSION,
        text,
        textHash: createHash("sha256").update(text).digest("hex"),
        acceptedAt,
        userId: user.id,
        email: realEmail(user.email),
        plan: user.plan,
        scope: only ? `${only}${value ? `:${value}` : ""}` : "all",
        ...who(req),
      },
    },
  })
  const s = await getAgentSettings(user.id)
  const a = s.autopilot ?? {}
  const patch: Parameters<typeof saveAgentSettings>[1] = { autoApprove: { acceptedAt, version: CONSENT_VERSION, consentId: row.id } }
  const next = { ...a, at: acceptedAt }
  if ((!only || only === "posts") && scope.pro) patch.autoPublishPosts = true
  if ((!only || only === "reviews") && scope.growth) next.reviews = only === "reviews" && value === "positive" ? "positive" : "all"
  if ((!only || only === "social") && scope.growth) next.social = "auto"
  if (only === "email" && hasPro(user)) next.email = "auto"
  if (only === "ads" && hasGrowth(user) && next.adBudget) next.ads = "budget"
  patch.autopilot = next
  await saveAgentSettings(user.id, patch)

  if (only === "posts") return { said: "Done. I’ll publish finished Google listing and website posts myself and show each one in “What I’ve done”." }
  if (only === "reviews") return { said: next.reviews === "positive" ? "Done. I’ll post replies to 4 and 5 star reviews myself. Anything lower waits for you." : "Done. I’ll post every review reply myself and show each one in “What I’ve done”." }
  if (only === "email") return { said: "Done. I’ll send your email campaigns myself and show each one in “What I’ve done”." }
  if (only === "ads") return { said: next.ads === "budget" ? "Done. I’ll start and tune campaigns myself, always inside your monthly budget." : "Set your monthly ad budget first, so I know where to stop." }
  if (only === "social") return { said: "Done. I’ll post to your connected social accounts myself and show each one in “What I’ve done”." }
  const parts = [scope.pro && "Google listing and website posts", scope.growth && "social posts", scope.growth && "review replies"].filter(Boolean)
  return { said: `Auto-approve is on. I’ll publish ${parts.join(", ")} myself and show each one in “What I’ve done”. I’ll still ask before anything that spends money.` }
}

/** The wording changed and the owner accepted the new declaration: record it, keep every setting as it is. */
export async function renewAutoApprove(user: User, req: Request): Promise<{ said: string }> {
  const s = await getAgentSettings(user.id)
  if (!s.autoApprove) return acceptAutoApprove(user, req)
  const text = consentText(scopeFor(user))
  const acceptedAt = new Date().toISOString()
  const row = await db.mockActivity.create({
    data: {
      userId: user.id,
      type: CONSENT_TYPE,
      title: "Re-accepted the Autopilot declaration",
      metadata: { version: CONSENT_VERSION, text, textHash: createHash("sha256").update(text).digest("hex"), acceptedAt, userId: user.id, email: realEmail(user.email), plan: user.plan, scope: "renew", previousVersion: s.autoApprove.version, ...who(req) },
    },
  })
  await saveAgentSettings(user.id, { autoApprove: { acceptedAt, version: CONSENT_VERSION, consentId: row.id } })
  return { said: "Thanks. Autopilot stays on with your current settings." }
}

/** Off: everything goes back to waiting for the owner's tap. The revoke is logged too. */
export async function revokeAutoApprove(user: User, req: Request): Promise<{ said: string }> {
  const s = await getAgentSettings(user.id)
  const at = new Date().toISOString()
  await db.mockActivity.create({
    data: {
      userId: user.id,
      type: CONSENT_TYPE,
      title: "Turned off auto-approve and post",
      metadata: { version: s.autoApprove?.version ?? CONSENT_VERSION, revoked: true, revokedAt: at, consentId: s.autoApprove?.consentId ?? null, userId: user.id, email: realEmail(user.email), ...who(req) },
    },
  })
  const a = s.autopilot ?? {}
  await saveAgentSettings(user.id, { autoApprove: undefined, autoPublishPosts: false, autopilot: { ...a, reviews: "ask", social: "ask", at } })
  return { said: "Auto-approve is off. Everything I write waits for your OK again." }
}

/** Choices that publish without asking need the accepted warning first. */
export function needsConsent(key: string, value: string): ConsentOnly | null {
  if (key === "posts" && value === "auto") return "posts"
  if (key === "reviews" && (value === "positive" || value === "all")) return "reviews"
  if (key === "social" && value === "auto") return "social"
  if (key === "email" && value === "auto") return "email"
  if (key === "ads" && value === "budget") return "ads"
  return null
}
