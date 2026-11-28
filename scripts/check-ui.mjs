#!/usr/bin/env node
// UI acceptance check for workspace pages (package 0, 2026-11-28).
// Usage: node scripts/check-ui.mjs <file> [file…]     (exit 1 when something is found)
// Flags retired components/styles, solid black status, owner-copy dashes and third-person "we/us/alphaa"
// in JSX text and string literals. It is a helper, not a parser: read each hit before changing it.
import { readFileSync } from "node:fs"

const RULES = [
  { re: /\b(DsCard|StatBox|StatusPill|AutopilotBar|GlassCard|OrangePillButton|SectionDivider)\b/, why: "retired component: use the ds equivalent (PageHeader, StatTile, Pill, EmptyState…)" },
  { re: /["'`\s](apv-[\w-]+|ag-btn[\w-]*)/, why: "older apv-/ag-btn styles inside a workspace page" },
  { re: /background:\s*["']?#000\b|--ds-accent/, why: "solid black: status = Pill, action = Button variant=primary" },
  { re: /window\.confirm\(|\bconfirm\(\s*["'`]/, why: "native confirm(): use useConfirm() / ConfirmSheet" },
  { re: />[^<{]*\s[—–]\s[^<]*<|["'`][^"'`\n]*\s[—–]\s[^"'`\n]*["'`]/, why: "dash as punctuation in owner copy" },
  { re: /["'`>][^"'`<\n]*\b(we|We|us)\b(?! (?:the|a) )[^"'`<\n]*["'`<]/, why: "third-person we/us in owner copy (the agent speaks as I)" },
  { re: /["'`>][^"'`<\n]*\b[Aa]lphaa (is|will|publishes|sends|checks|writes|pulls|keeps)\b/, why: "third-person 'Alphaa does…' (the agent speaks as I)" },
  { re: /Loading…|Loading\.\.\./, why: "loading text: use <Skeleton>" },
  { re: /style=\{\{[^}]*fontSize:\s*1[0-9](\.5)?\b/, why: "hand-set font size: use the --x-fs-* tokens or a ds component" },
]

const files = process.argv.slice(2)
if (!files.length) { console.error("usage: node scripts/check-ui.mjs <file> [file…]"); process.exit(2) }
let hits = 0
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n")
  lines.forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("import ")) return
    for (const r of RULES) if (r.re.test(line)) { hits++; console.log(`${f}:${i + 1}  ${r.why}\n    ${t.slice(0, 160)}`) }
  })
}
console.log(hits ? `\n${hits} thing(s) to look at.` : "Clean.")
process.exit(hits ? 1 : 0)
