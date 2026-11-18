// Growth: tracking that checks and fixes itself.
//
//   • refreshTracking(): reads the live site (HTML + its Google Tag Manager containers), fixes
//     what it safely can on its own (drops our copy of an ID the site already loads, loads it again
//     if the site stopped, re-prints the WordPress output if it went missing), and saves a health
//     snapshot. The daily cron (/api/cron/tracking-health) calls it and notes what got worse.
//   • healthItems(): the plain-English list in the "Tracking & Ads" thread.
//   • startTest() / verifyTest(): a link to the owner's own site with ?alphaa_test=<token>; the tag
//     fires one test lead, beacons us, and we confirm (a) the beacon, (b) GA4 via the Data API
//     realtime report, (c) Meta via the Conversions API answer.
//
// TODO(google-ads): import GA4 generate_lead as a Google Ads conversion once we have Google Ads
// API access (developer token + the owner's Ads account). Not built yet on purpose.
import { google } from "googleapis"
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings, type AgentSettings } from "@/lib/agent/settings"
import { wpCall } from "@/lib/connector/wordpress"
import { getAuthenticatedClient } from "@/lib/google"
import {
  inspectSite, loadedElsewhere, siteHref, skipFor, versionAtLeast, WP_BEACON_VERSION, WP_TRACKING_VERSION,
  type EmbedKind, type TestResult, type Tracking, type TrackingCheck,
} from "@/lib/tracking"
import { eventDays, makeTestToken, sumCounts, testSince, type EventDay } from "@/lib/tracking-events"

export const siteUrlOf = (s: AgentSettings, user: Pick<User, "websiteUrl">) => s.wp?.siteUrl ?? s.site?.siteUrl ?? user.websiteUrl ?? null

const wpCan = (s: AgentSettings, min: string) => !!s.wp && versionAtLeast(s.wp.version || "0", min)
/** Our copy reports events and runs the self-test (the tag always does; the plugin from 1.4.0). */
export const beaconsOn = (s: AgentSettings) => s.tracking?.via === "tag" || wpCan(s, WP_BEACON_VERSION)

// ── Check + self-fix ──────────────────────────────────────────────────────────────────────────

export type Refresh = { check: TrackingCheck | null; fixed: string[]; tracking?: Tracking }

/** Look at the live site, fix what's safe to fix, save the result. */
export async function refreshTracking(user: Pick<User, "id" | "websiteUrl">): Promise<Refresh> {
  const s = await getAgentSettings(user.id)
  const t = s.tracking
  const siteUrl = siteUrlOf(s, user)
  if (!siteUrl) return { check: null, fixed: [] }
  let check = await inspectSite(siteUrl, user.id)
  if (!t?.on || (!t.ga4 && !t.pixel) || !check.reachable) {
    if (t) await saveAgentSettings(user.id, { tracking: { ...t, check } })
    return { check, fixed: [], tracking: t }
  }

  const fixed: string[] = []
  const was = t.skip ?? {}
  const now = skipFor(t, check)
  const name = { ga4: "Google Analytics", pixel: "the Meta Pixel" } as const
  for (const k of ["ga4", "pixel"] as const) {
    if (now[k] && !was[k]) fixed.push(`Your site already loads ${name[k]} itself, so it was on the page twice. I removed my copy; your leads still go through it.`)
    if (!now[k] && was[k] && t[k]) fixed.push(`Your site stopped loading ${name[k]} itself, so I’m loading it again.`)
  }

  const changed = fixed.length > 0
  const wpMissing = t.via === "wordpress" && !check.ours
  let skip = now
  if (t.via === "wordpress" && (changed || wpMissing)) {
    let pushed = false
    if (s.wp && wpCan(s, WP_TRACKING_VERSION)) {
      try {
        await wpCall(user.id, s.wp, "tracking", { ga4: now.ga4 ? "" : t.ga4 ?? "", pixel: now.pixel ? "" : t.pixel ?? "", events: t.events })
        pushed = true
      } catch {
        // The plugin didn't answer; the health list says so and offers the tag instead.
      }
    }
    if (pushed) {
      check = await inspectSite(siteUrl, user.id)
      if (wpMissing && check.ours) fixed.push("My tracking had gone missing from your website, so I put it back through the WordPress plugin.")
    } else {
      fixed.length = 0
      skip = was
    }
  }
  const tracking: Tracking = {
    ...t,
    check,
    skip,
    ...(fixed.length ? { autoFixed: { at: new Date().toISOString(), lines: fixed } } : {}),
  }
  await saveAgentSettings(user.id, { tracking })
  if (fixed.length) {
    await db.mockActivity.create({ data: { userId: user.id, type: "site_change", title: "Fixed my tracking on your website", metadata: { op: "tracking", fix: "auto", lines: fixed, undone: false } } })
  }
  return { check, fixed, tracking }
}

