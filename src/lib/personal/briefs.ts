// Per-step briefs for the personal writer: the scan-lead nurture (days 1-60)
// and the "signed up, hasn't paid" convert sequence (days 1-45), plus the
// convert template used when the writer falls back.

import type { NurtureCopy } from "@/lib/nurture"
import { ENGINE_NAME, type Dossier } from "./research"
import type { Brief } from "./writer"

/** The guarantee, exactly as the Day 3 template states it. */
export function guaranteeSentence(d: Dossier): string {
  const you = d.business.nameIsGeneric ? "you" : d.business.name
  return `If none of the 4 major AIs names ${you} in our weekly checks during your first 90 days, your next month is free.`
}

const firstRival = (d: Dossier) => d.rivals[0]?.name ?? "the businesses AI named"
const freshEngine = (d: Dossier) => (d.fresh?.freshAnswer ? ENGINE_NAME[d.fresh.freshAnswer.engine] : "one of the AIs")

// ── scan-lead nurture ────────────────────────────────────────────────────────

export function leadBrief(day: number, d: Dossier): Brief {
  const rival = firstRival(d)
  switch (day) {
    case 1:
      return {
        day, prefer: ["scan:", "rival:", "gap:"],
        goal: `Who the AIs named instead of ${d.business.name} when I asked the customer question, by name (lead with ${rival} if present), and the specific gaps on their site vs those rivals that likely explain it. Ask them to see the full report.`,
      }
    case 2:
      return {
        day, prefer: ["draft:", "gap:", "rival:"],
        goal: "The first fix I already drafted for them (quote the drafted FAQ question if the dossier has one) and why it answers what AI was asked. If there is no draft, say what I'd write first, tied to a named rival's advantage. Ask them to start.",
      }
    case 3:
      return {
        day, prefer: ["fresh:", "rival:", "scan:"],
        required: [guaranteeSentence(d), "Once per customer."],
        allowNumbers: [4, 90],
        goal: "Nobody controls what an AI says, so nobody honest promises a spot. Tie it to one concrete fact about them (a rival AI named, or what an AI said). Then state the guarantee using the required sentences. Ask them to start.",
      }
    case 4:
      return {
        day, prefer: ["gap:", "rival:", "google:", "fresh:"],
        required: ["That is $99 a month."],
        allowNumbers: [99],
        goal: `What I'd do for ${d.business.name} THIS week if they start, as 2 to 4 bullets built from their own gaps and rivals (not generic features). Then the price via the required sentence, month to month, cancel any time. Ask them to start.`,
      }
    case 11:
      return {
        day, prefer: ["fresh:"],
        goal: `I asked ${freshEngine(d)} the same customer question again today. Say exactly who it named and whether ${d.business.name} was named. Compare with the first check if useful. Ask them to re-check all four AIs.`,
      }
    case 18:
      return {
        day, prefer: ["rival:", "fresh:"],
        goal: `What ${rival} (or another named rival) published or changed on its website recently (use the newest post/page fact with its title and date), and what it means for being named by AI. If no rival activity fact exists, use what a rival's site has that theirs doesn't. Ask them to start.`,
      }
    case 25:
      return {
        day, prefer: ["google:", "rival:", "scan:"],
        goal: "Google vs AI for their keyword: where they sit on Google (or that they're not on page one) vs named rivals, and how that compares to who the AIs named. Show that the two lists differ. Ask them to run the free check to see all four AIs at once.",
      }
    case 32:
      return {
        day, prefer: ["own:", "social:"],
        goal: "Their own most recent post, page or social post (by title/date), and one concrete way to make it easier for AI to quote (answer first, name the service and city, an FAQ). If they have no recent post, say their newest page is old vs a rival's recent one. Ask them to start.",
      }
    case 39:
      return {
        day, prefer: ["rival:", "fresh:", "gap:reviews"],
        goal: "Reviews AI can read: tie it to a named rival who is being named by AI, and to any review or trust gap in the dossier. Give one habit they can start this week. Never invent review counts. Ask them to re-check what the AIs say today.",
      }
    case 46:
      return {
        day, prefer: ["rival:", "gap:pages", "gap:depth", "google:"],
        goal: "Service pages: AI looks for a page dedicated to the exact service asked about. Compare with a named rival's site using dossier facts (pages, FAQ, blog). Say I would draft those pages and they approve each one. Ask them to start.",
      }
    case 53:
      return {
        day, prefer: ["own:", "draft:", "scan:question"],
        goal: "Take one of THEIR own page titles or headings from the dossier (or the customer question if none) and show how I'd rewrite its first sentence answer-first. Keep the rewrite free of invented facts (use [brackets] for anything only they know). Ask them to re-check.",
      }
    default:
      return {
        day, prefer: ["fresh:", "rival:", "scan:"],
        required: ["This is my last email."],
        goal: "The last email in the sequence. One final, specific fact about them (who an AI named most recently, or a rival's latest move). No guilt, no pressure. I saved their scan so we can pick up where we left off. Tell them a reply of \"later\" is fine and a real person reads replies. Ask them to start.",
      }
  }
}

// ── signed up, hasn't paid ───────────────────────────────────────────────────

export const CONVERT_DAYS = [1, 3, 5, 8, 12, 17, 24, 31, 45] as const
export type ConvertDay = (typeof CONVERT_DAYS)[number]
export const LAST_CONVERT_DAY = 45

