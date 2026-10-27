// Preview one personal drip email WITHOUT sending it or writing to the DB.
//
//   npx tsx --env-file=.env.local scripts/preview-personal-email.ts --lead <scanLeadId> --day 1
//   npx tsx --env-file=.env.local scripts/preview-personal-email.ts --user <userId> --day 3
//
//   npx tsx --env-file=.env.local scripts/preview-personal-email.ts --live --name "Acme Flooring" \
//     --url acmeflooring.ca --city Ottawa --industry "flooring store" --question "Who installs hardwood floors in Ottawa?" --day 1
//     (no DB: runs an in-memory scan of the configured engines + site checks first)
//
// Flags: --offline (stored facts only, no site/AI research), --facts (print the dossier),
// --used k1,k2 (fact keys to treat as already used, --live only).
// Reads the DB, calls the AI engines / sites / Claude, prints the email. The dossier
// cache is NOT written (noCache), nothing is sent, nothing is logged to the ledger.

import { readFileSync } from "fs"
import { db } from "../src/lib/db"
import { buildNurtureCopy, extractLeadFacts, NURTURE_DAYS, type NurtureDay } from "../src/lib/nurture"
import { buildAccountDossier, buildLeadDossier, buildLeadDossierFromRow, type LeadRow } from "../src/lib/personal/research"
import { scanAllEngines } from "../src/lib/ai-engines"
import { extractMentionedBusinesses } from "../src/lib/scan-insights"
import { checkSites } from "../src/lib/site-check"
import { bodyWords, copyToText, validateDraft, writePersonalEmail } from "../src/lib/personal/writer"
import { buildConvertFallback, convertBrief, leadBrief, CONVERT_DAYS, type ConvertDay } from "../src/lib/personal/briefs"

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const has = (name: string) => process.argv.includes(`--${name}`)

async function main() {
  const leadId = arg("lead")
  const userId = arg("user")
  const day = Number(arg("day") ?? 1)
  const offline = has("offline")
  if (!leadId && !userId && !has("live")) throw new Error("Pass --lead <id>, --user <id> or --live")
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  const t0 = Date.now()

  if (has("live")) {
    // No DB at all: run an in-memory scan (the configured engines + mention
    // extraction + site checks) for a real business, then write the lead email.
    if (!(NURTURE_DAYS as readonly number[]).includes(day)) throw new Error(`--day must be one of ${NURTURE_DAYS.join(",")}`)
    // --spec <file.json> { name, url, city, industry, question } instead of the separate flags.
    const spec = arg("spec") ? JSON.parse(readFileSync(arg("spec")!, "utf8")) as Record<string, string> : {}
    const pick = (k: string) => spec[k] ?? arg(k) ?? ""
    const lead = await liveLead(pick("name"), pick("url"), pick("city"), pick("industry"), pick("question"))
    const d = await buildLeadDossierFromRow(lead, { rotation: day, forceFreshAnswer: day === 11, noCache: true, offline })
    const utm = `utm_source=email&utm_medium=nurture&utm_campaign=scan-nurture&utm_content=day${day}`
    const template = buildNurtureCopy(day as NurtureDay, extractLeadFacts(lead), {
      report: `${base}/scan/results?id=${lead.id}&${utm}`,
      signup: `${base}/signup?scan=${lead.id}&${utm}`,
      start: `${base}/start?${utm}`,
    })
    if (has("facts")) console.log("DOSSIER FACTS:\n" + d.facts.map((f) => `  [${f.key}] ${f.text}`).join("\n") + "\n")
    const brief = leadBrief(day, d)
    const used = (arg("used") ?? "").split(",").filter(Boolean)
    const r = await writePersonalEmail({ dossier: d, brief, usedKeys: used, cta: template.cta, fallback: template })
    report(r, d, brief, t0)
    return
  }

  if (leadId) {
    if (!(NURTURE_DAYS as readonly number[]).includes(day)) throw new Error(`--day must be one of ${NURTURE_DAYS.join(",")}`)
    const lead = await db.scanLead.findUnique({ where: { id: leadId } })
    if (!lead) throw new Error("lead not found")
    const d = await buildLeadDossier(leadId, { rotation: day, forceFreshAnswer: day === 11, noCache: true, offline })
    if (!d) throw new Error("no dossier")
    const utm = `utm_source=email&utm_medium=nurture&utm_campaign=scan-nurture&utm_content=day${day}`
    const template = buildNurtureCopy(day as NurtureDay, extractLeadFacts(lead), {
      report: `${base}/scan/results?id=${lead.id}&${utm}`,
      signup: `${base}/signup?scan=${lead.id}&${utm}`,
      start: `${base}/start?${utm}`,
    })
    if (has("facts")) console.log("DOSSIER FACTS:\n" + d.facts.map((f) => `  [${f.key}] ${f.text}`).join("\n") + "\n")
    const brief = leadBrief(day, d)
    const r = await writePersonalEmail({ dossier: d, brief, usedKeys: [], cta: template.cta, fallback: template })
    report(r, d, brief, t0)
  } else {
    if (!(CONVERT_DAYS as readonly number[]).includes(day)) throw new Error(`--day must be one of ${CONVERT_DAYS.join(",")}`)
    const d = await buildAccountDossier(userId!, { rotation: day, forceFreshAnswer: day === 3, noCache: true, offline })
    if (!d) throw new Error("user not found")
    const cta = { label: day === 45 ? "Pick up where we left off" : "Start your plan", href: `${base}/dashboard/settings/billing?utm_source=email&utm_medium=lifecycle&utm_campaign=account-convert&utm_content=day${day}` }
    if (has("facts")) console.log("DOSSIER FACTS:\n" + d.facts.map((f) => `  [${f.key}] ${f.text}`).join("\n") + "\n")
    const brief = convertBrief(day as ConvertDay, d)
    const r = await writePersonalEmail({ dossier: d, brief, usedKeys: [], cta, fallback: buildConvertFallback(day as ConvertDay, d, cta) })
    report(r, d, brief, t0)
  }
}

