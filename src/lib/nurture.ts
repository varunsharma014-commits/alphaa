// Scan-lead nurture: the steps, the facts we're allowed to use, and the copy.
// Pure (no DB, no network) so it can be rendered and checked locally.
//
// Day 0 is the report email (lib/scan-email.ts), sent when the scan finishes.
// This module covers everything after it: a daily burst on Days 1-4 (when
// people are most likely to buy), then one short, useful email a week on Days
// 11-60. Day 60 is the last email, ever. Copy rules: the agent's first-person
// voice, 60-130 words, one CTA, no em-dashes, only facts from the lead's own
// scan, and exactly the four AIs we check.

import { CHECK_IMPACT, CHECK_SHORT, type CheckKey } from "@/lib/site-check-labels"
import type { NurtureBlock } from "@/emails/NurtureEmail"

export const NURTURE_DAYS = [1, 2, 3, 4, 11, 18, 25, 32, 39, 46, 53, 60] as const
export type NurtureDay = (typeof NURTURE_DAYS)[number]
export const LAST_NURTURE_DAY = 60
/** Written to ogData.nurture.schedule on every send, so stored steps from the old schedule can be told apart. */
export const NURTURE_SCHEDULE = 2

export interface LeadFacts {
  leadId: string
  /** Never empty: business name, else the site's domain, else "your business". */
  name: string
  /** True when name is the generic fallback (so copy can avoid "for your business" awkwardness). */
  nameIsGeneric: boolean
  city: string | null
  /** Engines with a verdict in the scan, and which of those named the business. */
  checked: number
  named: string[]
  /** Up to 2 businesses the AIs named instead, most-named first. */
  rivals: string[]
  /** Plain-English gaps the rivals' sites cover and this site doesn't (max 3). */
  gaps: string[]
  /** First Q&A of the stored quick-fix FAQ draft, if one exists. */
  draft: { question: string; answer: string } | null
}

export interface NurtureCopy {
  subject: string
  preview: string
  blocks: NurtureBlock[]
  cta: { label: string; href: string }
  after?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

const noDash = (s: string) => s.replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim()

const stripTags = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, "\"").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()

// Legacy: the Claude verdict is stored under google_ai.
const ENGINES: { key: string; label: string }[] = [
  { key: "chatgpt", label: "ChatGPT" },
  { key: "gemini", label: "Gemini" },
  { key: "google_ai", label: "Claude" },
  { key: "perplexity", label: "Perplexity" },
]

