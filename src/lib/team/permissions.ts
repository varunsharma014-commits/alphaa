// Teams and roles (Varun, 2026-11-28): nothing goes live without the right person's OK.
// Pure and client-safe: the server enforces it (lib/team/routes.ts in auth(), requireCan() in
// routes), the UI uses the same table to hide or disable what a role can't do.
//
// owner      the brand's own login. Everything: billing, the Autopilot declaration, team, delete.
// admin      everything except billing, the Autopilot declaration and removing the owner.
// publisher  create, edit, approve and publish/schedule. No billing, Autopilot, team, connections.
// reviewer   create and edit. Approving marks an item "approved, waiting for a publisher";
//            only a publisher, an admin or the owner makes it go live.
// creator    create and edit drafts, send them for review. Can't approve or publish.
//
// Autopilot only covers work Alphaa makes itself. Anything a creator or reviewer sends on goes
// through review, whatever the Autopilot switch says (lib/team/review.ts).

/** MockActivity type for "sent for review" / "approved, waiting for a publisher" (lib/team/review.ts). */
export const TEAM_REVIEW = "team_review"

export const MEMBER_ROLES = ["admin", "publisher", "reviewer", "creator"] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]
export type Role = "owner" | MemberRole

export const ACTIONS = [
  "view", // read anything in the brand (every GET)
  "create", // write and edit drafts, run checks and research, chat, ask the AIs
  "submit", // send a draft on for review
  "review", // approve: marks it ready for a publisher (stop an item that's going out, too)
  "publish", // publish, schedule, move on the calendar, send an email campaign, undo a publish
  "settings", // Your rules: business details, voice, brand rules, locations, questions, setup
  "connect", // connect or disconnect Google, the website, social, Canva, Drive, ad accounts, tracking
  "autopilot", // change what Alphaa does without asking (only once the owner accepted the declaration)
  "autopilot_consent", // accept the Autopilot declaration (legal): owner only
  "ads", // build, launch, pause, tune or budget ads (spends money)
  "billing", // plan, checkout, billing portal, credits, extra brands
  "team", // invite, change roles, remove members
  "delete", // delete the brand
] as const
export type Action = (typeof ACTIONS)[number]

const ALL: Role[] = ["owner", "admin", "publisher", "reviewer", "creator"]
const MATRIX: Record<Action, readonly Role[]> = {
  view: ALL,
  create: ALL,
  submit: ALL,
  review: ["owner", "admin", "publisher", "reviewer"],
  publish: ["owner", "admin", "publisher"],
  settings: ["owner", "admin"],
  connect: ["owner", "admin"],
  autopilot: ["owner", "admin"],
  autopilot_consent: ["owner"],
  ads: ["owner", "admin"],
  billing: ["owner"],
  team: ["owner", "admin"],
  delete: ["owner"],
}

export const isRole = (r: unknown): r is Role => typeof r === "string" && (r === "owner" || (MEMBER_ROLES as readonly string[]).includes(r))
export const isMemberRole = (r: unknown): r is MemberRole => typeof r === "string" && (MEMBER_ROLES as readonly string[]).includes(r)

/** Can this role do this? Unknown roles and unknown actions are always no. */
export function can(actor: { role: Role } | Role | null | undefined, action: Action): boolean {
  const role = typeof actor === "string" ? actor : actor?.role
  if (!isRole(role)) return false
  if (typeof action !== "string" || !Object.prototype.hasOwnProperty.call(MATRIX, action)) return false
  return MATRIX[action].includes(role)
}

/** What happens when someone in this role taps "Approve & publish" or "Schedule". */
export function goLiveMode(role: Role | null | undefined): "publish" | "approve" | "submit" | "none" {
  if (can(role, "publish")) return "publish"
  if (can(role, "review")) return "approve"
  if (can(role, "submit")) return "submit"
  return "none"
}

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", publisher: "Publisher", reviewer: "Reviewer", creator: "Creator" }
export const ROLE_HINT: Record<Role, string> = {
  owner: "Everything, including billing and Autopilot.",
  admin: "Everything except billing and Autopilot consent.",
  publisher: "Writes, approves and publishes.",
  reviewer: "Writes and approves. A publisher puts it live.",
  creator: "Writes drafts and sends them for review.",
}

/** A first name for the audit trail ("Approved by Sam"): name, else the email's first part. */
export const whoName = (a: { name?: string | null; email?: string | null; role?: string } | null | undefined): string =>
  a?.name?.trim().split(/\s+/)[0] || (a?.role === "owner" ? "the owner" : a?.email?.split("@")[0]) || "Someone"

/** " · by Sam" for ledger lines, only when the row says who did it and it wasn't the owner alone. */
export function bySuffix(meta: Record<string, unknown> | null | undefined): string {
  const a = meta?.actor as { name?: string | null; email?: string | null; role?: string } | undefined
  if (!a || typeof a !== "object" || !a.role) return ""
  return ` · by ${whoName(a)}`
}

/** The sentence a route answers with when a role can't do something. */
export function roleMessage(role: Role | null | undefined, action: Action): string {
  const r = isRole(role) ? ROLE_LABEL[role].toLowerCase() : "your"
  switch (action) {
    case "publish": return `As a ${r} you can’t publish this. A publisher, an admin or the owner can.`
    case "review": return "Only reviewers, publishers, admins and the owner can approve."
    case "billing": return "Only the owner can change the plan or billing."
    case "autopilot_consent": return "Only the owner can turn on Autopilot. It’s a legal OK for work to go out without asking."
    case "autopilot": return "Only the owner or an admin can change what I do without asking."
    case "connect": return "Only the owner or an admin can connect or disconnect accounts."
    case "ads": return "Only the owner or an admin can change ads."
    case "team": return "Only the owner or an admin can manage the team."
    case "settings": return "Only the owner or an admin can change these settings."
    case "delete": return "Only the owner can delete this brand."
    default: return `As a ${r} you can’t do that here.`
  }
}
