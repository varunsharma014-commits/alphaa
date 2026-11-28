// The central gate for team members (lib/auth.ts runs it on every request a member makes).
// Pure: method + path in, allowed or not out. scripts/test-team.ts checks the whole table.
//
// - GET/HEAD are reads: every role may, except the GETs below that connect accounts or hand out
//   a token (OAuth starts and callbacks, the Drive picker token).
// - Every other method must be listed. "self" = the route checks the role itself with
//   requireCan() because the action depends on the body (op), e.g. /api/agent/social approve vs
//   disconnect. An unlisted mutating route is REFUSED for members (default deny), so a route
//   added later is safe until someone classifies it here.
// - The owner never goes through this table (no members = exactly the old behaviour).

import { can, type Action, type Role } from "./permissions"

export type Policy = Action | "self"
type Entry = { methods: string[]; re: RegExp; policy: Policy; path: string }

const seg = "[^/]+"
function entry(methods: string, path: string, policy: Policy): Entry {
  const re = new RegExp(`^${path.replace(/\/\*$/, "(?:/.*)?").replace(/:[a-z]+/gi, seg)}/?$`)
  return { methods: methods.split(" "), re, policy, path }
}

// Mutating routes (POST/PUT/PATCH/DELETE). Keep in path order; one line per route.
export const ROUTE_POLICY: Entry[] = [
  entry("POST", "/api/agent/adplan", "create"), // writes an ad plan; nothing spends
  entry("POST", "/api/agent/ads", "self"), // plan = create; pick/disconnect = connect; the rest = ads
  entry("POST", "/api/agent/approve", "self"), // publish, or approve for a publisher (lib/team/review.ts)
  entry("POST", "/api/agent/autopilot", "self"), // auto_on/auto_renew = autopilot_consent; budget = ads; else autopilot
  entry("POST DELETE", "/api/agent/bing", "connect"),
  entry("POST", "/api/agent/brief", "create"),
  entry("POST", "/api/agent/canva", "self"), // disconnect = connect; the rest = create
  entry("POST", "/api/agent/chat", "create"),
  entry("POST", "/api/agent/checks", "create"),
  entry("POST", "/api/agent/city", "settings"),
  entry("POST", "/api/agent/draft", "create"),
  entry("POST", "/api/agent/email", "self"), // send/stop = publish; import/address/clear = settings; else create
  entry("POST", "/api/agent/email/upload", "settings"), // a customer list import (consent declaration)
  entry("POST", "/api/agent/guardrails", "settings"),
  entry("POST", "/api/agent/handoff", "publish"), // emails a change to the web person
  entry("POST", "/api/agent/insights", "create"),
  entry("POST", "/api/agent/library", "self"), // drive-disconnect = connect; remove/bb-unapply = settings; else create
  entry("POST DELETE", "/api/agent/locations", "settings"),
  entry("POST", "/api/agent/metaads", "self"), // plan = create; pick/disconnect = connect; the rest = ads
  entry("POST", "/api/agent/niche", "create"),
  entry("POST", "/api/agent/photos", "create"),
  entry("POST", "/api/agent/questions", "create"), // ask the tracked questions now
  entry("PUT", "/api/agent/questions", "settings"), // change which questions I track
  entry("POST", "/api/agent/repurpose", "create"), // drafts only; everything waits in the queues
  entry("POST", "/api/agent/review-request", "publish"), // sends a customer an email or text
  entry("POST", "/api/agent/settings", "settings"),
  entry("POST", "/api/agent/setup", "settings"),
  entry("POST", "/api/agent/share", "publish"), // a public win page
  entry("POST", "/api/agent/site-check", "create"),
  entry("POST", "/api/agent/social", "self"), // approve/post_now/unschedule/delete = publish; disconnect = connect
  entry("POST", "/api/agent/tracking", "self"), // check/test/verify = create; the rest = connect
  entry("POST", "/api/agent/voice", "settings"), // voice, brand kit and image style
  entry("POST", "/api/agent/week", "create"), // Alphaa's own work: Autopilot applies, whoever pressed it
  entry("POST", "/api/competitors", "create"),
  entry("POST", "/api/competitors/discover", "create"),
  entry("POST", "/api/competitors/:id/win-gap", "create"),
  entry("PUT DELETE", "/api/competitors/:id", "settings"),
  entry("POST", "/api/concierge", "create"), // retired, 410
  entry("POST", "/api/connect/disconnect", "connect"),
  entry("POST", "/api/connect/visit", "create"), // visit beacon
  entry("POST", "/api/connect/wp/hello", "create"), // plugin handshake (key-signed)
  entry("POST", "/api/connect/wp/push", "publish"),
  entry("POST", "/api/connect/wp/undo", "publish"),
  entry("POST", "/api/content-gaps", "create"),
  entry("POST", "/api/crawl", "create"),
  entry("POST", "/api/credits", "billing"),
  entry("POST", "/api/dashboard/scan", "create"),
  entry("POST", "/api/gbp/generate", "create"),
  entry("POST", "/api/gbp/generate-month", "create"),
  entry("POST", "/api/gbp/posts/:id/publish", "publish"),
  entry("PUT DELETE", "/api/gbp/posts/:id", "create"), // edit or delete a draft
  entry("POST", "/api/gbp/reviews/:id/reply", "self"), // generate = create; post = publish (reviewer: approve)
  entry("POST DELETE", "/api/integrations/google/disconnect", "connect"),
  entry("POST", "/api/integrations/google/save-properties", "connect"),
  entry("POST", "/api/integrations/sync", "create"),
  entry("POST", "/api/onboarding/analyze-website", "settings"),
  entry("POST", "/api/sandbox/ask", "create"),
  entry("POST", "/api/sandbox/api_sandbox/ask", "create"),
  entry("POST", "/api/scan/claim", "settings"),
  entry("POST", "/api/scan/*", "create"), // the public scan (no brand)
  entry("POST", "/api/schema/generate", "create"),
  entry("POST DELETE", "/api/sites", "create"), // the login's OWN brands only (realAuth)
  entry("POST", "/api/sites/switch", "create"), // checks ownership or membership itself
  entry("POST", "/api/stripe/checkout", "billing"),
  entry("POST", "/api/stripe/credits", "billing"),
  entry("POST", "/api/stripe/portal", "billing"),
  entry("POST", "/api/tag/event", "create"), // public beacon
  entry("POST", "/api/team", "self"), // invite/role/remove = team; briefing (own opt-in) = view
  entry("POST", "/api/team/accept", "create"), // checks the signed invite + verified email itself
  entry("POST", "/api/unsubscribe", "create"),
  entry("PATCH", "/api/user/onboarding-complete", "settings"),
  entry("POST", "/api/user/onboarding-from-scan", "settings"),
  entry("PATCH", "/api/user/onboarding-progress", "settings"),
  entry("POST", "/api/webhooks/*", "create"), // signature-verified, no session
  entry("POST", "/api/workspace/ad-report", "ads"), // shareable ad report links + the monthly report email
  entry("POST", "/api/workspace/ad-rules", "self"), // check (dry run) = create; save/delete/toggle/undo = ads
  entry("POST", "/api/workspace/approve-plan", "publish"),
  entry("POST", "/api/workspace/calendar", "self"), // move = publish; tz = settings
  entry("POST", "/api/workspace/clusters", "create"), // rebuild the topic plan
  entry("POST", "/api/workspace/competitor", "create"),
  entry("PUT", "/api/workspace/drafts/:id", "self"), // create; a non-publisher's edit takes it off the schedule
  entry("POST", "/api/workspace/drafts/:id/revisions/:id", "create"), // restore a version (a draft edit)
  entry("PUT", "/api/workspace/drafts/:id/onpage", "create"), // the draft's summary (excerpt)
  entry("POST", "/api/workspace/hold", "self"), // stop = review; undo = publish
  entry("POST", "/api/workspace/make", "create"),
  entry("POST", "/api/workspace/originality", "create"), // check a draft / rewrite flagged lines (an AI version)
  entry("POST", "/api/workspace/promote", "ads"), // promote a post on Meta / LinkedIn (spends)
  entry("POST", "/api/workspace/refresh", "self"), // draft/links/get = create; publish/schedule = publish
  entry("POST", "/api/workspace/restyle", "create"),
  entry("POST", "/api/workspace/roas", "self"), // won/unwon (sales data) = create; uploads = ads
  entry("POST", "/api/workspace/schedule", "self"), // publish, approve or submit by role
  entry("POST", "/api/workspace/site-post", "self"), // same
  entry("POST", "/api/workspace/vitals", "create"), // run the Core Web Vitals + structured data check
  entry("POST", "/api/workspace/sizes", "create"), // draws a post's picture in another size (preview)
]

