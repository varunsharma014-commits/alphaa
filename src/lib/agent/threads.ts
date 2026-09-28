// Topic threads for the signed-in agent. Each rail item opens a conversation
// in the same chat window instead of a dashboard page. Messages come from real
// rows; when there is nothing yet, the thread says so and the agent starts the
// job itself (the client runs `autorun`) — never a blank page with a button.

import { db } from "@/lib/db"
import type { CitationReport } from "@/lib/citations"
import { agent, type Block, type Message, type Task } from "@/lib/agent/types"
import { citationBlocks, discussionMessages } from "@/lib/agent/thread-blocks"
import { getAgentSettings } from "@/lib/agent/settings"
import { getRoi, roiLines } from "@/lib/roi"
import { latestQuestionScan } from "@/lib/questions"
import { cachedCheck, type ProfilesResult, type ListingsResult, type BingResult } from "@/lib/checks/run"
import type { SecurityCheck } from "@/lib/checks/security"
import { answersMessages, changeChips, profileMessages, listingsMessages, bingMessages, securityMessages } from "@/lib/agent/check-narration"
import { outreachMessages } from "@/lib/agent/thread-blocks"
import { maxExtraLocations } from "@/lib/agent/settings"
import { imageUrl } from "@/lib/images"

export type Topic = "reviews" | "site" | "sources" | "listings" | "answers" | "content" | "competitors" | "briefings"
export const TOPICS: { key: Topic; label: string; blurb: string }[] = [
  { key: "reviews", label: "Reviews", blurb: "Your Google reviews and my reply drafts" },
  { key: "site", label: "Site Schema & Code", blurb: "What AI can read on your site, and the fixes I wrote" },
  { key: "sources", label: "Source Tracking", blurb: "The pages AI reads before it recommends anyone" },
  { key: "answers", label: "AI Answers", blurb: "Every customer question, asked to all four AIs each week — and what they get wrong about you" },
  { key: "content", label: "Posts & Pages", blurb: "Fresh posts and pages I write for your site, waiting for your yes" },
  { key: "listings", label: "Listings & Profiles", blurb: "Bing, Apple, your social profiles, your details across directories, and your locations" },
  { key: "competitors", label: "Competitors", blurb: "What they have that you don’t — and drafts to close it" },
  { key: "briefings", label: "Weekly Briefings", blurb: "What I did each week, in plain English" },
]
export const isTopic = (t: string): t is Topic => TOPICS.some((x) => x.key === t)

export type Thread = { messages: Message[]; autorun: Task[] }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}
function ago(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 14) return "last week"
  return `${Math.floor(days / 7)} weeks ago`
}
const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
// Legacy key: the "claude" engine is stored as google_ai in old reports.
const ENGINE_NAME: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", google_ai: "Claude", perplexity: "Perplexity" }

// Shown at the end of the Reviews thread whatever its state.
const askForReviews = (hasReviews: boolean): Message =>
  agent([
    { kind: "text", text: hasReviews ? "Want more of them? Reviews are one of the strongest things AI weighs before naming a business." : "Reviews are one of the strongest things AI weighs before naming a business — so let’s get you some." },
    { kind: "text", text: "Give me a customer’s name and their email or mobile. I’ll send a short, friendly ask with your Google review link — or write the text for you to send from your own phone." },
    { kind: "chips", items: [{ label: "Ask a customer for a review", action: { type: "review-ask" }, primary: true }] },
  ], "rv-ask")

export async function buildThread(topic: Topic, userId: string): Promise<Thread> {
  const t = await buildThreadInner(topic, userId)
  if (topic === "reviews") {
    const has = t.messages.some((m) => m.id === "rv-sum")
    t.messages.push(askForReviews(has))
  }
  return t
}

