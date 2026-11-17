// The "Tracking & ads" thread (Growth plan): what's measured on the owner's site, in plain words.
import { agent, type Block, type Message } from "@/lib/agent/types"
import { getAgentSettings } from "@/lib/agent/settings"
import { hasGrowth } from "@/lib/billing"
import { inspectSite, type TrackingCheck } from "@/lib/tracking"
import type { User } from "@prisma/client"

const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"

export function upgradeMessages(): Message[] {
  return [
    agent([
      { kind: "text", text: "Setting up your tracking and running your Google and Meta ads comes with the Growth plan.", big: true },
      { kind: "text", text: "I set up Google Analytics and the Meta Pixel, count every call, email and form you get from your website, and build your ads for you to approve." },
      { kind: "chips", items: [{ label: "See the Growth plan", action: { type: "link", href: "/dashboard/upgrade" }, primary: true }] },
    ], "trk-upgrade"),
  ]
}

function foundLine(c: TrackingCheck): string | null {
  const parts = [
    c.found.ga4.length ? `Google Analytics (${c.found.ga4.join(", ")})` : null,
    c.found.pixel.length ? `a Meta Pixel (${c.found.pixel.join(", ")})` : null,
    c.found.gtm.length ? `Google Tag Manager (${c.found.gtm.join(", ")})` : null,
    c.found.googleAds.length ? `a Google Ads tag (${c.found.googleAds.join(", ")})` : null,
  ].filter(Boolean)
  return parts.length ? `Your site already has ${parts.join(", ")}.` : null
}

/** The thread, from saved settings plus a fresh look at the site when `fresh` (or never checked). */
export async function trackingMessages(user: User, opts: { fresh?: boolean } = {}): Promise<Message[]> {
  if (!hasGrowth(user)) return upgradeMessages()
  const s = await getAgentSettings(user.id)
  const t = s.tracking
  const siteUrl = s.wp?.siteUrl ?? s.site?.siteUrl ?? user.websiteUrl
  const check = siteUrl && (opts.fresh || !t?.check) ? await inspectSite(siteUrl, user.id) : t?.check
  const out: Message[] = []

  if (!t?.on || (!t.ga4 && !t.pixel)) {
    const blocks: Block[] = [
      { kind: "text", text: "Before I run any ads, I make sure every call, email and form from your website gets counted.", big: true },
      { kind: "text", text: "Ads only get better when Google and Meta can see which clicks turned into customers. I set up Google Analytics and the Meta Pixel, and I count phone taps, email taps and form sends as leads." },
    ]
    const line = check ? foundLine(check) : null
    if (line) blocks.push({ kind: "text", text: `${line} I’ll use what’s there and won’t add a second copy.` })
    else if (check && !check.reachable) blocks.push({ kind: "text", text: "I couldn’t open your website just now, so I’ll check what’s on it after you give me the IDs." })
    blocks.push({ kind: "text", text: "I need two IDs. Both are in your accounts, and both are public (they’re in your page’s code, not passwords)." })
    blocks.push({ kind: "receipt", title: "Where to find them", items: [
      "Google Analytics: Admin → Data streams → your website → Measurement ID (starts with G-)",
      "Meta Pixel: Meta Events Manager → Data sources → your pixel → Pixel ID (a long number)",
      "No account yet? Tell me and I’ll walk you through making one. It takes about five minutes.",
    ] })
    blocks.push({ kind: "chips", items: [
      { label: "Add my IDs", action: { type: "tracking-setup", ga4: check?.found.ga4[0], pixel: check?.found.pixel[0] }, primary: true },
      { label: "I don’t have these yet", action: { type: "ask", text: "How do I create a Google Analytics property and a Meta Pixel for my website?" } },
    ] })
    out.push(agent(blocks, "trk-intro"))
    return out
  }

  const via = t.via === "wordpress" ? "Through your WordPress plugin, in your page’s header." : "Through the Alphaa tag on your site."
  const tagMissing = t.via === "tag" && check?.reachable && !check.ours
  out.push(agent([
    { kind: "text", text: tagMissing ? "Your tracking is ready. One step left on your site." : "Your tracking is set up.", big: true },
    { kind: "sources", items: [
      ...(t.ga4 ? [{ name: "Google Analytics", detail: t.ga4, status: tagMissing ? "Waiting for the tag" : "On", ok: !tagMissing }] : []),
      ...(t.pixel ? [{ name: "Meta Pixel", detail: t.pixel, status: tagMissing ? "Waiting for the tag" : "On", ok: !tagMissing }] : []),
      { name: "Calls, emails and forms counted as leads", detail: t.events ? "Phone taps, email taps, form sends" : "Off", status: t.events ? "On" : "Off", ok: t.events },
    ] },
    { kind: "text", text: `${via}${check ? ` Last checked ${new Date(check.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.` : ""}` },
  ], "trk-status"))

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

  const dupes = check ? [...(t.ga4 && check.found.ga4.includes(t.ga4) && !check.ours ? ["Google Analytics"] : []), ...(t.pixel && check.found.pixel.includes(t.pixel) && !check.ours ? ["Meta Pixel"] : [])] : []
  if (dupes.length) {
    out.push(agent([{ kind: "text", text: `Heads up: your site already loads the same ${dupes.join(" and ")} on its own. I skip adding a second copy in the browser, so nothing counts twice.` }], "trk-dupe"))
  }

  out.push(agent([
    { kind: "text", text: "If your website gets visitors from the EU or UK, your cookie banner needs to cover Google Analytics and the Meta Pixel. If someone’s browser asks not to be tracked, I don’t load the Pixel for them." },
    { kind: "chips", items: [
      { label: "Check my site now", action: { type: "run", task: "tracking" }, primary: !tagMissing },
      { label: "Change the IDs", action: { type: "tracking-setup", ga4: t.ga4, pixel: t.pixel } },
      { label: "Turn it off", action: { type: "tracking-off" } },
    ] },
  ], "trk-actions"))
  return out
}