// GETs that aren't plain reads: they start a connection, finish one or hand out an access token.
export const GET_POLICY: Entry[] = [
  entry("GET", "/api/canva/connect", "connect"),
  entry("GET", "/api/canva/callback", "connect"),
  entry("GET", "/api/connect/shopify/start", "connect"),
  entry("GET", "/api/connect/shopify/callback", "connect"),
  entry("GET", "/api/connect/webflow/start", "connect"),
  entry("GET", "/api/connect/webflow/callback", "connect"),
  entry("GET", "/api/connect/webflow/finish", "connect"),
  entry("GET", "/api/connect/wix/start", "connect"),
  entry("GET", "/api/connect/wix/callback", "connect"),
  entry("GET", "/api/gads/connect", "connect"),
  entry("GET", "/api/gads/callback", "connect"),
  entry("GET", "/api/integrations/google/connect", "connect"),
  entry("GET", "/api/integrations/google/callback", "connect"),
  entry("GET", "/api/linkedin-ads/connect", "connect"),
  entry("GET", "/api/linkedin-ads/callback", "connect"),
  entry("GET", "/api/library/drive/connect", "connect"),
  entry("GET", "/api/library/drive/callback", "connect"),
  entry("GET", "/api/library/drive/token", "connect"),
  entry("GET", "/api/social/connect/:provider", "connect"),
  entry("GET", "/api/social/callback/:provider", "connect"),
]

const READ = new Set(["GET", "HEAD", "OPTIONS"])

export function routePolicy(method: string, path: string): Policy | null {
  const m = method.toUpperCase()
  const p = path.split("?")[0].replace(/\/+$/, "") || "/"
  const table = READ.has(m) ? GET_POLICY : ROUTE_POLICY
  for (const e of table) if ((e.methods.includes(m) || (m === "HEAD" && e.methods.includes("GET"))) && e.re.test(p)) return e.policy
  return READ.has(m) ? "view" : null
}

/**
 * May a member in this role make this request at all? "self" passes here (the route checks).
 * An unknown request (no route header, unlisted mutating route, unknown role) is refused.
 */
export function memberRequestAllowed(role: Role, method: string | null | undefined, path: string | null | undefined): { ok: boolean; policy: Policy | null } {
  if (!method || !path) return { ok: false, policy: null }
  const policy = routePolicy(method, path)
  if (!policy) return { ok: false, policy: null }
  if (policy === "self") return { ok: can(role, "view"), policy }
  return { ok: can(role, policy), policy }
}
