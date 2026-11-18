// "What's working in your niche": real posts and long-running ads from the owner's vertical,
// each with why it works and a one-tap "Make my version". Rendered in its own thread (?ask=niche)
// and as a short card at the end of the "What's working" thread. No database access here.
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { PLATFORM_LABEL, metricLine, type NicheItem, type NichePosts } from "@/lib/niche-posts"

export type NicheView = {
  /** APIFY_TOKEN is set. */
  enabled: boolean
  /** The newest row (may be running or failed). */
  latest: NichePosts | null
  /** The last finished one, shown while a newer run is going. */
  ready: NichePosts | null
  running: boolean
}

const check: Chip = { label: "Check again", action: { type: "agent-op", endpoint: "niche", body: { op: "status" } }, primary: true }
const refresh: Chip = { label: "Look again with today’s posts", action: { type: "agent-op", endpoint: "niche", body: { op: "refresh" } } }

const handle = (i: NicheItem) => (i.handle ? (i.platform === "facebook" || i.platform === "meta_ad" ? i.handle : `@${i.handle.replace(/^@/, "")}`) : null)

function itemMessage(i: NicheItem, k: number): Message {
  const lines = [i.about, i.why ? `Why it works: ${i.why}` : "", i.angle ? `Your version: ${i.angle}` : ""].filter(Boolean)
  return agent([
    { kind: "doc", title: `${PLATFORM_LABEL[i.platform]}${handle(i) ? ` · ${handle(i)}` : ""}`, meta: metricLine(i), text: lines.join("\n\n") },
    { kind: "chips", items: [
      { label: "Make my version", action: { type: "agent-op", endpoint: "niche", body: { op: "make", id: i.id } }, primary: k === 0 },
      { label: i.platform === "meta_ad" ? "See the ad" : "See the post", action: { type: "link", href: i.url } },
    ] },
  ], `ni-item-${i.id}`)
}

/** Full thread. `compact` = the short card inside "What's working" (3 items + a link to the rest). */
export function nicheMessages(v: NicheView, opts: { compact?: boolean } = {}): Message[] {
  const compact = !!opts.compact
  if (!v.enabled) {
    return [agent([
      { kind: "text", text: "What’s working in your niche is coming soon.", big: true },
      { kind: "text", text: "Soon I’ll show you the posts and ads getting the most attention from businesses like yours each week, and make your own version in one tap." },
    ], "ni-head")]
  }
  const show = v.latest?.status === "ready" ? v.latest : v.ready
  if (!show) {
    if (v.running || v.latest?.status === "running") {
      return [agent([
        { kind: "text", text: "I’m looking at what’s working in your niche. I need a bit longer.", big: true },
        { kind: "text", text: "I’m reading the top posts on Instagram and TikTok for businesses like yours, and what your competitors posted lately. It takes a few minutes." },
        { kind: "chips", items: [check] },
      ], "ni-head")]
    }
    return [agent([
      { kind: "text", text: v.latest?.status === "failed" ? "I couldn’t read the posts in your niche just now." : "I haven’t looked at your niche yet.", big: true },
      { kind: "chips", items: [{ ...refresh, primary: true }] },
    ], "ni-head")]
  }
  const when = new Date(show.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  if (!show.items.length) {
    return [agent([
      { kind: "text", text: "I didn’t find posts in your niche that stood out this week.", big: true },
      { kind: "text", text: `I looked at ${show.terms.slice(0, 4).join(", ") || "posts for businesses like yours"}. I’ll look again next week.` },
      ...(compact ? [] : [{ kind: "chips", items: [refresh] } as Block]),
    ], "ni-head")]
  }
  const items = compact ? show.items.slice(0, 3) : show.items
  const out: Message[] = [agent([
    { kind: "text", text: "What’s working in your niche this week", big: true },
    { kind: "text", text: `${show.items.length === 1 ? "This one is" : `These ${show.items.length} are`} getting real attention from businesses like yours. Tap “Make my version” and I’ll write yours, in your voice, with your brand image.` },
    { kind: "text", text: `From ${list(show.sources) || "public posts"}${show.terms.length ? `, searching ${show.terms.slice(0, 4).join(", ")}` : ""}. Updated ${when}.${v.running ? " I’m checking for newer ones now." : ""}` },
  ], "ni-head")]
  items.forEach((i, k) => out.push(itemMessage(i, k)))
  out.push(agent([
    { kind: "text", text: compact && show.items.length > items.length ? `${show.items.length - items.length} more in your niche.` : "I look again every week, so you always see what’s getting attention right now." },
    { kind: "chips", items: compact ? [{ label: "See everything in your niche", action: { type: "thread", topic: "niche" } }] : [refresh] },
  ], "ni-end"))
  return out
}

/** The result of "Make my version". */
export function madeMessage(r: { text: string; image: string | null; saved: boolean; growth: boolean; from: NicheItem }): Message {
  const blocks: Block[] = [
    { kind: "text", text: r.saved ? "Here’s your version. It’s saved as a draft in your social posts." : "Here’s your version. Copy it and post it from your own account." },
    { kind: "doc", title: "Your post", meta: `Inspired by a ${PLATFORM_LABEL[r.from.platform]} ${r.from.platform === "meta_ad" ? "ad" : "post"} in your niche`, text: r.text, ...(r.image ? { image: r.image, square: true } : {}) },
  ]
  const chips: Chip[] = [{ label: "Copy the caption", action: { type: "copy", text: r.text, done: "Copied." }, primary: !r.saved }]
  if (r.saved) chips.unshift({ label: "See my social posts", action: { type: "thread", topic: "social" }, primary: true })
  if (!r.growth) chips.push({ label: "Post it for me (Growth)", action: { type: "link", href: "/dashboard/settings/billing" } })
  blocks.push({ kind: "chips", items: chips })
  return agent(blocks, `ni-made-${r.from.id}`)
}

function list(a: string[]): string {
  if (a.length <= 1) return a[0] ?? ""
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`
}