/** Latest due step after the last one sent (missed steps are skipped, never resent). */
export function convertDueStep(ageDays: number, lastStep: number): ConvertDay | null {
  const age = ageDays + 2 / 24
  if (age > LAST_CONVERT_DAY + 2) return null
  let due: ConvertDay | null = null
  for (const d of CONVERT_DAYS) if (d > lastStep && age >= d) due = d
  return due
}

export function convertBrief(day: ConvertDay, d: Dossier): Brief {
  const rival = firstRival(d)
  const start = "They created an Alphaa account but haven't started a plan. The ask is to start their plan."
  switch (day) {
    case 1:
      return {
        day, prefer: ["scan:", "audit:", "rival:", "gap:"],
        goal: `${start} What I found when I checked ${d.business.name}: who the AIs named instead (lead with ${rival} if present) and the top gap on their site vs rivals. Then the first thing I would do once they start.`,
      }
    case 3:
      return {
        day, prefer: ["fresh:", "scan:", "audit:"],
        goal: `${start} I asked ${freshEngine(d)} their customer question again today: exactly who it named and whether ${d.business.name} was named. What I'd change first to move that answer.`,
      }
    case 5:
      return {
        day, prefer: ["draft:", "gsc:near", "contentgap:", "gap:"],
        goal: `${start} The first fix I'd ship for them, concretely: the drafted FAQ answer, a query they almost rank for on Google (with its numbers), or a topic a named rival covers that they don't. You approve each change before it goes live.`,
      }
    case 8:
      return {
        day, prefer: ["rival:", "scan:", "fresh:"],
        required: [guaranteeSentence(d), "That is $99 a month."],
        allowNumbers: [4, 90, 99],
        goal: `${start} One concrete fact about a rival AI names, then the guarantee and the price using the required sentences. Month to month.`,
      }
    case 12:
      return {
        day, prefer: ["rival:"],
        goal: `${start} What ${rival} (or another named rival) published or changed on its website recently (title and date from the dossier) and what I'd publish for ${d.business.name} in response.`,
      }
    case 17:
      return {
        day, prefer: ["gsc:", "google:", "rival:"],
        goal: `${start} Google: a query they almost rank for (Search Console numbers) or where they sit for their keyword vs named rivals. What I'd do about it first.`,
      }
    case 24:
      return {
        day, prefer: ["own:", "social:"],
        goal: `${start} Their own newest post, page or social post (by title/date) and one concrete way I'd make it easier for AI to quote.`,
      }
    case 31:
      return {
        day, prefer: ["rival:", "gap:", "contentgap:", "fresh:"],
        goal: `${start} A named rival's website advantage (FAQ, service pages, blog, the code AI reads) vs ${d.business.name}, and the page I'd draft first to close it.`,
      }
    default:
      return {
        day, prefer: ["fresh:", "rival:", "scan:", "audit:"],
        required: ["This is my last email."],
        goal: `${start} The last email. One final, specific fact about them (who an AI named most recently, or a rival's latest move). No pressure. Their account and scan are saved. A reply of "later" is fine; a real person reads replies.`,
      }
  }
}

/** Template copy for the convert sequence, when the writer can't produce a valid email. */
export function buildConvertFallback(day: ConvertDay, d: Dossier, cta: NurtureCopy["cta"]): NurtureCopy {
  const name = d.business.nameIsGeneric ? "your business" : d.business.name
  const rivals = d.rivals.slice(0, 2).map((r) => r.name)
  const rivalLine = rivals.length ? ` The names I saw most were ${rivals.join(" and ")}.` : ""
  const gaps = d.leadFacts.gaps
  const p = (text: string) => ({ kind: "p" as const, text })
  const common = { cta }
  if (day === 8) {
    return {
      ...common,
      subject: `What I put in writing for ${name}.`.slice(0, 60),
      preview: "Nobody controls what ChatGPT says. Here is what I promise instead.",
      blocks: [
        p("Nobody controls what ChatGPT says. Anyone who promises you a top spot is guessing."),
        p("What I can do is fix the facts AI reads about you, then check every week to see if it worked."),
        p(`${guaranteeSentence(d)} That is $99 a month. Month to month.`),
      ],
    }
  }
  if (day === 45) {
    return {
      ...common,
      subject: `Should I stop writing about ${name}?`.slice(0, 60),
      preview: "This is my last email.",
      blocks: [
        p("I have written a few times since you created your account. I do not want to be noise."),
        p("This is my last email."),
        p("Your account and scan are saved, so we can pick up right where we left off. If the timing is wrong, just reply \"later.\" A real person reads every reply."),
      ],
    }
  }
  const blocks = [
    p(`When I checked ${name}, the AIs named other businesses for your customers' question.${rivalLine}`),
    ...(gaps.length ? [p("Here is what their websites have that yours doesn't:"), { kind: "bullets" as const, items: gaps.map((g) => g.charAt(0).toUpperCase() + g.slice(1)) }] : []),
    p("Once you start, I fix these first: clear answers to customer questions, the same facts everywhere, and the code AI reads. You approve each change before it goes live."),
  ]
  return {
    ...common,
    subject: `${rivals[0] ?? "Your rivals"} vs ${name}: what I found.`.slice(0, 60),
    preview: "What the AIs named instead of you, and what I'd fix first.",
    blocks,
  }
}
