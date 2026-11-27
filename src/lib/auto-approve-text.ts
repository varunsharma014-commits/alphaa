// The exact words the owner accepts before I publish without asking. Client-safe: the modal
// renders these and the server stores the same text (and its hash) with the consent record.
// Changing any line = bump CONSENT_VERSION.

export const CONSENT_VERSION = "2026-11-26.1"

/** True when the owner accepted the current wording (an older acceptance re-prompts; nothing else changes). */
export const consentCurrent = (s: { autoApprove?: { version?: string } | null }) => s.autoApprove?.version === CONSENT_VERSION

export const CONSENT_TITLE = "Turn on Autopilot?"

/** What turns on, per plan. Ads are never included. `growth` = Pro features allowed (social posts, review replies: Pro and up since 2026-11-26; the name is kept for stored callers). Starter (AI search only) has nothing that publishes without asking. */
export type ConsentOnly = "posts" | "reviews" | "social" | "email" | "ads"
export type ConsentScope = { pro: boolean; growth: boolean; /** One setting only (the owner tapped that chip). */ only?: ConsentOnly }
const ONLY: Record<ConsentOnly, string> = { posts: "Google listing posts and website posts", reviews: "replies to your reviews", social: "social posts on your connected accounts", email: "email campaigns to your customer list", ads: "starting and tuning ad campaigns inside your monthly budget" }

export function consentTurnsOn(o: ConsentScope): { on: string[]; later: string | null } {
  if (o.only) return { on: [ONLY[o.only]], later: null }
  const on = [
    ...(o.pro ? ["Google listing posts", "website posts"] : []),
    ...(o.growth ? ["social posts on your connected accounts", "replies to your reviews"] : []),
  ]
  const later = !o.pro && !o.growth
    ? "Publishing without asking comes with the Pro plan, along with Google listing posts, review replies and social media."
    : !o.growth
      ? "Social posts without asking come with the Pro plan."
      : null
  return { on, later }
}

const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`)

export function consentIntro(o: ConsentScope): string {
  const { on } = consentTurnsOn(o)
  const s = list(on)
  if (o.only === "ads") return "When this is on, I start and tune ad campaigns without asking you first, never above the monthly budget you set."
  if (o.only === "email") return `When this is on, I send ${s} without asking you first (at most one a week).`
  return `When this is on, I publish ${s} without asking you first. Ads are not included unless you turn them on separately, and never above your budget.`
}

export const CONSENT_AI = "Alphaa is AI and can make mistakes. With Autopilot on, what I write is published without you checking each item first."

/** The declaration the owner ticks (counsel should review the wording). */
export const CONSENT_DECLARATION = [
  "Alphaa uses artificial intelligence. Its output can be inaccurate, incomplete, out of date or inappropriate.",
  "With Autopilot on, content (posts, pages, emails, review replies, listing changes, and ads where enabled) is published on my behalf without my review of each item, within my rules and the stop window of up to 3 days.",
  "I am solely responsible for all content published from my accounts, including its compliance with the law, platform rules, the professional and advertising rules of my industry, and the rights of others.",
  "I will review the facts and claims Alphaa uses about my business and keep them accurate.",
  "I can turn Autopilot off, or stop any item before it goes out, at any time.",
  "This is subject to the Terms of Service, including the limitation of liability and my indemnity.",
]

/** @deprecated kept for older imports; the declaration replaces the bullets. */
export const CONSENT_BULLETS = CONSENT_DECLARATION

export const CONSENT_CHECKBOX = "I have read and agree to this declaration and the Terms of Service."

export const CONSENT_MONEY = "I’ll still ask before spending more than the budget you set."

export const CONSENT_CTA = "Turn on Autopilot"

/** The full text as shown, for the consent record. */
export function consentText(o: ConsentScope): string {
  const { later } = consentTurnsOn(o)
  return [`Declaration version ${CONSENT_VERSION}`, CONSENT_TITLE, consentIntro(o), later, CONSENT_AI, ...CONSENT_DECLARATION.map((b, i) => `(${"i ii iii iv v vi".split(" ")[i] ?? i + 1}) ${b}`), CONSENT_MONEY, `[ ] ${CONSENT_CHECKBOX}`, CONSENT_CTA]
    .filter(Boolean)
    .join("\n")
}

/** Browser events: open the modal / tell the page auto-approve changed. */
export const AUTO_APPROVE_OPEN = "alphaa:auto-approve"
export const AUTO_APPROVE_CHANGED = "alphaa:auto-approve-changed"
export type AutoApproveOpenDetail = { key?: ConsentOnly; value?: string; /** The owner accepted an older wording: ask again, offer to turn it off. */ renew?: boolean }
export type AutoApproveChangedDetail = { on: boolean; messages?: import("@/lib/agent/types").Message[] }