export function extractLeadFacts(lead: {
  id: string
  businessName: string | null
  businessUrl: string | null
  city: string | null
  aiSearchStatus: unknown
  ogData: unknown
}): LeadFacts {
  let name = (lead.businessName ?? "").trim()
  if (!name && lead.businessUrl) {
    try {
      const u = lead.businessUrl.startsWith("http") ? lead.businessUrl : `https://${lead.businessUrl}`
      name = new URL(u).hostname.replace(/^www\./, "")
    } catch {
      name = ""
    }
  }
  const nameIsGeneric = !name
  if (!name) name = "your business"

  const rawCity = (lead.city ?? "").trim()
  const city = rawCity && !/^your area$/i.test(rawCity) ? rawCity : null

  const status = isRecord(lead.aiSearchStatus) ? lead.aiSearchStatus : {}
  let checked = 0
  const named: string[] = []
  for (const e of ENGINES) {
    const v = status[e.key]
    if (typeof v !== "string" || !v) continue
    checked++
    if (v === "occasionally" || v === "frequently") named.push(e.label)
  }

  const og = isRecord(lead.ogData) ? lead.ogData : {}
  const insights = isRecord(og.insights) ? og.insights : {}

  // Rivals: competitorDetails ranked by how many AIs named them; fall back to v1 names.
  let rivals: string[] = []
  if (Array.isArray(insights.competitorDetails)) {
    rivals = insights.competitorDetails
      .filter((c): c is Record<string, unknown> => isRecord(c) && typeof c.name === "string" && typeof c.aiMentions === "number" && c.aiMentions > 0)
      .sort((a, b) => (b.aiMentions as number) - (a.aiMentions as number))
      .map((c) => (c.name as string).trim())
  }
  if (rivals.length === 0 && Array.isArray(insights.competitors)) {
    rivals = insights.competitors.filter((c): c is string => typeof c === "string").map((c) => c.trim())
  }
  rivals = rivals.filter((r) => r && r.toLowerCase() !== name.toLowerCase()).slice(0, 2)

  // Gaps: checks this site fails that at least one rival site passes, ranked by impact.
  const gaps: string[] = []
  const sc = isRecord(og.siteChecks) ? og.siteChecks : null
  const you = sc && isRecord(sc.you) && Array.isArray(sc.you.checks) ? (sc.you.checks as unknown[]) : []
  const rivalSites = sc && Array.isArray(sc.competitors) ? (sc.competitors as unknown[]) : []
  if (you.length && rivalSites.length) {
    const rivalPass = new Set<string>()
    for (const site of rivalSites) {
      if (!isRecord(site) || !Array.isArray(site.checks)) continue
      for (const c of site.checks) if (isRecord(c) && c.ok === true && typeof c.key === "string") rivalPass.add(c.key)
    }
    const missing = you
      .filter((c): c is Record<string, unknown> => isRecord(c) && c.ok === false && typeof c.key === "string" && rivalPass.has(c.key as string))
      .map((c) => c.key as CheckKey)
      .filter((k) => k in CHECK_SHORT)
      .sort((a, b) => (CHECK_IMPACT[b] ?? 0) - (CHECK_IMPACT[a] ?? 0))
    for (const k of missing.slice(0, 3)) gaps.push(CHECK_SHORT[k].replace(/\s*[—–]\s*/g, "; "))
  }

  // The stored quick-fix draft (written by /api/scan/quick-fix). First Q&A only.
  let draft: LeadFacts["draft"] = null
  const qf = isRecord(og.quickFix) ? og.quickFix : null
  if (qf && typeof qf.faqHtml === "string") {
    const m = qf.faqHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/i)
    if (m) {
      const question = noDash(stripTags(m[1]))
      let answer = noDash(stripTags(m[2]))
      if (answer.length > 320) answer = `${answer.slice(0, 317).replace(/\s+\S*$/, "")}...`
      if (question && answer) draft = { question, answer }
    }
  }

  return { leadId: lead.id, name, nameIsGeneric, city, checked, named, rivals, gaps, draft }
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