const norm = (s: string) => s.toLowerCase().replace(/\b(llc|inc|co|corp|ltd|the)\b/g, "").replace(/[^a-z0-9]/g, "")

/** An in-memory ScanLead built from a real, live scan of the configured engines. Nothing is stored. */
async function liveLead(name: string, url: string, city: string, industry: string, question: string): Promise<LeadRow> {
  if (!name || !url || !question) throw new Error("--live needs --name, --url and --question")
  const { results } = await scanAllEngines(name, industry, city, url, question)
  const answered = results.filter((r) => r.status === "appeared" || r.status === "not_appearing")
  const ext = await extractMentionedBusinesses(answered, name, url)
  const counts = new Map<string, { name: string; n: number }>()
  for (const list of Object.values(ext.mentioned)) for (const m of list) {
    const k = norm(m)
    const c = counts.get(k) ?? { name: m, n: 0 }
    c.n++
    counts.set(k, c)
  }
  const competitorDetails = [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 5)
    .map(([k, c]) => ({ name: c.name, domain: ext.domains[k] ?? null, url: null, aiMentions: c.n, googleRank: null }))
  const rivalDomains = competitorDetails.map((c) => c.domain).filter((x): x is string => !!x).slice(0, 2)
  const siteChecks = await Promise.race([checkSites(url, rivalDomains, true, city), new Promise<null>((r) => setTimeout(() => r(null), 40000))]).catch(() => null)
  const engineResponses: Record<string, unknown> = {}
  for (const r of answered) engineResponses[r.engine] = { query: r.query, response: r.response, appeared: r.appeared, mentioned: ext.mentioned[r.engine] ?? [] }
  console.log(`live scan: ${answered.length} engine(s) answered (${answered.map((r) => r.engine).join(", ")}); rivals: ${competitorDetails.map((c) => `${c.name}${c.domain ? ` [${c.domain}]` : ""}`).join("; ") || "none"}\n`)
  return {
    id: "live-preview",
    email: "preview@example.com",
    businessName: name,
    businessUrl: url,
    city: city || null,
    aiSearchStatus: {},
    engineResponses,
    ogData: { insights: { industry, isLocal: true, competitors: competitorDetails.map((c) => c.name), keyword: null, serp: null, competitorDetails, estimatedMonthlyLoss: null, query: question }, siteChecks },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }
}

function report(r: Awaited<ReturnType<typeof writePersonalEmail>>, d: NonNullable<Awaited<ReturnType<typeof buildLeadDossier>>>, brief: ReturnType<typeof leadBrief>, t0: number) {
  console.log("=".repeat(72))
  console.log(copyToText(r.copy))
  console.log("=".repeat(72))
  console.log(`personal: ${r.personal}  words: ${bodyWords(r.copy)}  facts used: ${r.factKeys.join(", ") || "-"}`)
  if (r.errors.length) console.log(`errors: ${r.errors.join(" | ")}`)
  if (r.personal) {
    // Re-run the validator on the final copy as a self-check.
    const paragraphs = r.copy.blocks.filter((b) => b.kind === "p").map((b) => (b as { text: string }).text)
    const bullets = r.copy.blocks.flatMap((b) => (b.kind === "bullets" ? b.items : []))
    const v = validateDraft({ subject: r.copy.subject, preview: r.copy.preview, paragraphs, bullets, factKeys: r.factKeys }, d, brief)
    console.log(`validator: ${v.errors.length ? v.errors.join(" | ") : "PASS"}`)
  }
  console.log(`writer tokens: ${r.usage.input} in / ${r.usage.output} out, ~$${r.usage.costUsd.toFixed(4)}; total ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
