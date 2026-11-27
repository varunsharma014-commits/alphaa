// The "Tracking & ads" thread (Pro plan and up): what's measured on the owner's site, in plain words.
import { agent, type Block, type Message } from "@/lib/agent/types"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasPro } from "@/lib/billing"
import { type TestResult, type TrackingCheck } from "@/lib/tracking"
import { beaconsOn, healthItems, refreshTracking, type HealthItem } from "@/lib/tracking-health"
import { eventDays } from "@/lib/tracking-events"
import { gaScopeAllowed } from "@/lib/google"
import { WP_BEACON_VERSION } from "@/lib/tracking"
import type { User } from "@prisma/client"

const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"

export function upgradeMessages(): Message[] {
  return [
    agent([
      { kind: "text", text: "Know exactly which marketing brings you customers.", big: true },
      { kind: "text", text: "On the Pro plan I count every call, email and form your website gets, so you can see which marketing brings people in." },
      { kind: "chips", items: [{ label: "See the Pro plan", action: { type: "link", href: "/dashboard/upgrade?plan=pro" }, primary: true }] },
    ], "trk-upgrade"),
  ]
}

function foundLine(c: TrackingCheck): string | null {
  const g = c.inGtm
  const ga4 = Array.from(new Set([...c.found.ga4, ...(g?.ga4 ?? [])]))
  const pixel = Array.from(new Set([...c.found.pixel, ...(g?.pixel ?? [])]))
  const ads = Array.from(new Set([...c.found.googleAds, ...(g?.googleAds ?? [])]))
  const parts = [
    ga4.length ? `Google Analytics (${ga4.join(", ")})` : null,
    pixel.length ? `a Meta Pixel (${pixel.join(", ")})` : null,
    c.found.gtm.length ? `Google Tag Manager (${c.found.gtm.join(", ")})` : null,
    ads.length ? `a Google Ads tag (${ads.join(", ")})` : null,
  ].filter(Boolean)
  return parts.length ? `Your site already has ${parts.join(", ")}.` : null
}

/** "Your homepage has 2 phone links, an email link and a HubSpot form." */
function leadsLine(c: TrackingCheck): string | null {
  const l = c.leads
  if (!l) return null
  const n = (k: number, one: string) => (k ? `${k === 1 ? "a" : k} ${one}${k === 1 ? "" : "s"}` : null)
  const names: Record<string, string> = { hubspot: "a HubSpot form", typeform: "a Typeform", calendly: "Calendly booking", jotform: "a Jotform form", wix: "a Wix form", squarespace: "a Squarespace form" }
  const parts = [n(l.phone, "phone link"), n(l.email, "email link"), n(l.forms, "contact form"), ...l.embeds.filter((e) => !(e === "squarespace" && l.forms)).map((e) => names[e])].filter(Boolean) as string[]
  if (!parts.length) return "I didn’t find a tap-to-call link, an email link or a form on your homepage. I’ll still count them on other pages."
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0]
  return `Your homepage has ${list}. Those are the leads I’ll count.`
}

