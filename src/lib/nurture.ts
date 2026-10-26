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
import { scanEngineRows } from "@/lib/scan-engines"

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


export function extractLeadFacts(lead: {
  id: string
  businessName: string | null
  businessUrl: string | null
  city: string | null
  aiSearchStatus: unknown
  ogData: unknown
  /** New-contract rows hold one entry per engine that actually answered. */
  engineResponses?: unknown
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

  // Only engines that actually answered count as "checked" (unknown is not
  // "didn't name you"): shared with the report emails via scanEngineRows().
  let checked = 0
  const named: string[] = []
  for (const row of scanEngineRows({ aiSearchStatus: lead.aiSearchStatus, engineResponses: lead.engineResponses })) {
    if (row.status === "unknown") continue
    checked++
    if (row.status === "found") named.push(row.name)
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
  // [Business / you] and [Business / your website]
  const you = f.nameIsGeneric ? "you" : name
  const site = f.nameIsGeneric ? "your website" : name
  const start = { label: "Start today", href: links.signup }
  const recheck = { label: "Re-check your business", href: links.start }

  switch (day) {
    // ---- Daily burst: the strongest emails, in order ----

    case 1: {
      const blocks: NurtureBlock[] = []
      // No verdict at all (no AI answered): never claim "none of the 4 named you".
      blocks.push({ kind: "p", text: nl ? `When I checked ${site}, ${nl}.` : `I checked what the AIs say about ${site}.` })
      blocks.push({ kind: "p", text: `When people ask ChatGPT or Gemini who to hire${where}, they get one answer with a few names.${f.rivals.length ? ` The names I saw most were ${list(f.rivals)}.` : ""}` })
      if (f.gaps.length) {
        blocks.push({ kind: "p", text: "When I compared your website with theirs, here is why AI likely skipped you:" })
        blocks.push({ kind: "bullets", items: f.gaps.map(capital) })
      }
      blocks.push({ kind: "p", text: "AI names businesses it can verify. It looks for clear answers, identical hours everywhere, and code it can read. None of this is hard. It just has to be done." })
      return {
        subject: `Why AI picked ${f.rivals[0] ?? "them"} instead of you.`,
        preview: f.rivals.length ? `What ${f.rivals[0]} has that AI could verify.` : "What AI looks for before it names a business.",
        blocks,
        cta: { label: "See your full report", href: links.report },
      }
    }

    case 2: {
      if (f.draft) {
        return {
          subject: "I already drafted your first fix.",
          preview: `A ready answer for "${f.draft.question}"`,
          blocks: [
            { kind: "p", text: `I already drafted a fix for ${site}.` },
            { kind: "p", text: "It answers a question your customers ask, written so AI can quote it easily:" },
            { kind: "quote", text: `"${f.draft.question} ${f.draft.answer}"` },
            { kind: "p", text: "Anything in brackets is a fact only you know, so I left it for you. I never guess." },
            { kind: "p", text: "Once you start, I keep writing these. I add the code AI reads, and you approve each one before it goes live." },
          ],
          cta: start,
        }
      }
      // No stored draft for this lead: don't claim one exists.
      return {
        subject: `What I'd write first for ${you}.`,
        preview: "A plain FAQ, written so AI can quote it.",
        blocks: [
          { kind: "p", text: `Here is what I'd draft first for ${site}.` },
          { kind: "p", text: `An FAQ that answers the questions your customers ask AI${where}. The answer comes in the first sentence, in plain words.` },
          { kind: "p", text: "Then the code AI reads, stating your hours, address and services." },
          { kind: "p", text: "I never guess facts. Anything only you know, I ask you for. You approve each piece before it goes live." },
        ],
        cta: start,
      }
    }

    case 3:
      return {
        subject: "Can anyone guarantee ChatGPT?",
        preview: "Short answer: no. Here is what I put in writing.",
        blocks: [
          { kind: "p", text: "Short answer: no." },
          { kind: "p", text: "Nobody controls what ChatGPT says. Anyone who promises you a top spot is guessing." },
          { kind: "p", text: "What can be done is fixing the facts AI reads about you, then checking every week to see if it worked." },
          { kind: "p", text: `Here is what I put in writing. If none of the 4 major AIs names ${you} in our weekly checks during your first 90 days, your next month is free. Once per customer.` },
        ],
        cta: start,
      }

    case 4:
      return {
        subject: `What $99 a month does for ${you}.`,
        preview: "Here is what I do every week so you are in the answer.",
        blocks: [
          { kind: "p", text: "Customers ask AI who to hire. Here is what I do every week so you are in the answer:" },
          {
            kind: "bullets",
            items: [
              "Ask ChatGPT, Gemini, Claude, and Perplexity about you.",
              "Tell you exactly what changed.",
              "Draft the answers AI needs to read.",
              "Keep your Google profile active.",
            ],
          },
          { kind: "p", text: "That is $99 a month. Month to month. Cancel in two clicks." },
          { kind: "p", text: "An agency is often $2,000 a month, and most still focus on Google links. I focus entirely on AI answers." },
        ],
        cta: start,
      }

    // ---- Weekly: one useful idea each, one CTA ----

    case 11:
      return {
        subject: "AI answers change. Has yours?",
        preview: "Last week's answer might be different today.",
        blocks: [
          { kind: "p", text: `It has been over a week since I checked ${site}.` },
          ...(nl ? [{ kind: "p" as const, text: `Back then, ${nl}.` }] : []),
          { kind: "p", text: "AI answers shift as businesses publish new answers and update their details. Last week's answer might be different today." },
          { kind: "p", text: "The only way to know is to ask again. It takes about a minute, and it is free." },
        ],
        cta: recheck,
      }

    case 18:
      return {
        subject: "3 things AI checks before it names a business.",
        preview: "Before AI names a business, it looks for facts it can trust.",
        blocks: [
          { kind: "p", text: "Before ChatGPT or Perplexity names a business, it looks for facts it can trust. Three matter most:" },
          {
            kind: "numbered",
            items: [
              "Clear answers to customer questions.",
              "The exact same hours and address everywhere.",
              "Reviews it can actually read.",
            ],
          },
          { kind: "p", text: `If ${you} ${f.nameIsGeneric ? "are" : "is"} missing one, that is where I start.` },
          { kind: "p", text: "Once you hire me, I work on this every week. You approve each change before it goes live." },
        ],
        cta: start,
      }

    case 25:
      return {
        subject: "Ask ChatGPT why it picked them.",
        preview: "A test you can run yourself today.",
        blocks: [
          { kind: "p", text: "Here is a test you can run yourself today." },
          { kind: "p", text: `Ask ChatGPT for a business like yours${where}. Then ask it: "Why did you recommend them and not us?"` },
          { kind: "p", text: "It will often tell you. They had a clearer list of services, hours it could verify, or an FAQ that answered the question directly." },
          { kind: "p", text: "Write down what it says. That is your to-do list. Or, you can have me do it for you." },
        ],
        cta: { label: "Run the free check to see all four AIs at once", href: links.start },
      }

    case 32:
      return {
        subject: "When AI gets your hours wrong.",
        preview: "AI repeats what it finds.",
        blocks: [
          { kind: "p", text: "Here is how this can happen. Someone asks ChatGPT if a business is open on Saturday. It says no. The business is actually open, but an old directory listing had the wrong hours, and AI repeated it." },
          { kind: "p", text: "AI repeats what it finds. A closed location or an old service can easily end up in the answer." },
          { kind: "p", text: "The fix is putting the exact same facts on your website and Google profile, plus adding the specific code AI engines read." },
          { kind: "p", text: "Once you start, I check these facts every week and fix what is wrong." },
        ],
        cta: start,
      }

    case 39:
      return {
        subject: "Reviews AI can actually read.",
        preview: "Reviews help you get recommended, but only the ones AI can find.",
        blocks: [
          { kind: "p", text: "Reviews help you get recommended, but only the ones AI can find." },
          { kind: "p", text: "What counts:" },
          {
            kind: "bullets",
            items: [
              "Recent reviews.",
              "Reviews that name the specific service provided.",
              "Your replies to the customer.",
            ],
          },
          { kind: "p", text: "A simple habit: after a great job, ask the customer to mention exactly what you fixed. Specific words give AI something to quote." },
          { kind: "p", text: "Want to see what the AIs say about you today?" },
        ],
        cta: recheck,
      }

    case 46:
      return {
        subject: "One page per service.",
        preview: "AI looks for a page dedicated to the service a customer asks about.",
        blocks: [
          { kind: "p", text: "When a customer asks AI for a specific service, AI looks for a page dedicated to that service." },
          { kind: "p", text: "One long page listing ten different services gives it nothing specific to quote." },
          { kind: "p", text: "Each service needs its own page stating what it is, who it is for, and answers to common questions." },
          { kind: "p", text: `Once you start, I draft these pages for ${you}. You tap approve, and I publish them.` },
        ],
        cta: start,
      }

    case 53:
      return {
        subject: "Put the answer in the first sentence.",
        preview: "One small writing change makes it easier for AI to quote you.",
        blocks: [
          { kind: "p", text: "One small writing change makes it easier for AI to quote you: put the answer first." },
          { kind: "p", text: "If someone asks \"Do you do same-day repairs?\", start your page with \"Yes, we do same-day repairs from Monday to Saturday.\" Then explain the details." },
          { kind: "p", text: "AI skips paragraphs of background. It looks for direct answers." },
          { kind: "p", text: "Want to see if this changed your AI visibility today?" },
        ],
        cta: recheck,
      }

    case 60:
      return {
        subject: "Should I stop checking?",
        preview: "This is my last email.",
        blocks: [
          { kind: "p", text: "I have written a few times since I first checked your AI visibility. I do not want to be noise." },
          { kind: "p", text: "This is my last email." },
          { kind: "p", text: "If you want me working on getting you recommended by AI, start today. I saved your scan, so we can pick up right where we left off." },
          { kind: "p", text: "If the timing is wrong, just reply \"later.\" A real person reads every reply." },
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
