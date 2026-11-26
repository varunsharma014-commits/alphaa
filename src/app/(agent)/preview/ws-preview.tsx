// Dev-only (page.tsx 404s in production): the workspace shell and pages with SAMPLE data, so the
// layout can be checked in a browser without a Clerk session. Never rendered for a real account.
import "../../(dashboard)/workspace.css"
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell"
import { BriefingView } from "@/components/workspace/BriefingView"
import { ResearchView } from "@/components/workspace/ResearchView"
import { SocialView } from "@/components/workspace/SocialView"
import { EmailView } from "@/components/workspace/EmailView"
import { AdsView } from "@/components/workspace/AdsView"
import { TrackingView } from "@/components/workspace/TrackingView"
import type { ShellData } from "@/lib/workspace/shell"
import { ART } from "@/lib/workspace/common"
import type { AiCard } from "@/lib/workspace/ai-cards"
import type { MoveCard } from "@/lib/workspace/rivals"

const shell: ShellData = { businessName: "Sample Dental (preview)", firstName: "Sam", pro: true, planPro: true, growth: true, autopilot: true, consentStale: false, goingOut: 3, socialScheduled: 2, channels: 5, signals: { ok: 4, total: 5 }, doneThisWeek: 6 }
const AI_EMPTY: AiCard[] = (["chatgpt", "claude", "perplexity", "gemini"] as const).map((e, i) => ({ engine: e, name: ["ChatGPT", "Claude", "Perplexity", "Gemini"][i], mark: ["Ch", "Cl", "Pe", "Ge"][i], state: "unknown", question: null, questionFull: null, names: [], namesFrom: "answer", at: null, answer: null }))
const AI_SAMPLE: AiCard[] = AI_EMPTY.map((c, i) => (i === 3 ? c : { ...c, state: i === 1 ? "yes" : "no", question: "Sample question about a dentist near me?", questionFull: "Sample question about a dentist near me?", names: i === 1 ? [] : ["Sample Rival A", "Sample Rival B"], at: new Date(Date.now() - 2 * 86_400_000).toISOString(), answer: "Sample answer text (preview only)." }))
const SAMPLE_MOVE: MoveCard = { id: "m1", title: "Sample page title for your site", topic: "Sample", rival: "Sample Rival", rivalHost: "example.com", signals: [{ label: "Quick win · you’re #11 for “sample query”", tone: "g" }, { label: "Buyer intent", tone: "n" }], outline: ["One", "Two"], score: 4, why: "you already show up at #11 on Google for “sample query”" }
const soon = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()