/** The thread, from saved settings plus a fresh look at the site when `fresh` (or never checked). */
export async function trackingMessages(user: User, opts: { fresh?: boolean } = {}): Promise<Message[]> {
  if (!hasPro(user)) return upgradeMessages()
  const s = await getAgentSettings(user.id)
  const t = s.tracking
  const siteUrl = s.wp?.siteUrl ?? s.site?.siteUrl ?? user.websiteUrl
  const refreshed = siteUrl && (opts.fresh || !t?.check) ? await refreshTracking(user) : null
  const check = refreshed?.check ?? t?.check
  const out: Message[] = []

  if (!t?.on || (!t.ga4 && !t.pixel)) {
    const blocks: Block[] = [
      { kind: "text", text: "Stop guessing which marketing works.", big: true },
      { kind: "text", text: "Once every call, email and form from your website is counted, Google and Meta learn who your customers are and send you more people like them. I set it up in a few minutes." },
    ]
    const line = check ? foundLine(check) : null
    if (line) blocks.push({ kind: "text", text: `${line} I’ll use what’s there and won’t add a second copy.` })
    const leads = check?.reachable ? leadsLine(check) : null
    if (leads) blocks.push({ kind: "text", text: leads })
    else if (check && !check.reachable) blocks.push({ kind: "text", text: "I couldn’t open your website just now, so I’ll check what’s on it after you give me the IDs." })
    blocks.push({ kind: "text", text: "I need two IDs. Both are in your accounts, and both are public (they’re in your page’s code, not passwords)." })
    blocks.push({ kind: "receipt", title: "Where to find them", items: [
      "Google Analytics: Admin → Data streams → your website → Measurement ID (starts with G-)",
      "Meta Pixel: Meta Events Manager → Data sources → your pixel → Pixel ID (a long number)",
      "No account yet? Tell me and I’ll walk you through making one. It takes about five minutes.",
    ] })
    blocks.push({ kind: "chips", items: [
      { label: "Add my IDs", action: { type: "tracking-setup", ga4: check?.elsewhere?.ga4[0] ?? check?.found.ga4[0], pixel: check?.elsewhere?.pixel[0] ?? check?.found.pixel[0] }, primary: true },
      { label: "I don’t have these yet", action: { type: "ask", text: "How do I create a Google Analytics property and a Meta Pixel for my website?" } },
    ] })
    out.push(agent(blocks, "trk-intro"))
    return out
  }

  const s2 = refreshed?.tracking ? { ...s, tracking: refreshed.tracking } : s
  const tt = s2.tracking ?? t
  const items = healthItems(s2, check, await eventDays(user.id, 31))
  const via = tt.via === "wordpress" ? "Through your WordPress plugin, in your page’s header." : "Through the Alphaa tag on your site."
  const tagMissing = tt.via === "tag" && !!check?.reachable && !check.ours
  const bad = items.filter((i) => !i.ok && !i.soft)
  out.push(agent([
    { kind: "text", text: tagMissing ? "Your tracking is ready. One step left on your site." : bad.length ? `Your tracking is on. ${bad.length === 1 ? "One thing needs" : `${bad.length} things need`} a look.` : "Your tracking is working.", big: true },
    { kind: "sources", title: "What I’m counting", items: items.map(({ name, status, ok, detail }) => ({ name, status, ok, detail })) },
    { kind: "text", text: `${via}${check ? ` Last checked ${new Date(check.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.` : ""}` },
  ], "trk-status"))

  // What I fixed by myself, and what got worse since the last daily check.
  const fixedNow = refreshed?.fixed.length ? refreshed.fixed : tt.autoFixed && Date.now() - Date.parse(tt.autoFixed.at) < 7 * 86_400_000 ? tt.autoFixed.lines : []
  if (fixedNow.length) out.push(agent([{ kind: "receipt", title: "I fixed this myself", items: fixedNow }], "trk-fixed"))
  if (tt.regressions && Date.now() - Date.parse(tt.regressions.at) < 7 * 86_400_000 && tt.regressions.lines.length) {
    out.push(agent([{ kind: "receipt", title: `Changed since ${new Date(tt.regressions.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`, items: tt.regressions.lines }], "trk-regress"))
  }

  if (tagMissing) {
    const snippet = `<script async src="${APP()}/tag.js?id=${user.id}"></script>`
    out.push(agent([
      { kind: "text", text: "Paste this once into your website’s header (the part before </head>). After that I can change your tracking from here without anyone touching the site again." },
      { kind: "doc", title: "Your Alphaa tag", meta: "paste once", text: snippet },
      { kind: "chips", items: [
        { label: "Copy it", action: { type: "copy", text: snippet, done: "Copied. Paste it before </head> on every page (most site builders have a “custom code” box for the header)." }, primary: true },
        { label: "I’ve added it, check now", action: { type: "run", task: "tracking" } },
      ] },
    ], "trk-tag"))
  }

  const fixes = fixChips(user, s2, items, tagMissing)
  if (fixes.length) out.push(agent([{ kind: "chips", items: fixes }], "trk-fixes"))

  out.push(agent([
    { kind: "text", text: "If your website gets visitors from the EU or UK, your cookie banner needs to cover Google Analytics and the Meta Pixel. If someone’s browser asks not to be tracked, I don’t load the Pixel for them." },
    { kind: "chips", items: [
      { label: "Check my site now", action: { type: "run", task: "tracking" } },
      { label: "Change the IDs", action: { type: "tracking-setup", ga4: tt.ga4, pixel: tt.pixel } },
      { label: "Turn it off", action: { type: "tracking-off" } },
    ] },
  ], "trk-actions"))
  return out
}

const op = (body: Record<string, string>) => ({ type: "agent-op" as const, endpoint: "tracking" as const, body })

/** Chips that fix what the health list found, plus the self-test. */
function fixChips(user: User, s: Awaited<ReturnType<typeof getAgentSettings>>, items: HealthItem[], tagMissing: boolean) {
  const t = s.tracking!
  const has = (k: string) => items.some((i) => i.key === k && !i.ok)
  const chips: { label: string; action: import("@/lib/agent/types").ChipAction; primary?: boolean }[] = []
  if (!tagMissing && beaconsOn(s) && items.some((i) => i.key === "install" && i.ok)) chips.push({ label: t.test?.result ? "Run the test again" : "Run the test", action: op({ op: "test" }), primary: true })
  if (!t.events) chips.push({ label: "Count calls, emails and forms", action: op({ op: "fix", fix: "events" }), primary: !chips.length })
  if (t.via === "wordpress" && has("install")) {
    if (s.wp && !beaconsOn(s) && items.some((i) => i.key === "install" && i.status.startsWith("Update"))) {
      chips.push({ label: `Get plugin ${WP_BEACON_VERSION}`, action: { type: "link", href: `${APP()}/downloads/alphaa-connector.zip` } })
    } else {
      chips.push({ label: "Put it back on my site", action: op({ op: "fix", fix: "install" }) })
    }
    chips.push({ label: "Use the Alphaa tag instead", action: op({ op: "fix", fix: "tag" }) })
  }
  if (t.pixel && !t.capi) chips.push({ label: "Add my Meta token", action: capiForm() })
  if (t.capi) chips.push({ label: "Remove my Meta token", action: op({ op: "capi-off" }) })
  const gaWhy = t.test?.result?.ga4?.why ?? ""
  if (t.ga4 && /Connect Google|doesn’t include Analytics/.test(gaWhy) && gaScopeAllowed(user.email)) {
    chips.push({ label: "Connect Google Analytics", action: { type: "link", href: "/api/integrations/google/connect?go=1&analytics=1" } })
  }
  return chips
}

function capiForm(): import("@/lib/agent/types").ChipAction {
  return {
    type: "agent-op",
    endpoint: "tracking",
    body: { op: "capi" },
    form: {
      text: "In Meta Events Manager, open your pixel → Settings → Conversions API → “Generate access token”, then paste it here. It’s a password for sending events, so I keep it encrypted and only use it to send your leads.",
      fields: [
        { name: "capiToken", label: "Conversions API access token", type: "text", required: true, placeholder: "EAAB…" },
        { name: "testCode", label: "Test event code (optional, from Events Manager → Test events)", type: "text", placeholder: "TEST12345" },
      ],
      cta: "Save and check it",
      fine: "I send Meta the kind of lead, the page, and the visitor’s IP address and browser, which Meta needs to match it. Nothing else.",
    },
  }
}

/** The self-test link. */
export function testMessages(link: string): Message[] {
  return [agent([
    { kind: "text", text: "Let’s make sure it really works.", big: true },
    { kind: "text", text: "Open this link. It’s your own website with a test code on the end. A few seconds after it loads, it sends a test signal to Google Analytics and Meta. It doesn’t count as a lead. Then come back and tap “Check the test”." },
    { kind: "doc", title: "Your test link", meta: "works for 2 hours", text: link },
    { kind: "chips", items: [
      { label: "Open the test page", action: { type: "link", href: link }, primary: true },
      { label: "Check the test", action: op({ op: "verify" }) },
    ] },
    { kind: "text", text: "Use a normal browser window without an ad blocker, and accept cookies if your site asks." },
  ], "trk-test")]
}

const STATE = { yes: "Got it", no: "Didn’t arrive", unknown: "Couldn’t check" } as const

/** What the test proved. */
export function verifyMessages(r: TestResult, opts: { ga4: boolean; pixel: boolean }): Message[] {
  const rows = [
    { name: "Your website ran the test", status: r.beacon === "yes" ? "Yes" : "Not yet", ok: r.beacon === "yes", detail: r.beacon === "yes" ? undefined : "I haven’t heard from the test page. Open the link, wait about 5 seconds on the page, then check again. If it still doesn’t come through, my tracking isn’t loading on that page." },
    ...(opts.ga4 && r.ga4 ? [{ name: "Google Analytics", status: STATE[r.ga4.state], ok: r.ga4.state === "yes", detail: r.ga4.why }] : []),
    ...(opts.pixel && r.meta ? [{ name: "Meta", status: STATE[r.meta.state], ok: r.meta.state === "yes", detail: r.meta.why }] : []),
  ]
  const all = rows.every((x) => x.ok)
  return [agent([
    { kind: "text", text: all ? "It works. Your leads are being counted." : r.beacon === "yes" ? "Your site sent the test. Here’s what arrived." : "The test hasn’t come through yet.", big: true },
    { kind: "sources", items: rows },
    { kind: "chips", items: [
      { label: "Check again", action: op({ op: "verify" }), primary: !all },
      { label: "New test link", action: op({ op: "test" }) },
    ] },
  ], "trk-test")]
}