/** Owner-tapped fixes from the health list. Returns a line for the chat, or an error. */
export async function applyFix(user: Pick<User, "id" | "websiteUrl">, fix: "events" | "install" | "tag"): Promise<{ ok: true; line: string } | { ok: false; error: string }> {
  const s = await getAgentSettings(user.id)
  const t = s.tracking
  if (!t?.on || (!t.ga4 && !t.pixel)) return { ok: false, error: "Set up your tracking first." }
  if (fix === "tag") {
    if (t.via === "wordpress" && s.wp) await wpCall(user.id, s.wp, "tracking", { ga4: "", pixel: "", events: false }).catch(() => null)
    await saveAgentSettings(user.id, { tracking: { ...t, via: "tag" } })
    await db.mockActivity.create({ data: { userId: user.id, type: "site_change", title: "Moved your tracking to the Alphaa tag", metadata: { op: "tracking", fix: "tag", undone: false } } })
    return { ok: true, line: "Done. Your tracking now runs through the Alphaa tag. Paste it once and I can fix things from here without touching the site again." }
  }
  const events = fix === "events" ? true : t.events
  if (t.via === "wordpress" && s.wp) {
    try {
      await wpCall(user.id, s.wp, "tracking", { ga4: t.skip?.ga4 ? "" : t.ga4 ?? "", pixel: t.skip?.pixel ? "" : t.pixel ?? "", events })
    } catch (err) {
      return { ok: false, error: `Your website didn’t accept it: ${err instanceof Error ? err.message : err}. Nothing changed.` }
    }
  }
  await saveAgentSettings(user.id, { tracking: { ...t, events } })
  await db.mockActivity.create({ data: { userId: user.id, type: "site_change", title: fix === "events" ? "Started counting calls, emails and forms" : "Put your tracking back on your website", metadata: { op: "tracking", fix, undone: false } } })
  return { ok: true, line: fix === "events" ? "Done. Phone taps, email taps and form sends now count as leads." : "Done. I put your tracking back on your website." }
}

// ── The health list ───────────────────────────────────────────────────────────────────────────

/** soft = worth knowing but not "broken" (an optional upgrade, or something I can't see). */
export type HealthItem = { key: string; name: string; status: string; ok: boolean; detail?: string; soft?: boolean }

