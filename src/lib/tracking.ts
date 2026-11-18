// Growth plan: the agent sets up Google Analytics 4 and the Meta Pixel on the owner's site, plus
// the lead events ads optimise for (phone taps, email taps, form sends), and checks they're there.
//
// How it gets onto the site:
//   • WordPress (plugin 1.3.0+): the plugin prints the tags server-side in <head> ("tracking" route).
//   • Everything else: the Alphaa tag (/tag.js?id=…) loads them. It's pasted once; after that the
//     IDs can change here without anyone touching the site again.
// Both are undoable: turning tracking off here removes it on the next page load.
//
// The IDs are public by design (they're in every page's source), so they're stored as-is.
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { wpCall } from "@/lib/connector/wordpress"
import { safeFetch } from "@/lib/safe-fetch"

export type Tracking = {
  ga4?: string
  pixel?: string
  /** Send generate_lead / Lead events for phone taps, email taps and form sends. */
  events: boolean
  on: boolean
  via?: "wordpress" | "tag"
  installedAt?: string
  /** Last look at the live site. */
  check?: TrackingCheck
  /** The site already loads this ID some other way (its own code or Google Tag Manager), so we don't load a second copy. Events still go through it. */
  skip?: { ga4?: boolean; pixel?: boolean }
  /** Meta Conversions API (lib/tracking-events.ts). token = encryptSecret(access token). */
  capi?: { token: string; pixel: string; testCode?: string; savedAt: string }
  /** The last self-test link handed out (lib/tracking-health.ts). */
  test?: { startedAt: string; exp: number; result?: TestResult }
  /** Last health snapshot, to spot regressions (cron/tracking-health). */
  health?: { at: string; items: { key: string; ok: boolean; label: string }[] }
  /** What got worse on the last recheck, shown once in the thread. */
  regressions?: { at: string; lines: string[] }
  /** Fixes the agent made by itself on the last check, shown in the thread. */
  autoFixed?: { at: string; lines: string[] }
}

/** What the last self-test proved. state: yes = confirmed, no = checked and missing, unknown = couldn't check. */
export type TestResult = {
  at: string
  beacon: "yes" | "no"
  ga4?: { state: "yes" | "no" | "unknown"; why?: string }
  meta?: { state: "yes" | "no" | "unknown"; why?: string }
}

export type EmbedKind = "hubspot" | "typeform" | "calendly" | "jotform" | "wix" | "squarespace"

/** Places on the page a visitor can become a lead, so we know what should be counted. */
export type LeadPoints = {
  phone: number // tel: links
  email: number // mailto: links
  forms: number // plain <form>s with an email, phone or message field
  embeds: EmbedKind[]
}

export type TrackingCheck = {
  at: string
  /** IDs already hard-coded in the site's HTML (installed by someone else). */
  found: { ga4: string[]; pixel: string[]; gtm: string[]; googleAds: string[] }
  /** Our WordPress output or the Alphaa tag is on the page. */
  ours: boolean
  reachable: boolean
  /** IDs inside the site's Google Tag Manager containers (read from gtm.js). */
  inGtm?: { ga4: string[]; pixel: string[]; googleAds: string[]; read: string[] }
  /** IDs the site loads by itself (its own HTML minus our output, plus GTM). */
  elsewhere?: { ga4: string[]; pixel: string[] }
  /** IDs the site loads twice by itself (in the HTML and again in GTM). */
  twice?: { ga4: string[]; pixel: string[] }
  leads?: LeadPoints
}

export const GA4_RE = /^G-[A-Z0-9]{4,15}$/
export const PIXEL_RE = /^\d{10,20}$/
export const WP_TRACKING_VERSION = "1.3.0"
/** Plugin version that sends event beacons, runs the self-test and reads form tools (Tag Manager-loaded tags too). */
export const WP_BEACON_VERSION = "1.4.0"

