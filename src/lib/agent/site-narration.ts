// Client-safe narration of a site check, shared by the signed-in "Site Schema
// & Code" thread. Same grouping and impact ranking as /start.
import { CHECK_GROUP, CHECK_IMPACT, CHECK_SHORT, GROUP_TITLE, type CheckGroup, type CheckKey } from "@/lib/site-check-labels"
import type { Block } from "@/lib/agent/types"

type Item = { key: CheckKey; label: string; ok: boolean | null; detail: string }
type Check = { domain: string; checks: Item[]; passed: number; total: number; blocked?: { status: number | null } }

const srcItem = (c: Item) => ({ name: c.label, detail: c.detail, status: c.ok === true ? "Yes" : c.ok === false ? "No" : "Couldn’t check", ok: c.ok === true })
const rank = (c: Item) => (c.ok === false ? 10 - CHECK_IMPACT[c.key] : c.ok === null ? 20 : 30)

export function worstFirst(check: Check): Item[] {
  const failed = new Set(check.checks.filter((c) => c.ok === false).map((c) => c.key))
  const implied: Partial<Record<CheckKey, CheckKey>> = { schemaFacts: "schema", depth: "render", sitemap: "pages" }
  return check.checks.filter((c) => c.ok === false && !(implied[c.key] && failed.has(implied[c.key]!))).sort((a, b) => CHECK_IMPACT[b.key] - CHECK_IMPACT[a.key])
}

export function siteCheckBlocks(check: Check): Block[] {
  if (check.blocked) {
    return [
      { kind: "text", text: `${check.domain} turned me away${check.blocked.status ? ` (error ${check.blocked.status})` : ""}.`, big: true },
      { kind: "text", text: "Some AI crawlers get the same door, so they fall back on what other sites say about you. It’s a one-line change for your host — I’ll write the exact instruction for them." },
      { kind: "sources", items: check.checks.filter((c) => c.ok !== null).map(srcItem) },
    ]
  }
  const worst = worstFirst(check)
  const groups = (["access", "understand", "trust"] as CheckGroup[]).map((g) => ({ g, items: check.checks.filter((c) => CHECK_GROUP[c.key] === g) })).filter((x) => x.items.length)
  return [
    { kind: "text", text: `${check.passed} of ${check.total} things AI needs are in place on ${check.domain}.`, big: true },
    ...groups.map(({ g, items }) => ({ kind: "sources", title: `${GROUP_TITLE[g]}  ·  ${items.filter((c) => c.ok === true).length} of ${items.length}`, items: [...items].sort((a, b) => rank(a) - rank(b)).map(srcItem) }) as Block),
    worst.length
      ? { kind: "text", text: `What’s hurting you most: ${worst.slice(0, 3).map((c) => CHECK_SHORT[c.key]).join("; ")}.` }
      : { kind: "text", text: "Your site is in good shape for AI. The gap is what the rest of the web says about you — see Source Tracking." },
  ]
}

/** Plain-English list of what the structured facts tell AI (no code on screen). */
export function describeSchemas(schemas: { type: string; jsonLd: Record<string, unknown> }[]): string[] {
  const out: string[] = []
  for (const s of schemas) {
    const j = s.jsonLd
    const bits: string[] = []
    if (j.name) bits.push(`your name (${String(j.name)})`)
    if (j.address) bits.push("your address")
    if (j.telephone) bits.push("your phone")
    if (j.openingHoursSpecification || j.openingHours) bits.push("your hours")
    if (j.areaServed) bits.push("where you work")
    if (Array.isArray(j.mainEntity)) bits.push(`${j.mainEntity.length} answers to customer questions`)
    out.push(`${s.type}${bits.length ? ` — ${bits.join(", ")}` : ""}`)
  }
  return out
}
