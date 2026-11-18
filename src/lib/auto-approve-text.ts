// The exact words the owner accepts before I publish without asking. Client-safe: the modal
// renders these and the server stores the same text (and its hash) with the consent record.
// Changing any line = bump CONSENT_VERSION.

export const CONSENT_VERSION = "2026-11-18"

export const CONSENT_TITLE = "Let me post without asking?"

/** What turns on, per plan. Ads are never included. */
export type ConsentScope = { pro: boolean; growth: boolean; /** One setting only (the owner tapped that chip). */ only?: "posts" | "reviews" | "social" }
const ONLY: Record<"posts" | "reviews" | "social", string> = { posts: "Google listing posts and website posts", reviews: "replies to your reviews", social: "social posts on your connected accounts" }

export function consentTurnsOn(o: ConsentScope): { on: string[]; later: string | null } {
  if (o.only) return { on: [ONLY[o.only]], later: null }
  const on = [
    ...(o.pro ? ["Google listing posts", "website posts"] : []),
    ...(o.growth ? ["social posts on your connected accounts"] : []),
    "replies to your reviews",
  ]
  const later = !o.pro
    ? "On your Starter plan this covers replies to your reviews. Posting to your Google listing and website without asking comes with Pro, and social posts with Growth."
    : !o.growth
      ? "Social posts without asking come with the Growth plan."
      : null
  return { on, later }
}

const list = (a: string[]) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`)

export function consentIntro(o: ConsentScope): string {
  const { on } = consentTurnsOn(o)
  const s = list(on)
  return `When this is on, I publish ${s} without asking you first. Ads are not included: ads always need your approval of the budget.`
}

export const CONSENT_AI = "I write with AI. AI can get things wrong: a fact, a price, a date, the tone. When this is on, I publish without you checking first."

export const CONSENT_BULLETS = [
  "You’re responsible for everything published on your accounts, including what I post for you.",
  "Check what I post at least once a week in “What I’ve done”. You can edit or delete any post there or on the platform.",
  "Turn this off any time in “What I do without asking”.",
  "Alphaa isn’t liable for losses or claims from automatically published content, as set out in our Terms (Section 8, “Automatic Publishing”, and Section 12, “Limitation of Liability”).",
]

export const CONSENT_CHECKBOX = "I’ve read this and I accept responsibility for automatically published content."

export const CONSENT_MONEY = "I’ll still ask before anything that spends money."

export const CONSENT_CTA = "Turn on auto-approve"

/** The full text as shown, for the consent record. */
export function consentText(o: ConsentScope): string {
  const { later } = consentTurnsOn(o)
  return [CONSENT_TITLE, consentIntro(o), later, CONSENT_AI, ...CONSENT_BULLETS.map((b) => `• ${b}`), CONSENT_MONEY, `[ ] ${CONSENT_CHECKBOX}`, CONSENT_CTA]
    .filter(Boolean)
    .join("\n")
}

/** Browser events: open the modal / tell the page auto-approve changed. */
export const AUTO_APPROVE_OPEN = "alphaa:auto-approve"
export const AUTO_APPROVE_CHANGED = "alphaa:auto-approve-changed"
export type AutoApproveOpenDetail = { key?: "posts" | "reviews" | "social"; value?: string }
export type AutoApproveChangedDetail = { on: boolean; messages?: import("@/lib/agent/types").Message[] }
