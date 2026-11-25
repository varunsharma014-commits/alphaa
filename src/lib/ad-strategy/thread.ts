// The "Your ad plan" thread: make the plan, watch it being written, then read it in sections.
import type { User } from "@prisma/client"
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { hasPro } from "@/lib/billing"
import { imageUrl } from "@/lib/images"
import { latestStrategy, lastReadyStrategy, strategyRunning } from "./generate"
import { anglesMd, competitorsMd, guardrailsMd, hooksMd, planHtml, scriptMd, specsMd, testingMd } from "./markdown"
import type { AdStrategy } from "./types"

const op = (body: Record<string, string>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "adplan", body } })
const make = (label = "Write my ad plan") => op({ op: "make" }, label, true)
const STALE_MS = 20 * 60_000

const doc = (title: string, md: string, meta?: string, image?: string): Block => ({ kind: "doc", title, meta, html: planHtml(md), image, square: !!image })

export async function adPlanMessages(user: User): Promise<Message[]> {
  if (!hasPro(user)) {
    return [agent([
      { kind: "text", text: "Your ads, written and planned for you.", big: true },
      { kind: "text", text: "On the Pro plan I read what your competitors run, then hand you 20+ opening lines, a dozen short video scripts you can film on your phone, ready static ads for each platform, and a plan for how much to spend and when to pause or scale." },
      { kind: "chips", items: [{ label: "See the Pro plan", action: { type: "link", href: "/dashboard/upgrade?plan=pro" }, primary: true }] },
    ], "ap-upgrade")]
  }
  const latest = await latestStrategy(user.id)
  const running = strategyRunning(user.id) || (latest?.status === "running" && Date.now() - Date.parse(latest.at) < STALE_MS)
  const ready = latest?.status === "ready" ? latest : await lastReadyStrategy(user.id)
  const out: Message[] = []

  if (running) {
    out.push(agent([
      { kind: "text", text: "I’m writing your ad plan.", big: true },
      { kind: "steps", items: ["Reading your competitors’ ads", "Picking your two strongest angles", "Writing your opening lines and static ads", "Writing your video scripts", "Making the images"], done: 1, ticker: [["Checking the Meta Ad Library…"], ["Comparing what they say with what you offer…"], ["Checking every line against your facts…"], ["Scene by scene…"], ["In your brand’s style…"]] },
      { kind: "text", text: "It takes about 3 minutes. You can leave this page; it’ll be here when you come back." },
      { kind: "chips", items: [{ label: "Check again", action: { type: "thread", topic: "adplan" }, primary: true }] },
    ], "ap-run"))
    if (!ready) return out
  } else if (latest?.status === "failed" && !ready) {
    return [agent([
      { kind: "text", text: "I couldn’t finish your ad plan.", big: true },
      { kind: "text", text: "Usually that means I don’t know enough about what you sell yet to write ads I can stand behind. Tell me more in Settings → Business, then try again." },
      { kind: "chips", items: [make("Try again"), { label: "Open business settings", action: { type: "link", href: "/dashboard/settings/business" } }] },
    ], "ap-failed")]
  }

  if (!ready) {
    return [agent([
      { kind: "text", text: "Your ads, planned for you.", big: true },
      { kind: "text", text: "I’ll read what your competitors run right now, then write your two strongest angles, 20+ opening lines, a dozen short video scripts you can film on your phone, ready static ads for Facebook, Instagram, Google and LinkedIn, and a plan for your budget: where it goes and when to pause or scale each ad." },
      { kind: "text", text: "Every line uses only facts you’ve given me. Nothing runs until you say so." },
      { kind: "chips", items: [make()] },
    ], "ap-intro")]
  }
  return [...out, ...planMessages(ready, !running)]
}

function planMessages(s: AdStrategy, canRedo: boolean): Message[] {
  const when = new Date(s.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const n = { hooks: s.hooks?.length ?? 0, scripts: s.scripts?.length ?? 0, statics: (s.statics?.meta.length ?? 0) + (s.statics?.linkedin.length ?? 0) + (s.statics?.google.headlines.length ? 1 : 0) }
  const msgs: Message[] = [
    agent([
      { kind: "text", text: `Your ad plan: ${n.scripts} video scripts, ${n.hooks} opening lines and ${n.statics} static ads.`, big: true },
      { kind: "text", text: `Written ${when} for ${s.business?.name ?? "your business"}${s.business?.markets ? `, ${s.business.markets}` : ""}. Start with the two angles, then film the scripts you like best.` },
      doc("Your two strongest angles", anglesMd(s)),
      doc("What your competitors run", competitorsMd(s)),
    ], "ap-head"),
    agent([doc("Your opening lines", hooksMd(s), "test 3 at a time, swap every 1–2 weeks")], "ap-hooks"),
    agent([
      { kind: "text", text: "Your video scripts. The first three are below; the full plan has all of them." },
      ...(s.scripts ?? []).slice(0, 3).map((x, i) => doc(x.title, scriptMd(x, i), `${x.seconds}s · ${x.format}`)),
    ], "ap-scripts"),
    agent([
      { kind: "text", text: "Your static ads, inside each platform’s limits." },
      ...(s.statics?.meta ?? []).map((m, i) => doc(`Facebook & Instagram ${i + 1}`, `${m.primary}\n\n**Headline:** ${m.headline}`, "ready to use", m.imageId ? imageUrl(m.imageId) : undefined)),
      ...((s.statics?.linkedin.length ?? 0) ? [doc("LinkedIn", s.statics!.linkedin.map((l, i) => `**${i + 1}.** ${l.intro}\n\nHeadline: ${l.headline}`).join("\n\n"))] : []),
      ...((s.statics?.google.headlines.length ?? 0) ? [doc("Google search", `**Headlines:** ${s.statics!.google.headlines.join(" · ")}\n\n${s.statics!.google.descriptions.map((d) => `- ${d}`).join("\n")}`)] : []),
    ], "ap-statics"),
    agent([doc("Your budget and testing plan", testingMd(s))], "ap-test"),
    agent([
      doc("How to make them", specsMd()),
      doc("Rules every ad follows", guardrailsMd(s)),
      { kind: "chips", items: [
        { label: "Open the full plan", action: { type: "link", href: "/dashboard/ad-strategy" }, primary: true },
        { label: "Run these as ads", action: { type: "thread", topic: "ads" } },
        ...(canRedo ? [op({ op: "make" }, "Write a fresh plan")] : []),
      ] },
    ], "ap-end"),
  ]
  return msgs
}
