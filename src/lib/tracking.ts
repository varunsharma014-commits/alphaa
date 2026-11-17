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
}

export type TrackingCheck = {
  at: string
  /** IDs already hard-coded in the site's HTML (installed by someone else). */
  found: { ga4: string[]; pixel: string[]; gtm: string[]; googleAds: string[] }
  /** Our WordPress output or the Alphaa tag is on the page. */
  ours: boolean
  reachable: boolean
}

export const GA4_RE = /^G-[A-Z0-9]{4,15}$/
export const PIXEL_RE = /^\d{10,20}$/
export const WP_TRACKING_VERSION = "1.3.0"

export function cleanGa4(v: unknown): string | undefined {
  const s = String(v ?? "").trim().toUpperCase()
  return GA4_RE.test(s) ? s : undefined
}
export function cleanPixel(v: unknown): string | undefined {
  const s = String(v ?? "").replace(/\s+/g, "")
  return PIXEL_RE.test(s) ? s : undefined
}

const uniq = (a: string[]) => Array.from(new Set(a))

/** Read the site's raw HTML and list the tracking already on it. */
export async function inspectSite(siteUrl: string, userId: string): Promise<TrackingCheck> {
  const at = new Date().toISOString()
  const empty = { ga4: [], pixel: [], gtm: [], googleAds: [] }
  let html = ""
  try {
    const res = await safeFetch(siteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return { at, found: empty, ours: false, reachable: false }
    html = (await res.text()).slice(0, 2_000_000)
  } catch {
    return { at, found: empty, ours: false, reachable: false }
  }
  const pixel = [...html.matchAll(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/g)].map((m) => m[1])
  return {
    at,
    reachable: true,
    ours: html.includes(`tag.js?id=${userId}`) || html.includes("data-alphaa-tracking"),
    found: {
      ga4: uniq([...html.matchAll(/\b(G-[A-Z0-9]{4,15})\b/g)].map((m) => m[1])),
      pixel: uniq(pixel),
      gtm: uniq([...html.matchAll(/\b(GTM-[A-Z0-9]{4,10})\b/g)].map((m) => m[1])),
      googleAds: uniq([...html.matchAll(/\b(AW-\d{6,14})\b/g)].map((m) => m[1])),
    },
  }
}

const versionAtLeast = (v: string, min: string) => {
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
  const own = (id: string | undefined, list: string[] | undefined) => !!id && !!list?.includes(id) && !before?.ours
  if (s.wp && versionAtLeast(s.wp.version || "0", WP_TRACKING_VERSION)) {
    try {
      const r = await wpCall<{ ok: boolean; id: string; url: string }>(userId, s.wp, "tracking", {
        ga4: own(input.ga4, before?.found.ga4) ? "" : input.ga4 ?? "",
        pixel: own(input.pixel, before?.found.pixel) ? "" : input.pixel ?? "",
        events: input.events,
      })
      via = "wordpress"
      changeId = r.id
    } catch (err) {
      return { ok: false, error: `Your website didn’t accept it: ${err instanceof Error ? err.message : err}. Nothing changed.` }
    }
  }
  const check = siteUrl && via === "wordpress" ? await inspectSite(siteUrl, userId) : before
  const tracking: Tracking = { ...input, on: true, via, installedAt: new Date().toISOString(), check }
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

/** What the Alphaa tag should load for this account (null = nothing). */
export function tagTracking(t: Tracking | undefined): { ga4?: string; pixel?: string; events: boolean } | null {
  if (!t?.on || t.via !== "tag" || (!t.ga4 && !t.pixel)) return null
  return { ga4: t.ga4, pixel: t.pixel, events: t.events }
}

/**
 * Browser code for the Alphaa tag: loads GA4 and/or the Pixel unless the page already has them,
 * and sends lead events. Skips the Pixel when the visitor's browser sends Global Privacy Control.
 * The site's own cookie banner / Google Consent Mode still governs GA4.
 */
export const TAG_TRACKING_JS = `
    var track = function (t) {
      if (!t || window.__alphaaTracking) return;
      window.__alphaaTracking = 1;
      var has = function (needle) { var s = document.getElementsByTagName('script'); for (var i = 0; i < s.length; i++) { if ((s[i].src || '').indexOf(needle) > -1 || (s[i].text || '').indexOf(needle) > -1) return true; } return false; };
      var gpc = navigator.globalPrivacyControl === true;
      if (t.ga4) {
        window.dataLayer = window.dataLayer || [];
        if (!window.gtag) window.gtag = function () { window.dataLayer.push(arguments); };
        if (!has('gtag/js?id=' + t.ga4)) {
          var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + t.ga4; document.head.appendChild(g);
          window.gtag('js', new Date()); window.gtag('config', t.ga4);
        }
      }
      if (t.pixel && !gpc && !window.fbq) {
        !function(f,b,e,v,n,t2,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t2=b.createElement(e);t2.async=!0;t2.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t2,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', t.pixel); window.fbq('track', 'PageView');
      }
      if (!t.events) return;
      var send = function (method) {
        try { if (window.gtag && t.ga4) window.gtag('event', 'generate_lead', { method: method }); } catch (e) {}
        try { if (window.fbq && t.pixel) window.fbq('track', method === 'form' ? 'Lead' : 'Contact', { method: method }); } catch (e) {}
      };
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
    };`