async function buildThreadInner(topic: Topic, userId: string): Promise<Thread> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { integration: true } })
  if (!user) return { messages: [], autorun: [] }
  const biz = user.businessName ?? "your business"
  const site = user.websiteUrl ? host(user.websiteUrl) : null
  const gmbReady = !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)

  switch (topic) {
    // ── Reviews ────────────────────────────────────────────────────────────
    case "reviews": {
      if (!user.integration) {
        return {
          autorun: [],
          messages: [
            agent([
              { kind: "text", text: "I can’t see your Google reviews yet.", big: true },
              { kind: "text", text: "Connect Google once and I’ll read every new review each day, draft a reply in your voice, and post it when you tap approve." },
              { kind: "chips", items: [{ label: "Connect Google", action: { type: "link", href: "/api/integrations/google/connect?go=1" }, primary: true }] },
            ], "rv-connect"),
          ],
        }
      }
      if (!gmbReady) {
        return {
          autorun: [],
          messages: [
            agent([
              { kind: "text", text: "You’re connected to Google — I just need to know which listing is yours.", big: true },
              { kind: "text", text: "Pick it once and I’ll start drafting replies to your reviews." },
              { kind: "chips", items: [{ label: "Pick my listing", action: { type: "link", href: "/dashboard/settings/integrations" }, primary: true }] },
            ], "rv-pick"),
          ],
        }
      }
      const reviews = await db.gmbReview.findMany({ where: { userId }, orderBy: { publishedAt: "desc" }, take: 30 })
      if (reviews.length === 0) {
        return { autorun: [], messages: [agent([{ kind: "text", text: "No Google reviews on your listing yet.", big: true }, { kind: "text", text: "I check every day. The moment one arrives I’ll draft a reply for you here." }], "rv-none")] }
      }
      const waiting = reviews.filter((r) => !r.reply)
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      const msgs: Message[] = [
        agent([
          { kind: "text", text: waiting.length ? `${waiting.length} ${waiting.length === 1 ? "review is" : "reviews are"} waiting for a reply.` : "Every review has a reply.", big: true },
          { kind: "text", text: `You have ${reviews.length}${reviews.length === 30 ? "+" : ""} reviews averaging ${avg.toFixed(1)}★. ${waiting.length ? "I’ll draft each one — you approve, I post." : "I check daily and will draft the next one as soon as it lands."}` },
        ], "rv-sum"),
      ]
      for (const r of waiting.slice(0, 6)) {
        msgs.push(
          agent([
            { kind: "text", text: `${r.authorName} · ${"★".repeat(r.rating)} · ${ago(r.publishedAt)}` },
            ...(r.comment ? [{ kind: "doc", title: `${r.authorName} · Google`, meta: "review", text: r.comment.slice(0, 600) } as Block] : []),
            { kind: "chips", items: [{ label: "Draft my reply", action: { type: "review-draft", reviewId: r.id }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
          ], `review-${r.id}`)
        )
      }
      return { autorun: [], messages: msgs }
    }

    // ── Site Schema & Code ────────────────────────────────────────────────
    case "site": {
      if (!site) {
        return { autorun: [], messages: [agent([{ kind: "text", text: "I don’t have your website address yet.", big: true }, { kind: "text", text: "Add it once and I’ll read your site the way ChatGPT, Claude and Perplexity do, then write the fixes." }, { kind: "chips", items: [{ label: "Add my website", action: { type: "link", href: "/dashboard/settings/business" }, primary: true }] }], "st-none")] }
      }
      const s = await getAgentSettings(userId)
      const [sec, bing] = await Promise.all([cachedCheck<SecurityCheck>(userId, "security"), cachedCheck<BingResult>(userId, "bing", 8 * 86_400_000)])
      const autorun: Task[] = ["site-check"]
      if (!sec) autorun.push("security")
      const tail: Message[] = sec ? securityMessages(sec.data, !!s.wp) : [agent([{ kind: "text", text: "Then I’ll run the security checks." }], "security-run")]
      if (s.bingKeyEnc) {
        if (bing) tail.push(...bingMessages(bing.data))
        else { autorun.push("bing"); tail.push(agent([{ kind: "text", text: "Reading your Bing numbers…" }], "bing-run")) }
      } else {
        tail.push(agent([
          { kind: "text", text: "Want me to watch Bing too? ChatGPT’s search draws on Bing’s index. Connect Bing Webmaster Tools and I’ll report your Bing clicks, what people search, and any crawl problems — and tell Bing about every new page." },
          { kind: "chips", items: [{ label: "Connect Bing", action: { type: "bing-connect" }, primary: true }] },
        ], "bing-offer"))
      }
      return {
        autorun,
        messages: [agent([{ kind: "text", text: `I’m reading ${site} the way ChatGPT, Claude and Perplexity do.`, big: true }, { kind: "steps", items: ["Opening your homepage as each AI crawler", "Checking what they can read", "Checking the facts AI needs", "Writing the fixes"], done: 0 }], "st-run"), ...tail],
      }
    }

    // ── Source Tracking ───────────────────────────────────────────────────
    case "sources": {
      const row = await db.mockActivity.findFirst({ where: { userId, type: "citation_scan" }, orderBy: { createdAt: "desc" } })
      const report = isRecord(row?.metadata) && Array.isArray((row!.metadata as Record<string, unknown>).targets) ? (row!.metadata as unknown as CitationReport) : null
      const fresh = row && Date.now() - row.createdAt.getTime() < 7 * 86_400_000
      if (!report || !report.searchConfigured || report.targets.length === 0 || !fresh) {
        return {
          autorun: ["citations"],
          messages: [agent([{ kind: "text", text: "I’m searching the way your customers do.", big: true }, { kind: "text", text: "Then I open each result the AIs lean on and check whether you’re on it. About two minutes — nothing changes on your site." }, { kind: "steps", items: ["Searching like a customer", "Opening each page AI reads", "Checking if you’re named"], done: 0 }], "src-run")],
        }
      }
      return { autorun: [], messages: [agent(citationBlocks(report, user.businessType, user.city, row!.createdAt), "src-report"), ...outreachMessages(report), ...discussionMessages(report)] }
    }

    // ── Maps & Listings ───────────────────────────────────────────────────
    case "listings": {
      const s = await getAgentSettings(userId)
      const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "")
      return {
        
        messages: [
          agent([
            { kind: "text", text: "Where AI checks your details — and whether they match.", big: true },
            { kind: "text", text: "First, two free listings most businesses skip." },
            { kind: "text", text: "ChatGPT’s search draws partly on Bing, and Siri, Apple Maps and Spotlight read Apple Business Connect. Neither costs anything, and each takes about ten minutes. These need you — both ask the owner to verify — so here’s exactly what to do." },
          ], "ls-intro"),
          agent([
            { kind: "text", text: s.bingPlacesDone ? `Bing Places — done on ${when(s.bingPlacesDone)}. ✓` : "1. Bing Places" },
            ...(s.bingPlacesDone ? [] : [
              { kind: "receipt", title: "Bing Places for Business", sub: "about 10 minutes", items: ["Go to bingplaces.com and sign in (a Microsoft, Google or Facebook account works).", "Choose “Import from Google Business Profile” — your name, address, hours and photos copy across.", "Confirm the details and verify. Bing may verify an imported listing straight away; otherwise it asks for a phone, email or postcard check."] } as Block,
              { kind: "chips", items: [{ label: "Open Bing Places", action: { type: "link", href: "https://www.bingplaces.com" } }, { label: "I’ve done it", action: { type: "setting", key: "bingPlacesDone", value: true, done: "Noted. I’ll check Bing is showing your details on my next pass." }, primary: true }] } as Block,
            ]),
          ], "ls-bing"),
          agent([
            { kind: "text", text: s.appleConnectDone ? `Apple Business Connect — done on ${when(s.appleConnectDone)}. ✓` : "2. Apple Business Connect" },
            ...(s.appleConnectDone ? [] : [
              { kind: "receipt", title: "Apple Business Connect", sub: "about 10 minutes, plus verification", items: ["Go to businessconnect.apple.com and sign in with an Apple Account.", "Search for your business and claim it — or add it if it isn’t on Apple Maps yet.", "Verify you’re the owner. Apple offers a phone call to your business number or a document check.", "Add your hours, photos, website and a short description. That’s what Siri reads out."] } as Block,
              { kind: "chips", items: [{ label: "Open Apple Business Connect", action: { type: "link", href: "https://businessconnect.apple.com" } }, { label: "I’ve done it", action: { type: "setting", key: "appleConnectDone", value: true, done: "Noted — that covers Siri and Apple Maps." }, primary: true }] } as Block,
            ]),
          ], "ls-apple"),
          ...(await listingsTail(userId, user.plan, s)),
        ],
        autorun: await listingsAutorun(userId),
      }
    }

    // ── AI Answers ────────────────────────────────────────────────────────
    case "answers": {
      const latest = await latestQuestionScan(userId)
      const started = await db.mockActivity.findFirst({ where: { userId, type: "question_scan_started", createdAt: { gte: new Date(Date.now() - 20 * 60_000) } }, orderBy: { createdAt: "desc" } })
      if (started && (!latest || latest.at < started.createdAt)) {
        const mins = Math.max(1, Math.round((Date.now() - started.createdAt.getTime()) / 60_000))
        return { autorun: [], messages: [
          agent([
            { kind: "text", text: "I’m asking all four AIs your questions right now.", big: true },
            { kind: "steps", items: ["Asking ChatGPT, Gemini, Claude and Perplexity each question", "Noting who they name instead of you", "Checking what they say about you is true"], done: mins >= 3 ? 1 : 0 },
            { kind: "text", text: `Started ${mins} minute${mins === 1 ? "" : "s"} ago — usually done in about five. Come back in a few minutes, or ask me anything meanwhile.` },
          ], "ans-running"),
          ...(latest ? answersMessages(latest.scan, latest.at) : []),
        ] }
      }
      if (!latest) {
        return { autorun: [], messages: [agent([
          { kind: "text", text: "I haven’t asked your customer questions yet.", big: true },
          { kind: "text", text: "I’ll write the 10–20 questions your customers really ask, put each one to ChatGPT, Gemini, Claude and Perplexity every week, and check what they say about you — wrong hours, wrong phone, “closed”. First run takes a few minutes." },
          { kind: "chips", items: [{ label: "Ask them now", action: { type: "questions-run" }, primary: true }, { label: "See the questions first", action: { type: "questions-edit" } }] },
        ], "ans-none")] }
      }
      return { autorun: [], messages: answersMessages(latest.scan, latest.at) }
    }

    // ── Posts & Pages ─────────────────────────────────────────────────────
    case "content": {
      const s = await getAgentSettings(userId)
      const wp = !!s.wp
      const drafts = await db.mockActivity.findMany({ where: { userId, type: "post_draft" }, orderBy: { createdAt: "desc" }, take: 12 })
      const ready = drafts.filter((d) => (d.metadata as { status?: string } | null)?.status === "ready").slice(0, 4)
      const published = drafts.filter((d) => (d.metadata as { status?: string } | null)?.status === "published")
      const perMonth = /pro|full/i.test(user.plan) ? 4 : 2
      const voiceMsg: Message | null = user.voiceDescription?.trim()
        ? agent([
            { kind: "receipt", title: "How I write for you", sub: "learned from your website", items: user.voiceDescription.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 5) },
            { kind: "chips", items: [{ label: "Change it", action: { type: "link", href: "/dashboard/settings/business" } }] },
          ], "ct-voice")
        : null
      const msgs: Message[] = [agent([
        { kind: "text", text: ready.length ? `${ready.length} ${ready.length === 1 ? "post is" : "posts are"} ready for your yes.` : "No posts waiting on you.", big: true },
        { kind: "text", text: `AI favours sites that stay fresh. I write ${perMonth} posts a month, each answering a question the AIs didn’t name you for${published.length ? ` — ${published.length} published so far` : ""}.${wp ? " Approve one and it goes live on your site." : ""}` },
      ], "ct-sum")]
      if (voiceMsg) msgs.push(voiceMsg)
      for (const d of ready) {
        const m = d.metadata as { title?: string; markdown?: string; topic?: string; imageId?: string | null }
        const docId = `post-${d.id}`
        msgs.push(agent([
          { kind: "doc", title: m.title ?? "New post", meta: `draft · answers “${(m.topic ?? "").slice(0, 70)}”`, text: m.markdown, docId, editable: true, markdown: true, image: m.imageId ? imageUrl(m.imageId) : undefined },
          { kind: "chips", items: [...changeChips("post", wp, { title: m.title, text: m.markdown, docId, draftId: d.id }), { label: "Skip", action: { type: "dismiss" } }] },
        ], `ct-${d.id}`))
      }
      const autoDone = drafts.filter((d) => { const m = d.metadata as { status?: string; auto?: boolean }; return m?.auto && m.status === "published" }).slice(0, 3)
      for (const d of autoDone) {
        const m = d.metadata as { title?: string; url?: string; changeId?: string }
        msgs.push(agent([
          { kind: "text", text: `I published “${m.title}” on my own, as you asked.` },
          { kind: "chips", items: [...(m.url ? [{ label: "Open it", action: { type: "link", href: m.url } } as const] : []), ...(m.changeId ? [{ label: "Undo", action: { type: "wp-undo", changeId: m.changeId } } as const] : [])] },
        ], `ct-auto-${d.id}`))
      }
      msgs.push(agent([{ kind: "chips", items: [{ label: "Write a post now", action: { type: "draft", topic: "auto", mode: "post" }, primary: !ready.length }] }], "ct-more"))
      if (/pro|full/i.test(user.plan)) {
        msgs.push(agent([
          { kind: "text", text: s.autoPublishPosts ? "Auto-publish is on: posts with no missing facts go live without asking, and you can undo any of them." : "Want me to publish posts without asking? Only posts with no missing facts go live, and each one has an Undo." },
          { kind: "chips", items: [s.autoPublishPosts
            ? { label: "Turn auto-publish off", action: { type: "setting", key: "autoPublishPosts", value: false, done: "Auto-publish is off. I’ll ask before each post goes live." } }
            : { label: "Turn auto-publish on", action: { type: "setting", key: "autoPublishPosts", value: true, done: "Auto-publish is on. Posts with no missing facts go live on their own — you’ll see each one here with an Undo." }, primary: true }] },
        ], "ct-auto"))
      }
      for (const l of s.locations ?? []) {
        msgs.push(agent([
          { kind: "text", text: `Your ${l.city} location needs its own page so AI knows you’re there.` },
          { kind: "chips", items: [{ label: `Write the ${l.city} page`, action: { type: "draft", topic: `${l.city} location page`, mode: "location", locationId: l.id } }] },
        ], `ct-loc-${l.id}`))
      }
      return { autorun: [], messages: msgs }
    }

    // ── Competitors ───────────────────────────────────────────────────────
    case "competitors": {
      const [comps, gapRow] = await Promise.all([
        db.competitor.findMany({ where: { userId }, orderBy: { analyzedAt: "desc" }, take: 6 }),
        db.contentGap.findFirst({ where: { userId }, orderBy: { analyzedAt: "desc" } }),
      ])
      if (comps.length === 0) {
        return { autorun: [], messages: [agent([{ kind: "text", text: "I haven’t found your competitors yet.", big: true }, { kind: "text", text: "I pick them up from the businesses the AIs name instead of you. Ask the AIs once and I’ll start watching the top ones." }, { kind: "chips", items: [{ label: "Ask the AIs now", action: { type: "link", href: "/dashboard" }, primary: true }] }], "cp-none")] }
      }
      const msgs: Message[] = [agent([{ kind: "text", text: `I’m watching ${comps.length} ${comps.length === 1 ? "competitor" : "competitors"} and re-reading their sites every week.`, big: true }, { kind: "text", text: "Here’s what’s working for them — and the gaps I can close for you." }], "cp-sum")]
      for (const c of comps.slice(0, 3)) {
        const d = isRecord(c.crawlData) ? c.crawlData : {}
        const strengths = (Array.isArray(d.strengths) ? d.strengths : []).filter((s): s is string => typeof s === "string").slice(0, 3)
        const name = c.name || host(c.url)
        if (!strengths.length) continue
        msgs.push(agent([{ kind: "text", text: `What’s working for ${name}:` }, { kind: "receipt", title: name, sub: host(c.url), items: strengths }], `cp-${c.id}`))
      }
      const gaps = Array.isArray(gapRow?.gaps) ? (gapRow!.gaps as { topic?: string; priority?: string; suggestedTitle?: string }[]) : []
      const rival = gapRow ? host(gapRow.competitorUrl) : ""
      for (const g of gaps.filter((g) => g.topic).sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0)).slice(0, 3)) {
        msgs.push(
          agent([
            { kind: "text", text: `${rival} answers “${g.topic}”. You don’t — so when AI gets asked, they’re the answer.` },
            { kind: "chips", items: [{ label: "Draft it for me", action: { type: "draft", topic: g.suggestedTitle || g.topic!, competitor: rival }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
          ], `gap-${g.topic}`)
        )
      }
      return { autorun: [], messages: msgs }
    }

    // ── Weekly Briefings ──────────────────────────────────────────────────
    case "briefings": {
      const [reports, roi] = await Promise.all([
        db.weeklyReport.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 }),
        getRoi(userId).catch(() => null),
      ])
      const results = roi ? roiLines(roi) : []
      const resultsMsg: Message = results.length
        ? agent([{ kind: "divider", text: "Your results" }, { kind: "text", text: results[0], big: true }, ...results.slice(1).map((t) => ({ kind: "text", text: t }) as Block)], "br-roi")
        : agent([
            { kind: "text", text: "I can’t see your results yet.", big: true },
            { kind: "text", text: "Connect Google and I’ll show the calls and direction requests your listing gets. Connect your website and I’ll count every visitor ChatGPT, Perplexity, Claude or Gemini sends you." },
            { kind: "chips", items: [
              ...(user.integration ? [] : [{ label: "Connect Google", action: { type: "link", href: "/api/integrations/google/connect?go=1" }, primary: true } as const]),
              { label: "Connect my website", action: { type: "wp-connect" } },
            ] },
          ], "br-roi")
      if (reports.length === 0) {
        return { autorun: [], messages: [resultsMsg, agent([{ kind: "text", text: "Your first briefing lands Monday morning.", big: true }, { kind: "text", text: "Each week I’ll tell you what I did, what moved, and what I need a yes on — here and by email." }], "br-none")] }
      }
      const msgs: Message[] = [resultsMsg]
      for (const r of reports) {
        const week = r.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })
        const delta = isRecord(r.visibilityDelta) ? (r.visibilityDelta as Record<string, number>) : {}
        const up = Object.entries(delta).filter(([, v]) => typeof v === "number" && v > 0).map(([k]) => ENGINE_NAME[k] ?? k)
        const down = Object.entries(delta).filter(([, v]) => typeof v === "number" && v < 0).map(([k]) => ENGINE_NAME[k] ?? k)
        const lines: string[] = []
        if (up.length) lines.push(`${up.join(" and ")} started naming you.`)
        if (down.length) lines.push(`${down.join(" and ")} stopped naming you — I’m on it.`)
        if (!up.length && !down.length) lines.push("No change in which AIs name you.")
        if (r.postsPublished > 0) lines.push(`I published ${r.postsPublished} ${r.postsPublished === 1 ? "update" : "updates"} to your Google listing.`)
        if (r.reviewsNew > 0) lines.push(`You got ${r.reviewsNew} new ${r.reviewsNew === 1 ? "review" : "reviews"}.`)
        const movers = (Array.isArray(r.keywordMovers) ? r.keywordMovers : []) as { query?: string; positionBefore?: number; positionAfter?: number }[]
        const real = movers.filter((m) => m.query && typeof m.positionAfter === "number" && m.positionAfter > 0 && m.positionBefore !== m.positionAfter).slice(0, 2)
        for (const m of real) lines.push(`On Google, “${m.query}” moved from #${Math.round(m.positionBefore ?? 0)} to #${Math.round(m.positionAfter!)}.`)
        msgs.push(agent([{ kind: "divider", text: `Week of ${week}` }, { kind: "text", text: lines[0], big: true }, ...lines.slice(1).map((t) => ({ kind: "text", text: t }) as Block), ...(r.emailSent ? [{ kind: "text", text: "Also sent to your inbox." } as Block] : [])], `br-${r.id}`))
      }
      return { autorun: [], messages: msgs }
    }
  }
}