export function cleanGa4(v: unknown): string | undefined {
  const s = String(v ?? "").trim().toUpperCase()
  return GA4_RE.test(s) ? s : undefined
}
export function cleanPixel(v: unknown): string | undefined {
  const s = String(v ?? "").replace(/\s+/g, "")
  return PIXEL_RE.test(s) ? s : undefined
}

const uniq = (a: string[]) => Array.from(new Set(a))

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
// GA4 IDs have at least one digit; this keeps words like "G-FORCE" out.
const GA4_IN_TEXT = /\b(G-(?=[A-Z0-9]*\d)[A-Z0-9]{6,15})\b/g
const ADS_IN_TEXT = /\b(AW-\d{6,14})\b/g
// fbq('init','123'), also escaped inside GTM's JS (fbq(\'init\', ...)), the noscript image, and GTM's Meta template.
const PIXEL_IN_TEXT = [
  /fbq\(\s*\\?['"]init\\?['"]\s*,\s*\\?['"](\d{10,20})\\?['"]/g,
  /facebook\.com\/tr\/?\?id=(\d{10,20})/g,
  /"vtp_pixelIds?":"(\d{10,20})"/g,
]
const ids = (text: string, re: RegExp) => uniq([...text.matchAll(re)].map((m) => m[1]))
const pixelIds = (text: string) => uniq(PIXEL_IN_TEXT.flatMap((re) => ids(text, re)))

/** Read one GTM container's JS and list the GA4 / Google Ads / Meta Pixel IDs inside it. */
async function readGtm(id: string): Promise<{ ga4: string[]; pixel: string[]; googleAds: string[] } | null> {
  try {
    const res = await safeFetch(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8_000) })
    if (!res.ok) return null
    const js = (await res.text()).slice(0, 3_000_000)
    return { ga4: ids(js, GA4_IN_TEXT), pixel: pixelIds(js), googleAds: ids(js, ADS_IN_TEXT) }
  } catch {
    return null
  }
}