/** "none of the 4 AIs named you" / "2 of the 4 AIs named you (ChatGPT and Gemini)". Null when nothing was checked. */
function namedLine(f: LeadFacts): string | null {
  if (f.checked === 0) return null
  const of = f.checked === 4 ? "the 4 AIs" : `the ${f.checked} AIs I could reach`
  if (f.named.length === 0) return `none of ${of} named you`
  if (f.named.length === f.checked) return `all of ${of} named you`
  return `${f.named.length} of ${of} named you (${list(f.named)})`
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export interface CopyLinks {
  /** Tokenised link to the lead's own report. */
  report: string
  /** Signup carrying the scan, so onboarding picks it up. */
  signup: string
  /** The free check, to re-run it. */
  start: string
}


export function buildNurtureCopy(day: NurtureDay, f: LeadFacts, links: CopyLinks): NurtureCopy {
  const name = f.name
  const nl = namedLine(f)
  const where = f.city ? ` in ${f.city}` : ""
  const you = f.nameIsGeneric ? "you" : name
  const start = { label: "Start today", href: links.signup }
  const recheck = { label: `Re-check ${f.nameIsGeneric ? "your business" : name}`, href: links.start }

  switch (day) {
    // ---- Daily burst: the strongest emails, in order ----

    case 1: {
      const blocks: NurtureBlock[] = []
      blocks.push({ kind: "p", text: nl ? `When I checked ${name}, ${nl}.` : `I checked what the AIs say about ${name}.` })
      blocks.push({ kind: "p", text: `People ask ChatGPT, Gemini, Claude and Perplexity who to hire${where}. They get one answer with a few names.` })
      if (f.rivals.length) blocks.push({ kind: "p", text: `The names I saw most were ${list(f.rivals)}.` })
      if (f.gaps.length) {
        blocks.push({ kind: "p", text: "When I compared your website with theirs, here is what stood out on yours:" })
        blocks.push({ kind: "bullets", items: f.gaps.map(capital) })
      } else {
        blocks.push({ kind: "p", text: "AI tends to name businesses it can verify. Clear answers to the questions customers ask. The same hours, address and services everywhere. Reviews it can read." })
      }
      blocks.push({ kind: "p", text: "None of this is hard. It just has to be done, and kept up." })
      return {
        subject: f.rivals.length ? `Why AI named ${f.rivals[0]} instead` : `Why AI picks other businesses over ${f.nameIsGeneric ? "yours" : name}`,
        preview: f.rivals.length ? `What they have that ${name} doesn't, yet.` : "What AI looks for before it names a business.",
        blocks,
        cta: { label: "See your full report", href: links.report },
      }
    }

    case 2: {
      if (f.draft) {
        return {
          subject: "I already drafted your fix",
          preview: `A ready answer for "${f.draft.question}"`,
          blocks: [
            { kind: "p", text: `I already drafted a fix for ${name}.` },
            { kind: "p", text: "It answers a question your customers ask, written so AI can quote it:" },
            { kind: "quote", text: `${f.draft.question} ${f.draft.answer}` },
            { kind: "p", text: "Anything in [brackets] is a fact only you know, so I left it for you. I never guess." },
            { kind: "p", text: "Once you start, I keep writing these, add the code AI reads, and you approve each one before it goes live." },
          ],
          cta: start,
        }
      }
      return {
        subject: `What I'd write first for ${name}`,
        preview: "A plain FAQ, written so AI can quote it.",
        blocks: [
          { kind: "p", text: `Here is what I'd draft first for ${name}.` },
          { kind: "p", text: `An FAQ that answers the questions your customers ask AI${where}. The answer comes in the first sentence, in plain words.` },
          { kind: "p", text: "Then the behind-the-scenes code that tells AI your hours, address and services." },
          { kind: "p", text: "I don't guess facts. Anything only you know, I ask you for. You approve every piece before it goes live." },
        ],
        cta: start,
      }
    }

    case 3:
      return {
        subject: "Can anyone guarantee ChatGPT?",
        preview: "Short answer: no. Here's what I put in writing instead.",
        blocks: [
          { kind: "p", text: "Short answer: no. Nobody controls what ChatGPT says. Anyone who promises you a top spot is guessing." },
          { kind: "p", text: "What can be done is fixing what AI reads about you, then checking every week to see if it worked." },
          { kind: "p", text: `So here is what I put in writing. If none of the 4 AIs names ${name} in our weekly checks during your first 90 days, your next month is free. Once per customer.` },
          { kind: "p", text: "And there's a 7-day refund on your first charge if it isn't for you." },
        ],
        cta: start,
      }

    case 4:
      return {
        subject: `What $99 a month does for ${name}`,
        preview: `What I'd do for ${name} every week.`,
        blocks: [
          { kind: "p", text: `Customers ask AI who to hire. Here is what I'd do every week so ${name} is in the answer:` },
          {
            kind: "bullets",
            items: [
              "Ask ChatGPT, Gemini, Claude and Perplexity about you, and tell you what changed",
              "Publish 2 Google posts a week",
              "Write 2 blog posts a month that AI can quote",
              "Watch your reviews",
            ],
          },
          { kind: "p", text: "That's Starter, $99 a month. Month to month. Cancel in two clicks. 7-day refund on the first charge." },
          { kind: "p", text: "For comparison, an agency is often around $2,000 a month, and most still work on Google links, not AI answers." },
        ],
        cta: start,
      }

    // ---- Weekly: one useful idea each, one CTA ----

    case 11:
      return {
        subject: "AI answers change. Has yours?",
        preview: `It's been over a week since I checked ${name}.`,
        blocks: [
          { kind: "p", text: `It's been over a week since I checked ${name}.` },
          ...(nl ? [{ kind: "p" as const, text: `Back then, ${nl}.` }] : []),
          { kind: "p", text: "AI answers aren't fixed. They shift as businesses publish, collect reviews and update their details. Last week's answer can be different today." },
          { kind: "p", text: "The only way to know is to ask again. It takes about a minute and it's free." },
          { kind: "p", text: "You'll see the actual answer each AI gives, not a summary." },
        ],
        cta: recheck,
      }

    case 18:
      return {
        subject: "3 things AI checks before it names a business",
        preview: "What AI looks for, in plain words.",
        blocks: [
          { kind: "p", text: "Before ChatGPT, Gemini, Claude or Perplexity names a local business, it looks for things it can trust. Three matter most:" },
          {
            kind: "bullets",
            items: [
              "Clear answers. A page that answers what customers ask, in the first sentence.",
              "The same facts everywhere. Hours, address and services that match on your site, your Google profile and directories.",
              "Reviews it can read. Recent ones, on sites AI can see.",
            ],
          },
          { kind: "p", text: `If ${name} is missing one, that's usually where I'd start.` },
          { kind: "p", text: "Once you start, I work on all three every week. You approve each change before it goes live." },
        ],
        cta: start,
      }

    case 25: {
      const rival = f.rivals[0] ?? "them"
      return {
        subject: "Ask ChatGPT why it picked them",
        preview: "A two-minute test you can run yourself.",
        blocks: [
          { kind: "p", text: "Here's a quick test you can run yourself today." },
          { kind: "p", text: `Ask ChatGPT for a business like yours${where}. Then ask it: "Why did you recommend ${rival} and not us?"` },
          { kind: "p", text: "It will often tell you. More reviews. A clearer list of services. An FAQ that answers the question. Hours it could confirm." },
          { kind: "p", text: "Write down what it says. That list is your to-do list." },
          { kind: "p", text: "Want the same answer from Gemini, Claude and Perplexity too? The free check asks all four at once and shows who they named." },
        ],
        cta: { label: "Run the free check", href: links.start },
      }
    }

    case 32:
      return {
        subject: "When AI gets your hours wrong",
        preview: "AI repeats what it finds. Here's an example.",
        blocks: [
          { kind: "p", text: "Here's an example of how this happens." },
          { kind: "p", text: "Someone asks ChatGPT if a dental office is open on Saturday. It says no. The office is open on Saturday, but an old directory listing still had the old hours, and that's what AI repeated." },
          { kind: "p", text: "AI repeats what it can find. Old hours, a closed location or a service you stopped offering can all end up in the answer." },
          { kind: "p", text: "The fix is simple: the same facts on your website, your Google profile and the main directories, plus code on your site that states them clearly." },
          { kind: "p", text: `Once you start, I check these facts for ${name} every week and fix what's wrong. You approve each change.` },
        ],
        cta: start,
      }

    case 39:
      return {
        subject: "Reviews AI can actually read",
        preview: "Not every review helps you get named.",
        blocks: [
          { kind: "p", text: "Reviews help a business get recommended, but only the ones AI can find and trust." },
          { kind: "p", text: "What tends to count:" },
          {
            kind: "bullets",
            items: [
              "Recent reviews, not only old ones",
              "Reviews that name the service, like \"fixed our AC the same day\"",
              "Your replies, which show the business is active",
              "Reviews on more than one site",
            ],
          },
          { kind: "p", text: "A simple habit: after a good job, ask the customer to mention what you did for them. Specific words give AI something to quote." },
          { kind: "p", text: `Want to see what the four AIs say about ${you} now? The check is free and takes about a minute.` },
        ],
        cta: recheck,
      }

    case 46:
      return {
        subject: "One page per service",
        preview: "Why one long services list gets passed over.",
        blocks: [
          { kind: "p", text: "When a customer asks AI for a specific service, AI looks for a page about that service." },
          { kind: "p", text: "One services page listing ten things gives it little to quote. A page for each service gives it a clear answer." },
          { kind: "p", text: "Each page needs three things:" },
          {
            kind: "bullets",
            items: [
              "What the service is, in plain words",
              `Who it's for and where you offer it${where}`,
              "Answers to the questions people ask before they book",
            ],
          },
          { kind: "p", text: `Once you start, I draft these pages for ${name}. You approve each one before it goes live.` },
        ],
        cta: start,
      }

    case 53:
      return {
        subject: "Put the answer in the first sentence",
        preview: "One small writing change AI notices.",
        blocks: [
          { kind: "p", text: "One small writing change makes a page easier for AI to quote." },
          { kind: "p", text: "Put the answer first. If someone asks \"Do you do same-day repairs?\", start with \"Yes, same day, Monday to Saturday.\" Then explain." },
          { kind: "p", text: "AI looks for short, direct answers. A paragraph of background before the answer makes it easy to skip." },
          { kind: "p", text: "Look at your FAQ or service pages this week. Does each answer start with the answer?" },
          { kind: "p", text: `Want to see whether the AIs name ${you} today? The check is free and takes about a minute.` },
        ],
        cta: recheck,
      }

    case 60:
      return {
        subject: `Should I stop checking for ${you}?`,
        preview: "This is my last email.",
        blocks: [
          { kind: "p", text: `I've written to you a few times since you checked ${name}. I don't want to be noise.` },
          { kind: "p", text: "So this is my last email. After today I won't write again." },
          { kind: "p", text: "If you want me working on it, start today. Your check is saved, so I'll pick up where we left off." },
          { kind: "p", text: "If now isn't the right time, that's fine. Just reply \"later\" and tell me what would help. A person reads every reply." },
        ],
        cta: start,
      }
  }
}

/**
 * Map a stored nurture step onto this schedule. Steps written before
 * `schedule: 2` used the old days (1/3/5/7/10/14/30/60/90) and some numbers
 * collide with new days, so map by content: whatever they already got is
 * treated as sent, and nothing is ever resent.
 */
export function currentStep(rawStep: number, schedule: unknown): number {
  if (schedule === NURTURE_SCHEDULE) return rawStep
  if (rawStep <= 0) return 0
  const legacy: Record<number, number> = {
    1: 1, // why AI named them
    3: 2, // drafted fix
    5: 3, // guarantee
    7: 4, // offer
    10: 11, // re-check
  }
  // The old break-up (14) and monthly re-checks: the sequence is finished.
  return legacy[rawStep] ?? LAST_NURTURE_DAY
}

/**
 * Which step (if any) to send now. One step per call, never one already sent.
 *
 * Burst (Days 1-4): strictly in order, so a missed or late cron run delays a
 * step by a day instead of skipping it. The cron runs once a day at 16:00 UTC,
 * so a lead's first run with ageDays >= 1 sends Day 1 and the next three runs
 * send Days 2, 3 and 4 on consecutive days (the 20h per-address guard allows a
 * daily send). If the burst is still unfinished a week in, it stops catching up.
 *
 * Weekly (Days 11-60): only the latest due step is sent; missed ones are
 * skipped, so a long outage never turns into a daily backlog.
 *
 * Steps count as due 2 hours early: the run fires at a fixed time each day but
 * a few seconds late or early, and without slack a scan made right at 16:00 UTC
 * would land at 2.9999 days and slip a burst step by a day. (The route still
 * waits a full 24h after the scan before Day 1.)
 */
const DUE_SLACK_DAYS = 2 / 24

export function dueStep(ageDays: number, lastStep: number): NurtureDay | null {
  const age = ageDays + DUE_SLACK_DAYS
  const next = NURTURE_DAYS.find((d) => d > lastStep)
  if (next === undefined || age < next) return null
  if (next <= 4 && age < 7) return next
  let due: NurtureDay | null = null
  for (const d of NURTURE_DAYS) if (d > lastStep && age >= d) due = d
  return due
}
