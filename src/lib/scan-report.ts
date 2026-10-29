// The scan report's score and findings, built only from what the scan actually
// measured: which of the four AIs named the business, and the site checks.
// Client-safe (used by /scan/results) and server-side (stored by /api/scan), so
// the page, the stored score and the emails always agree.
import { CHECK_IMPACT, CHECK_SHORT, type CheckKey } from "@/lib/site-check-labels"
import type { SiteChecks } from "@/lib/site-check"

export interface ReportEngine {
  name: string
  appeared: boolean
  /** Other businesses this AI named in its answer. */
  mentioned: string[]
  /** False when we have no answer from this AI for this scan. */
  answered: boolean
}

export interface Finding {
  severity: "critical" | "warning" | "improvement"
  title: string
  why: string
  plan: string
}

// Why each check matters, in one plain sentence.
const WHY: Record<CheckKey, string> = {
  aibots: "When an AI assistant tries to read your site to answer a customer, it gets turned away, so it relies on what other sites say about you.",
  robots: "A setting on your site tells AI assistants not to read it, so they can’t quote your own words.",
  indexable: "Your homepage asks Google not to show it. AI answers lean on what Google can see.",
  render: "Your words only appear after extra code runs. Most AI readers don’t run it, so they see an empty page.",
  canonical: "Your pages tell Google another page is the real one, so they get less credit than they should.",
  https: "Your site answers at more than one address or isn’t fully secure, which splits the trust AI gives it.",
  bing: "ChatGPT’s search leans on Bing, and there’s no sign your site is set up there.",
  llms: "There’s no short summary of your business written for AI assistants to read first.",
  sitemap: "There’s no list of your pages, so Google and AI can miss some of them.",
  speed: "Your site is slow to load. Slow pages get read less often.",
  schema: "Your business facts aren’t in the background code AI engines read, so AI has to guess what you do.",
  schemaFacts: "The background code AI reads is missing your address, phone or hours.",
  facts: "AI couldn’t find your phone, address or hours on the page, which are the first things it checks.",
  local: "Your site doesn’t clearly say which city you serve, so AI doesn’t connect you to local questions.",
  meta: "Your page title and Google summary don’t say clearly what you do.",
  headings: "Your homepage has no clear main heading telling AI what the page is about.",
  depth: "There are too few words on the page for AI to quote when it explains who you are.",
  pages: "You don’t have a page for each service, so AI has nothing specific to point to.",
  faq: "Customers ask AI full questions. You don’t have published answers for AI to quote.",
  reviews: "Your reviews aren’t on your own site as text AI can read.",
  profiles: "Your site doesn’t link to your Google, Yelp or social profiles, so AI can’t tie them to you.",
  about: "There’s no About page saying who you are and how long you’ve done this, which AI uses to decide who to trust.",
  blog: "Nothing new has been published lately, so AI has nothing fresh to quote.",
}

// What the agent does about it, in the agent's voice.
const PLAN: Record<CheckKey, string> = {
  aibots: "I’ll write the exact setting your website host needs to change so ChatGPT, Claude and Perplexity can get in.",
  robots: "I’ll write the one-line change that lets AI assistants read your site again.",
  indexable: "I’ll find the hidden note asking Google to skip your homepage and tell you exactly how to remove it.",
  render: "I’ll hand your web person a short list of the facts that need to be visible without extra code.",
  canonical: "I’ll point every page back to itself so each one gets its own credit.",
  https: "I’ll point every version of your address at one secure site.",
  bing: "I’ll set you up with Bing so ChatGPT’s search can find you.",
  llms: "I’ll write and publish a short summary of your business for AI assistants.",
  sitemap: "I’ll add a list of your pages so nothing gets missed.",
  speed: "I’ll show your web person the slowest parts of your pages and what to fix first.",
  schema: "I’ll add your business facts to the background code AI engines read.",
  schemaFacts: "I’ll fill in your address, phone, hours and map location in that background code.",
  facts: "I’ll put your phone, address and hours on your homepage where AI looks first.",
  local: "I’ll put your city in your page title and main heading so AI knows where you work.",
  meta: "I’ll rewrite your page title and Google summary in plain words.",
  headings: "I’ll give your homepage one clear main heading.",
  depth: "I’ll add the words AI needs to quote you: your services, prices and the areas you cover.",
  pages: "I’ll draft a page for each service you offer. You approve each one before it goes live.",
  faq: "I’ll draft answers to the exact questions your customers ask AI, for you to approve.",
  reviews: "I’ll put your best reviews on your site as text AI can read.",
  profiles: "I’ll link your Google, Yelp and social profiles from your site so AI ties them to you.",
  about: "I’ll draft your About page: who you are, since when, and your credentials.",
  blog: "I’ll write a fresh post every two weeks from what your customers ask, ready for your approval.",
}

const SEVERITY: Record<1 | 2 | 3, Finding["severity"]> = { 3: "critical", 2: "warning", 1: "improvement" }