/** Phone and email links, contact forms and the form tools we recognise. Counts only, never the numbers or addresses. */
export function leadPoints(html: string): LeadPoints {
  const phone = (html.match(/href\s*=\s*["']\s*tel:/gi) ?? []).length
  const email = (html.match(/href\s*=\s*["']\s*mailto:/gi) ?? []).length
  let forms = 0
  for (const m of html.matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
    if (/type\s*=\s*["']?(email|tel)\b|<textarea\b/i.test(m[0])) forms++
  }
  const embeds: EmbedKind[] = []
  if (/js(-[a-z0-9]+)?\.hsforms\.net|hbspt\.forms\.create|hs-form-frame|share\.hsforms\.com/i.test(html)) embeds.push("hubspot")
  if (/embed\.typeform\.com|data-tf-(widget|popup|live|slider)|\.typeform\.com\/to\//i.test(html)) embeds.push("typeform")
  if (/assets\.calendly\.com|calendly-inline-widget|calendly\.com\/[a-z0-9_-]+/i.test(html)) embeds.push("calendly")
  if (/jotform\.(com|me)\/|jotfor\.ms\//i.test(html)) embeds.push("jotform")
  if (/static\.wixstatic\.com|wix-bolt|_wixCIDX|\.wixsite\.com/i.test(html) && /wixforms|wix-forms|wix-form|form-app-wix/i.test(html)) embeds.push("wix")
  if (/sqs-block-form|squarespace-form|"formSubmitButtonText"/i.test(html)) embeds.push("squarespace")
  return { phone, email, forms, embeds }
}

/** user.websiteUrl is stored without a protocol (CLAUDE.md §10.21). */
export const siteHref = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u.replace(/^\/+/, "")}`)

/** Read the site's raw HTML (and its GTM containers) and list the tracking already on it. */
export async function inspectSite(siteUrl: string, userId: string): Promise<TrackingCheck> {
  const at = new Date().toISOString()
  const empty = { ga4: [], pixel: [], gtm: [], googleAds: [] }
  let html = ""
  try {
    const res = await safeFetch(siteHref(siteUrl), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return { at, found: empty, ours: false, reachable: false }
    html = (await res.text()).slice(0, 2_000_000)
  } catch {
    return { at, found: empty, ours: false, reachable: false }
  }
  const found = {
    ga4: ids(html, GA4_IN_TEXT),
    pixel: pixelIds(html),
    gtm: ids(html, /\b(GTM-[A-Z0-9]{4,10})\b/g),
    googleAds: ids(html, ADS_IN_TEXT),
  }
  // What the site loads by itself: its HTML without our own WordPress output, plus GTM.
  const theirs = html.replace(/<script\b[^>]*data-alphaa-tracking[^>]*>[\s\S]*?<\/script>/gi, "")
  const gtmRead = await Promise.all(found.gtm.slice(0, 3).map(async (id) => [id, await readGtm(id)] as const))
  const inGtm = { ga4: [] as string[], pixel: [] as string[], googleAds: [] as string[], read: [] as string[] }
  for (const [id, r] of gtmRead) {
    if (!r) continue
    inGtm.read.push(id)
    inGtm.ga4.push(...r.ga4); inGtm.pixel.push(...r.pixel); inGtm.googleAds.push(...r.googleAds)
  }
  inGtm.ga4 = uniq(inGtm.ga4); inGtm.pixel = uniq(inGtm.pixel); inGtm.googleAds = uniq(inGtm.googleAds)
  const htmlTheirs = { ga4: ids(theirs, GA4_IN_TEXT), pixel: pixelIds(theirs) }
  return {
    at,
    reachable: true,
    ours: html.includes(`tag.js?id=${userId}`) || html.includes("data-alphaa-tracking"),
    found,
    inGtm,
    elsewhere: { ga4: uniq([...htmlTheirs.ga4, ...inGtm.ga4]), pixel: uniq([...htmlTheirs.pixel, ...inGtm.pixel]) },
    twice: { ga4: htmlTheirs.ga4.filter((x) => inGtm.ga4.includes(x)), pixel: htmlTheirs.pixel.filter((x) => inGtm.pixel.includes(x)) },
    leads: leadPoints(html),
  }
}

/** IDs the site already loads by itself (older checks without `elsewhere` fall back to the raw HTML when we weren't on it). */
export function loadedElsewhere(c: TrackingCheck | undefined): { ga4: string[]; pixel: string[] } {
  if (!c?.reachable) return { ga4: [], pixel: [] }
  if (c.elsewhere) return c.elsewhere
  return c.ours ? { ga4: [], pixel: [] } : { ga4: c.found.ga4, pixel: c.found.pixel }
}

/** Don't load a second copy of an ID the site already loads. */
export function skipFor(input: { ga4?: string; pixel?: string }, c: TrackingCheck | undefined): { ga4?: boolean; pixel?: boolean } {
  const e = loadedElsewhere(c)
  return { ga4: !!input.ga4 && e.ga4.includes(input.ga4), pixel: !!input.pixel && e.pixel.includes(input.pixel) }
}

export const versionAtLeast = (v: string, min: string) => {
  const a = v.split(".").map(Number), b = min.split(".").map(Number)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0)
  return true
}

export type InstallResult =
  | { ok: true; via: "wordpress" | "tag"; changeId?: string; needsTag: boolean }
  | { ok: false; error: string }

/**
 * Save the IDs and put them on the site. On WordPress the plugin prints them; elsewhere the
 * Alphaa tag serves them (needsTag = the tag isn't on the site yet, so someone pastes it once).
 */
export async function installTracking(userId: string, input: { ga4?: string; pixel?: string; events: boolean }): Promise<InstallResult> {
  const s = await getAgentSettings(userId)
  const siteUrl = s.wp?.siteUrl ?? s.site?.siteUrl ?? (await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true } }))?.websiteUrl ?? null
  let via: "wordpress" | "tag" = "tag"
  let changeId: string | undefined
  // Look first: an ID the site already loads on its own isn't printed a second time.
  const before = siteUrl ? await inspectSite(siteUrl, userId) : undefined
  const skip = skipFor(input, before)
  if (s.wp && versionAtLeast(s.wp.version || "0", WP_TRACKING_VERSION)) {
    try {
      const r = await wpCall<{ ok: boolean; id: string; url: string }>(userId, s.wp, "tracking", {
        ga4: skip.ga4 ? "" : input.ga4 ?? "",
        pixel: skip.pixel ? "" : input.pixel ?? "",
        events: input.events,
      })
      via = "wordpress"
      changeId = r.id
    } catch (err) {
      return { ok: false, error: `Your website didn’t accept it: ${err instanceof Error ? err.message : err}. Nothing changed.` }
    }
  }
  const check = siteUrl && via === "wordpress" ? await inspectSite(siteUrl, userId) : before
  // Keep the Conversions API token, health history and the last test across re-installs.
  const keep = s.tracking ? { capi: s.tracking.capi?.pixel === input.pixel ? s.tracking.capi : undefined, health: s.tracking.health, test: s.tracking.test } : {}
  const tracking: Tracking = { ...keep, ...input, on: true, via, installedAt: new Date().toISOString(), check, skip }
  await saveAgentSettings(userId, { tracking })
  const what = [input.ga4 && "Google Analytics", input.pixel && "the Meta Pixel"].filter(Boolean).join(" and ")
  await db.mockActivity.create({
    data: {
      userId,
      type: "site_change",
      title: `Set up ${what || "tracking"} on your website`,
      metadata: { op: "tracking", changeId: changeId ?? null, via, ga4: input.ga4 ?? null, pixel: input.pixel ?? null, events: input.events, undone: false },
    },
  })
  return { ok: true, via, changeId, needsTag: via === "tag" && !check?.ours }
}

/** Turn it off (the WordPress output goes too). */
export async function removeTracking(userId: string): Promise<void> {
  const s = await getAgentSettings(userId)
  if (s.tracking?.via === "wordpress" && s.wp) {
    await wpCall(userId, s.wp, "tracking", { ga4: "", pixel: "", events: false }).catch(() => null)
  }
  if (s.tracking) await saveAgentSettings(userId, { tracking: { ...s.tracking, on: false } })
  await db.mockActivity.create({ data: { userId, type: "site_change", title: "Turned off the tracking I set up", metadata: { op: "tracking", undone: true } } })
}

/**
 * What the Alphaa tag should do for this account (null = nothing). ga4 / pixel = load these;
 * an ID the site already loads itself is left out (skip) but still gets the lead events
 * (g / m say Google / Meta is on the page either way).
 */
export function tagTracking(t: Tracking | undefined): { ga4?: string; pixel?: string; events: boolean; g?: 1; m?: 1 } | null {
  if (!t?.on || t.via !== "tag" || (!t.ga4 && !t.pixel)) return null
  return {
    ...(t.ga4 && !t.skip?.ga4 ? { ga4: t.ga4 } : {}),
    ...(t.pixel && !t.skip?.pixel ? { pixel: t.pixel } : {}),
    events: t.events,
    ...(t.ga4 ? { g: 1 as const } : {}),
    ...(t.pixel ? { m: 1 as const } : {}),
  }
}

/**
 * Browser code for the Alphaa tag: loads GA4 and/or the Pixel unless the page already has them,
 * and sends lead events. Skips the Pixel when the visitor's browser sends Global Privacy Control.
 * The site's own cookie banner / Google Consent Mode still governs GA4.
 *
 * Each lead event also sends a tiny beacon to /api/tag/event (the kind of lead and an event id,
 * nothing about the visitor) so Alphaa can see events fire, and so the Meta Conversions API can
 * send the same event server-side with the same event id (Meta dedupes the pair).
 * ?alphaa_test=<token> on any page fires one test event under its own name (GA4 alphaa_test, Pixel
 * custom AlphaaTest), never a lead or conversion (lib/tracking-health.ts).
 * Needs id and origin from the enclosing tag.js closure.
 */
export const TAG_TRACKING_JS = `
    var track = function (t) {
      if (!t || window.__alphaaTracking) return;
      window.__alphaaTracking = 1;
      var has = function (needle) { var s = document.getElementsByTagName('script'); for (var i = 0; i < s.length; i++) { if ((s[i].src || '').indexOf(needle) > -1 || (s[i].text || '').indexOf(needle) > -1) return true; } return false; };
      var gpc = navigator.globalPrivacyControl === true;
      window.dataLayer = window.dataLayer || [];
      if (t.ga4 || t.g) { if (!window.gtag) window.gtag = function () { window.dataLayer.push(arguments); }; }
      if (t.ga4) {
        if (!has('gtag/js?id=' + t.ga4)) {
          var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + t.ga4; document.head.appendChild(g);
          window.gtag('js', new Date()); window.gtag('config', t.ga4);
        }
      }
      if (t.pixel && !gpc && !window.fbq) {
        !function(f,b,e,v,n,t2,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t2=b.createElement(e);t2.async=!0;t2.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t2,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', t.pixel); window.fbq('track', 'PageView');
      }
      var beacon = function (k, eid, tok) {
        try {
          var b = JSON.stringify({ id: id, k: k, eid: eid, u: location.origin + location.pathname, gpc: gpc ? 1 : 0, t: tok || undefined });
          if (navigator.sendBeacon) navigator.sendBeacon(origin + '/api/tag/event', b);
          else fetch(origin + '/api/tag/event', { method: 'POST', body: b, keepalive: true, mode: 'no-cors' });
        } catch (e) {}
      };
      var send = function (method) {
        var eid = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var lead = method === 'form' || method === 'hubspot' || method === 'typeform' || method === 'calendly';
        try { if (window.gtag && (t.ga4 || t.g)) window.gtag('event', 'generate_lead', { method: method }); } catch (e) {}
        try { if (window.fbq && (t.pixel || t.m) && !gpc) window.fbq('track', lead ? 'Lead' : 'Contact', { method: method }, { eventID: eid }); } catch (e) {}
        beacon(method, eid);
      };
      // Self-test: its own event names (GA4 alphaa_test, Pixel custom AlphaaTest), so it never counts as a lead or conversion.
      var tok = (location.search.match(/[?&]alphaa_test=([A-Za-z0-9._-]{8,80})/) || [])[1];
      if (tok) setTimeout(function () {
        var eid = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        try { if (window.gtag && (t.ga4 || t.g)) window.gtag('event', 'alphaa_test', { debug_mode: true }); } catch (e) {}
        try { if (window.fbq && (t.pixel || t.m) && !gpc) window.fbq('trackCustom', 'AlphaaTest', {}, { eventID: eid }); } catch (e) {}
        beacon('test', eid, tok);
      }, 2500);
      if (!t.events) return;
      document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var h = (a.getAttribute('href') || '').toLowerCase();
        if (h.indexOf('tel:') === 0) send('phone'); else if (h.indexOf('mailto:') === 0) send('email');
      }, true);
      document.addEventListener('submit', function (e) {
        var f = e.target; if (!f || !f.querySelector) return;
        if (f.querySelector('input[type=email],input[type=tel],textarea')) send('form');
      }, true);
      // Form tools that live in their own frame tell the page when someone sends one.
      window.addEventListener('message', function (e) {
        var o = e.origin || '', d = e.data;
        try { if (typeof d === 'string' && d.charAt(0) === '{') d = JSON.parse(d); } catch (x) {}
        if (!d) return;
        if (d.type === 'hsFormCallback' && d.eventName === 'onFormSubmitted') send('hubspot');
        else if (/calendly\\.com$/.test(o) && d.event === 'calendly.event_scheduled') send('calendly');
        else if (/typeform\\.com$/.test(o) && (d.type === 'form-submit' || d.event === 'form-submit')) send('typeform');
      });
    };`