const EMBED_NAME: Record<EmbedKind, string> = { hubspot: "HubSpot form", typeform: "Typeform", calendly: "Calendly booking", jotform: "Jotform form", wix: "Wix form", squarespace: "Squarespace form" }
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export function healthItems(s: AgentSettings, check: TrackingCheck | undefined, days: EventDay[]): HealthItem[] {
  const t = s.tracking
  const out: HealthItem[] = []
  if (!t?.on || (!t.ga4 && !t.pixel)) return out
  if (!check?.reachable) {
    out.push({ key: "site", name: "Your website", status: "I couldn’t open it just now", ok: false, detail: "I’ll try again tomorrow." })
    return out
  }
  const installed = check.ours
  const beacons = beaconsOn(s)
  const counted = installed && t.events
  const c = sumCounts(days.slice(0, 30))

  if (t.via === "tag") out.push({ key: "install", name: "Alphaa tag", status: installed ? "On your site" : "Not on your site yet", ok: installed })
  else out.push({
    key: "install",
    name: "WordPress plugin",
    status: !installed ? "Not printing your tracking" : beacons ? "Printing your tracking" : `Update to ${WP_BEACON_VERSION}`,
    ok: installed && beacons,
    detail: installed && !beacons ? "The new version lets me see your leads arrive and run the test." : undefined,
  })

  const twice = check.twice ?? { ga4: [], pixel: [] }
  const elsewhere = loadedElsewhere(check)
  const tagLine = (k: "ga4" | "pixel", label: string) => {
    const id = t[k]
    if (!id) return
    if (twice[k].includes(id)) {
      out.push({ key: k, name: label, status: "Loaded twice by your site", ok: false, detail: "It’s in your page code and again in Google Tag Manager, so visits count double. Remove one of them (I can’t change either)." })
    } else if (t.skip?.[k] && elsewhere[k].includes(id)) {
      out.push({ key: k, name: label, status: "On (your site loads it)", ok: true, detail: `${id}. I don’t add a second copy.` })
    } else {
      out.push({ key: k, name: label, status: installed ? "On" : "Waiting for the tag", ok: installed, detail: id })
    }
  }
  tagLine("ga4", "Google Analytics")
  tagLine("pixel", "Meta Pixel")
  const strayGa = elsewhere.ga4.filter((x) => x !== t.ga4)
  if (t.ga4 && strayGa.length) out.push({ key: "ga4-other", name: "Another Google Analytics", status: "Also on your site", ok: true, detail: `${strayGa.join(", ")} gets your visits too. That’s fine if someone else uses it.` })

  const leads = check.leads
  const seen = (n: number | undefined) => (n ? ` · ${n} in the last 30 days` : "")
  const leadLine = (key: string, name: string, present: boolean, n: number | undefined, canCount = true) => {
    if (!present) return
    if (!t.events) out.push({ key, name, status: "Not counted", ok: false, detail: "Lead counting is off." })
    else if (!canCount) out.push({ key, name, status: "Not counted yet", ok: false, detail: `Update the WordPress plugin to ${WP_BEACON_VERSION} and I’ll count it.` })
    else out.push({ key, name, status: counted ? `Counted${seen(n)}` : "Counted once the tag is on", ok: counted })
  }
  if (leads) {
    leadLine("phone", `Phone taps (${plural(leads.phone, "link")})`, leads.phone > 0, c.phone)
    leadLine("email", `Email taps (${plural(leads.email, "link")})`, leads.email > 0, c.email)
    leadLine("form", leads.forms > 1 ? `Contact forms (${leads.forms})` : "Contact form", leads.forms > 0 || leads.embeds.includes("squarespace"), c.form)
    for (const e of leads.embeds) {
      if (e === "squarespace") continue
      if (e === "jotform" || e === "wix") {
        out.push({ key: e, name: EMBED_NAME[e], status: "Can’t confirm from here", ok: false, soft: true, detail: "It runs in its own box I can’t see into. Send yourself one test message, then tap “Check the test” and I’ll tell you if it counted." })
      } else leadLine(e, EMBED_NAME[e], true, c[e], beacons)
    }
    if (!leads.phone && !leads.email && !leads.forms && !leads.embeds.length) {
      out.push({ key: "no-leads", name: "Ways to reach you", status: "None on your homepage", ok: false, detail: "I didn’t find a tap-to-call link, an email link or a form. Add one and people who want to buy have an easy next step." })
    }
  }

  if (t.pixel) {
    const capiDays = days.slice(0, 30).map((d) => d.capi).filter(Boolean) as NonNullable<EventDay["capi"]>[]
    const sent = capiDays.reduce((a, d) => a + d.sent, 0), failed = capiDays.reduce((a, d) => a + d.failed, 0)
    if (!t.capi) out.push({ key: "capi", name: "Meta server-side events", status: "Off", ok: false, soft: true, detail: "Ad blockers and iPhones hide some leads from the Pixel. With a Conversions API token I send each lead to Meta from my server too, and Meta counts it once." })
    else out.push({
      key: "capi",
      name: "Meta server-side events",
      status: failed && !sent ? "Not reaching Meta" : "On",
      ok: !(failed && !sent),
      detail: sent || failed ? `${sent} sent${failed ? `, ${failed} refused` : ""} in the last 30 days${failed && capiDays.find((d) => d.lastError)?.lastError ? `. Meta said: ${capiDays.find((d) => d.lastError)?.lastError}` : ""}` : undefined,
    })
  }

  const r = t.test?.result
  if (r) {
    const when = new Date(r.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    if (t.ga4) out.push({ key: "ga4-test", name: "Google Analytics receiving leads", status: r.ga4?.state === "yes" ? `Yes (tested ${when})` : r.ga4?.state === "no" ? "No" : "Not checked", ok: r.ga4?.state === "yes", detail: r.ga4?.state === "yes" ? undefined : r.ga4?.why })
    if (t.pixel && t.capi) out.push({ key: "meta-test", name: "Meta receiving leads", status: r.meta?.state === "yes" ? `Yes (tested ${when})` : r.meta?.state === "no" ? "No" : "Not checked", ok: r.meta?.state === "yes", detail: r.meta?.state === "yes" ? undefined : r.meta?.why })
  }
  return out
}

/** Snapshot for the cron: which lines are fine. */
export const snapshot = (items: HealthItem[]) => items.map((i) => ({ key: i.key, ok: i.ok, label: i.name }))

/** Lines that were fine last time and aren't now. A missing tag/plugin is reported alone (everything after it follows). */
export function regressions(prev: Tracking["health"], items: HealthItem[]): string[] {
  if (!prev) return []
  const before = new Map(prev.items.map((i) => [i.key, i.ok]))
  const worse = items.filter((i) => i.key !== "site" && !i.soft && before.get(i.key) === true && !i.ok)
  const root = worse.find((i) => i.key === "install")
  return (root ? [root] : worse).map((i) => `${i.name}: ${i.status.toLowerCase()}`)
}

// ── Self-test ─────────────────────────────────────────────────────────────────────────────────

export async function startTest(user: Pick<User, "id" | "websiteUrl">): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  const s = await getAgentSettings(user.id)
  const t = s.tracking
  if (!t?.on) return { ok: false, error: "Set up your tracking first." }
  const siteUrl = siteUrlOf(s, user)
  if (!siteUrl) return { ok: false, error: "I don’t have your website address yet." }
  if (!beaconsOn(s)) return { ok: false, error: `Update the WordPress plugin to ${WP_BEACON_VERSION} first. The older version can’t run the test.` }
  const tok = makeTestToken(user.id)
  if (!tok) return { ok: false, error: "The test isn’t available right now." }
  const u = new URL(siteHref(siteUrl))
  u.searchParams.set("alphaa_test", tok.token)
  await saveAgentSettings(user.id, { tracking: { ...t, test: { startedAt: new Date().toISOString(), exp: tok.exp, result: t.test?.result } } })
  return { ok: true, link: u.toString() }
}