export function WsPreview({ page, empty, dark }: { page: string; empty: boolean; dark: boolean }) {
  const path = page === "briefing" ? "/dashboard" : `/dashboard/${page}`
  const body = (() => {
    if (page === "research") return <ResearchView data={empty ? { summary: "Here’s what I’ve found about your market so far.", nicheOn: true, working: [], trends: [], ideas: [], hooks: [], moves: [], comps: [], compGaps: [], strategyAt: null, hiddenComps: 2, hiddenGaps: 4, lastChecked: null, compared: 0, autopilot: false, siteConnected: false, top: null, island: "" } : {
      summary: "I looked at 12 posts on Instagram, TikTok for #sampletag. Here’s what I found, with a link to every source.", nicheOn: true, strategyAt: new Date().toISOString(),
      working: [1, 2, 3, 4, 5].map((k) => ({ id: `w${k}`, where: k % 2 ? "Instagram" : "TikTok", title: `Sample post ${k}: a walk-through of a first visit`, stats: [{ k: "Views", v: "1,200" }, { k: "Likes", v: "88" }, { k: "Comments", v: "9" }], use: "A short walk-through of your first visit, filmed on a phone.", url: "https://example.com/post", art: ART.social, rows: [["What it is", "Sample"], ["Why it works", "Sample"], ["Source", "https://example.com/post"]] as [string, string][], makeChip: { label: "Make my version", action: { type: "say" as const, text: "preview" } } })),
      trends: [{ title: "Sample trend", why: "Why it matters (sample).", url: "https://example.com/trend", when: "This week" }],
      ideas: [{ kind: "Blog post", text: "Sample idea title", why: "Sample reason from your numbers.", src: "From your numbers, Mon", url: null, chip: { label: "Write it", action: { type: "say" as const, text: "preview" } } }],
      hooks: [{ kind: "Question", text: "Sample hook line?", why: "", src: "Your ad plan", url: "/dashboard/ad-strategy" }],
      moves: [SAMPLE_MOVE],
      comps: [{ id: "c1", name: "Sample Rival", host: "example.com", site: "https://example.com", favicon: "https://www.google.com/s2/favicons?domain=example.com&sz=64", manual: false, tag: "Direct rival", winning: "Named in 3 AI answers to your customers’ questions", weak: "No structured data on their site, so AI has less to confirm who they are", counter: "I publish “Sample page” to take that search", primary: { label: "Take their gap", move: SAMPLE_MOVE }, adUrl: "https://example.com/ad", detail: [{ k: "What I found on their site", v: "Sample summary." }] },
        { id: "c2", name: "Thin Rival", host: "example.org", site: "https://example.org", favicon: "https://www.google.com/s2/favicons?domain=example.org&sz=64", manual: true, tag: null, winning: null, weak: null, counter: null, primary: null, adUrl: null, detail: [] }],
      compGaps: ["Sample gap."], hiddenComps: 4, hiddenGaps: 2, lastChecked: new Date(Date.now() - 3 * 86_400_000).toISOString(), compared: 1, autopilot: true, siteConnected: true,
      top: { kind: "move", move: SAMPLE_MOVE }, island: "Found 1 gap worth taking · the best one is ready to draft",
    }} />
    if (page === "social") return <SocialView data={{ accounts: empty ? [] : [{ name: "Sample Page", platform: "Instagram" }], canConnect: true, auto: true, tabs: empty ? [] : ["Instagram", "Facebook"], posts: empty ? [] : [
      { id: "p1", nets: ["Instagram"], status: "scheduled", title: "Sample scheduled post", text: "Sample caption for a scheduled post.", image: null, when: "Goes out Thu 5:30 PM", at: null, verb: null, result: null, links: [], error: null },
      { id: "p2", nets: ["Facebook"], status: "published", title: "Sample posted post", text: "Sample caption.", image: null, when: "Posted Mon", at: null, verb: null, result: "12 likes · 2 comments", links: [{ label: "Facebook", url: "https://example.com" }], error: null },
    ] }} />
    if (page === "email") return <EmailView data={{ listSize: empty ? 0 : 120, optedOut: 3, imports: [], address: empty ? null : "1 Sample St", auto: false, campaigns: empty ? [] : [{ id: "c1", subject: "Sample subject", preview: "Sample preview", status: "Sent 4 days ago", pc: "g", sent: 117, bounced: 1, complained: 0, body: ["Sample paragraph."], when: "4 days ago", auto: false }], sentTotal: 117, nextSend: null, chips: { add: { label: "Add", action: { type: "say", text: "x" } }, address: { label: "Address", action: { type: "say", text: "x" } }, write: { label: "Write", action: { type: "say", text: "x" } } } }} />
    if (page === "ads") return <AdsView data={{ metaConnected: !empty, googleConnected: false, results: empty ? [] : [{ platform: "Facebook & Instagram", spend: "$210", clicks: "340", leads: "9", perLead: "$23.33", extra: "1 campaign I built", days: 30 }], budget: empty ? null : 300, campaigns: [], changes: [], plan: null, budgetChip: { label: "Set", action: { type: "say", text: "x" } } }} />
    if (page === "tracking") return <TrackingView data={{ growth: true, trackingOn: !empty, setup: { done: 4, total: 7, next: "Connect your website" }, health: [], signals: empty ? [] : [{ src: "Website", ev: "Phone tap × 2", t: "today", at: "", tone: "g" }, { src: "AI answers", ev: "Visit from ChatGPT · /services", t: "2h ago", at: "", tone: "b" }], conns: [
      { key: "gbp", name: "Google Business Profile", ok: true, sum: "Sample: connected.", detail: "Sample." },
      { key: "site", name: "Your website", ok: false, sum: "Not connected.", act: { label: "Connect my website", topic: "setup" }, detail: "Sample." },
    ] }} />
    return <BriefingView data={empty ? { firstName: "Sam", ai: AI_EMPTY, headline: { total: null, missing: ["Connect your Google listing to count calls from Google."] }, tiles: [{ key: "ai", label: "AI answers naming you", value: null, delta: null, empty: "My first check runs this week." }, { key: "visits", label: "Website visits", value: null, delta: null, empty: "Connect Google Analytics to see visits.", href: "#" }, { key: "rating", label: "Google rating", value: null, delta: null, empty: "Connect your Google listing to see reviews.", href: "#" }], question: { id: "q", eyebrow: "Setup · step 1 of 7", title: "Connect Google", text: "Sample why.", fallback: "Until then, I keep working with what I have.", acts: [{ label: "Connect Google", href: "#", primary: true }, { label: "See all steps", topic: "setup" }] }, going: [], waiting: 0, waitingTopic: "social", autopilot: false, done: [] } : {
      firstName: "Sam", ai: AI_SAMPLE,
      headline: { total: 27, prev: 21, days: 30, missing: [], parts: [{ label: "Calls from Google", value: 15, prev: 12 }, { label: "Calls from your website", value: 8, prev: 6 }, { label: "Messages and forms", value: 4, prev: 3 }] },
      tiles: [{ key: "ai", label: "AI answers naming you", value: "9 of 40", delta: null, empty: "" }, { key: "visits", label: "Website visits · 28 days", value: "1,020", delta: "+8%", empty: "" }, { key: "rating", label: "Google rating", value: "4.7 ★", delta: "3 new reviews", empty: "" }],
      question: null,
      going: [
        { id: "g1", kind: "social", lane: "Social · Instagram", big: "Sample post", small: "1 account", title: "Sample scheduled social post", text: "Sample caption.", image: null, at: soon(20), when: "Tomorrow 9 AM", art: ART.social },
        { id: "g2", kind: "gbp", lane: "Google listing · update", big: "Sample update", small: "On your Google listing", title: "Sample Google update", text: "Sample text.", image: null, at: soon(50), when: "Sat 1 PM", art: ART.google },
      ],
      waiting: 0, waitingTopic: "social", autopilot: true,
      done: [{ ch: "Reviews", text: "Replied to a Google review", when: "Tue", at: "", href: null }, { ch: "Website", text: "Wrote a new post for you", when: "Mon", at: "", href: "https://example.com" }],
    }} />
  })()
  return (
    <WorkspaceShell data={shell} theme={dark ? "dark" : "light"} admin={false} showUser={false} path={path}>
      {body}
    </WorkspaceShell>
  )
}