async function listingsAutorun(userId: string): Promise<Task[]> {
  const [p, l] = await Promise.all([cachedCheck(userId, "profiles", 7 * 86_400_000), cachedCheck(userId, "listings", 7 * 86_400_000)])
  return [...(p ? [] : ["profiles" as Task]), ...(l ? [] : ["listings" as Task])]
}

async function listingsTail(userId: string, plan: string, s: Awaited<ReturnType<typeof getAgentSettings>>): Promise<Message[]> {
  const [p, l] = await Promise.all([cachedCheck<ProfilesResult>(userId, "profiles", 7 * 86_400_000), cachedCheck<ListingsResult>(userId, "listings", 7 * 86_400_000)])
  const out: Message[] = []
  out.push(...(p ? profileMessages(p.data) : [agent([{ kind: "text", text: "Checking your social and review profiles…" }], "profiles-run")]))
  out.push(...(l ? listingsMessages(l.data) : [agent([{ kind: "text", text: "Checking your details on the directories AI reads…" }], "listings-run")]))
  const extra = maxExtraLocations(plan)
  const locs = s.locations ?? []
  out.push(agent([
    { kind: "text", text: locs.length ? `Your other locations: ${locs.map((x) => `${x.name} (${x.city})`).join(", ")}.` : extra ? "Got more than one location? Add each one — I’ll write its page, give it its own structured data, and track questions for its city." : "More locations come with the Pro plan (up to 3)." },
    { kind: "chips", items: extra > locs.length ? [{ label: "Add a location", action: { type: "location-add" } }] : locs.length ? [] : [{ label: "See plans", action: { type: "link", href: "/pricing" } }] },
  ], "ls-locs"))
  return out
}