function list(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

function sameBusiness(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  const x = n(a)
  const y = n(b)
  return !!x && !!y && (x.includes(y) || y.includes(x))
}

/** 0–100. Six tenths: how many of the AIs that answered named you. Four tenths:
 *  the site checks you pass, weighted by how much each one matters. Without
 *  site checks the score is the AI part alone. */
export function computeScore(engines: ReportEngine[], siteChecks: SiteChecks | null): number | null {
  const answered = engines.filter((e) => e.answered)
  if (answered.length === 0) return null
  const ai = answered.filter((e) => e.appeared).length / answered.length
  const known = siteChecks?.you?.checks.filter((c) => c.ok !== null) ?? []
  if (known.length === 0) return Math.max(5, Math.round(ai * 100))
  const weight = (k: CheckKey) => CHECK_IMPACT[k] ?? 1
  const total = known.reduce((s, c) => s + weight(c.key), 0)
  const passed = known.filter((c) => c.ok).reduce((s, c) => s + weight(c.key), 0)
  return Math.max(5, Math.round(100 * (0.6 * ai + 0.4 * (passed / total))))
}

export function scoreLabel(score: number): { text: string; color: string } {
  if (score >= 75) return { text: "Strong", color: "#34c759" }
  if (score >= 45) return { text: "Room to grow", color: "#ff9500" }
  return { text: "AI rarely names you", color: "#ff3b30" }
}

/** Findings from measured facts only — never a template list. */
export function buildFindings(
  businessName: string,
  engines: ReportEngine[],
  siteChecks: SiteChecks | null,
): Finding[] {
  const out: Finding[] = []
  const answered = engines.filter((e) => e.answered)
  const missed = answered.filter((e) => !e.appeared)
  // Other businesses named, most-named first (the same order as the report's table).
  const others = (es: ReportEngine[]) => {
    const counts: { name: string; n: number }[] = []
    for (const e of es) for (const m of e.mentioned) {
      if (sameBusiness(m, businessName)) continue
      const hit = counts.find((c) => sameBusiness(c.name, m))
      if (hit) hit.n += 1
      else counts.push({ name: m, n: 1 })
    }
    return counts.sort((x, y) => y.n - x.n).map((c) => c.name)
  }

  if (missed.length > 0) {
    const rivals = others(missed).slice(0, 3)
    out.push({
      severity: "critical",
      title: `${list(missed.map((e) => e.name))} didn’t name you`,
      why: rivals.length
        ? `When a customer asked, ${missed.length > 1 ? "they" : "it"} recommended ${list(rivals)} instead.`
        : `When a customer asked, ${missed.length > 1 ? "they" : "it"} gave an answer that left you out.`,
      plan: "I’ll find the pages those AIs leaned on, get you onto them, and publish clear answers to the exact question your customer asked.",
    })
  } else if (answered.length > 0) {
    const rivals = others(answered).slice(0, 3)
    if (rivals.length) {
      out.push({
        severity: "warning",
        title: "You’re named, but not alone",
        why: `The same answers also recommended ${list(rivals)}. AI answers change week to week, and any of them can move ahead of you.`,
        plan: "I’ll ask all four AIs again every week, tell you the moment a competitor moves ahead, and keep your pages fresher than theirs.",
      })
    }
  }

  const you = siteChecks?.you
  if (you?.blocked) {
    out.push({
      severity: "critical",
      title: "Your website turned me away",
      why: "When I tried to read your site the way an AI assistant does, it blocked me. AI assistants likely get the same closed door.",
      plan: "I’ll write the exact one-line instruction for your website host so AI can read you.",
    })
  }
  const rivalSites = siteChecks?.competitors ?? []
  const failed = (you?.checks ?? [])
    .filter((c) => c.ok === false)
    .sort((a, b) => (CHECK_IMPACT[b.key] ?? 1) - (CHECK_IMPACT[a.key] ?? 1))
  for (const c of failed) {
    const short = CHECK_SHORT[c.key] ?? c.label
    const has = rivalSites.filter((r) => r.checks.some((x) => x.key === c.key && x.ok === true)).map((r) => r.domain)
    out.push({
      severity: SEVERITY[CHECK_IMPACT[c.key] ?? 1],
      title: short.charAt(0).toUpperCase() + short.slice(1),
      why: `${WHY[c.key] ?? ""}${has.length ? ` ${list(has)} ${has.length > 1 ? "have" : "has"} this.` : ""}`.trim(),
      plan: PLAN[c.key] ?? "I’ll fix this for you and show you the change before it goes live.",
    })
  }
  return out
}

/** The shape the rest of the app (emails, nurture) already reads from ScanLead.issues. */
export function findingsToIssues(findings: Finding[]) {
  return findings.map((f) => ({ severity: f.severity, headline: f.title, explanation: f.why, fix_summary: f.plan }))
}