/** GA4 realtime: did the test event (alphaa_test) arrive in the last 30 minutes? */
async function ga4Realtime(userId: string, measurementId: string): Promise<NonNullable<TestResult["ga4"]>> {
  const integ = await db.integration.findUnique({ where: { userId } })
  if (!integ) return { state: "unknown", why: "Connect Google and I can check this myself. Until then: in Google Analytics, open Reports → Realtime and look for alphaa_test." }
  if (!integ.gaPropertyId) return { state: "unknown", why: "Pick your Google Analytics property in Settings → Integrations and I can check this myself. Until then: Reports → Realtime, look for alphaa_test." }
  try {
    const auth = await getAuthenticatedClient(integ)
    // Is the connected property the one on the site?
    const admin = google.analyticsadmin({ version: "v1beta", auth })
    const streams = await admin.properties.dataStreams.list({ parent: `properties/${integ.gaPropertyId}` }).then((r) => r.data.dataStreams ?? []).catch(() => null)
    if (streams && streams.length && !streams.some((d) => d.webStreamData?.measurementId === measurementId)) {
      return { state: "unknown", why: `The Google Analytics property connected to Alphaa (${integ.gaPropertyName ?? integ.gaPropertyId}) isn’t the one on your site (${measurementId}). Pick the right one in Settings → Integrations.` }
    }
    const data = google.analyticsdata({ version: "v1beta", auth })
    const res = await data.properties.runRealtimeReport({
      property: `properties/${integ.gaPropertyId}`,
      requestBody: {
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "alphaa_test" } } },
        minuteRanges: [{ startMinutesAgo: 29, endMinutesAgo: 0 }],
      },
    })
    const n = (res.data.rows ?? []).reduce((a, r) => a + parseInt(r.metricValues?.[0]?.value ?? "0", 10), 0)
    return n > 0
      ? { state: "yes" }
      : { state: "no", why: "Google Analytics hasn’t shown the test yet. It can take a minute or two, so check again shortly. If it still doesn’t arrive: a cookie banner may be blocking Google Analytics until someone accepts, or an ad blocker in your browser stopped it. Try once in a private window and accept cookies." }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/insufficient|scope|permission|403/i.test(msg)) return { state: "unknown", why: "Your Google connection doesn’t include Analytics reports, so I can’t check it myself. In Google Analytics, open Reports → Realtime and look for alphaa_test." }
    console.error("[tracking] GA4 realtime", msg)
    return { state: "unknown", why: "Google Analytics didn’t answer just now. Try the check again in a minute." }
  }
}

export async function verifyTest(user: Pick<User, "id" | "websiteUrl">): Promise<{ result: TestResult; started: boolean }> {
  const s = await getAgentSettings(user.id)
  const t = s.tracking
  const at = new Date().toISOString()
  if (!t?.test) return { started: false, result: { at, beacon: "no" } }
  const hit = testSince(await eventDays(user.id, 2), t.test.startedAt)
  const result: TestResult = { at, beacon: hit ? "yes" : "no" }
  if (t.ga4) result.ga4 = hit ? await ga4Realtime(user.id, t.ga4) : { state: "unknown", why: "The test page didn’t report back, so there’s nothing to look for yet." }
  if (t.pixel) {
    if (!t.capi) result.meta = { state: "unknown", why: "Add a Meta Conversions API token and I can confirm Meta got it. Until then: Events Manager → your pixel → Test events." }
    else if (!hit) result.meta = { state: "unknown", why: "The test page didn’t report back, so nothing was sent to Meta." }
    else if (!hit.capi) result.meta = { state: "unknown", why: "Your browser asked not to be tracked, so I didn’t send it to Meta. Try in a normal window." }
    else if (hit.capi.ok) result.meta = { state: "yes", why: hit.capi.test ? "It’s under Events Manager → Test events." : "It shows in Events Manager as AlphaaTest." }
    else result.meta = { state: "no", why: hit.capi.error ? `Meta said: ${hit.capi.error}` : "Meta didn’t accept the event." }
  }
  await saveAgentSettings(user.id, { tracking: { ...t, test: { ...t.test, result } } })
  return { started: true, result }
}
