// The ad plan as markdown sections: the thread shows them as docs, the plan page prints them all.
import { AI_RULES, LEGAL, MUSIC, SPECS, THRESHOLDS } from "./playbook"
import type { AdStrategy, Script } from "./types"

const esc = (s: string) => s.replace(/\|/g, "/").replace(/\n/g, " ")
const money = (n: number, cur: string) => `${cur === "CAD" ? "CA$" : "$"}${n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 })}`

export function anglesMd(s: AdStrategy): string {
  return (s.angles ?? []).map((a, i) => `### ${i + 1}. ${a.name}\n${a.why}`).join("\n\n")
}

export function competitorsMd(s: AdStrategy): string {
  const c = s.competitors
  if (!c?.looked.length) return "Add your competitors in Competitor tracking and I’ll read their ads next time."
  if (!c.ads.length) return `I looked for active Facebook and Instagram ads from ${c.looked.join(", ")} and found none running now. That leaves the space open.`
  return [
    `I read ${c.ads.length} active Facebook and Instagram ads from ${c.looked.join(", ")}.`,
    c.cliches.length ? `**What they all do (skip it):**\n${c.cliches.map((x) => `- ${x}`).join("\n")}` : "",
    c.gaps.length ? `**What nobody does (take it):**\n${c.gaps.map((x) => `- ${x}`).join("\n")}` : "",
    `**Longest-running:**\n${c.ads.slice(0, 4).map((a) => `- ${a.page}, ${a.format}${a.daysRunning !== null ? `, ${a.daysRunning} days` : ""}: “${a.text.slice(0, 120)}${a.text.length > 120 ? "…" : ""}” ([see it](${a.url}))`).join("\n")}`,
  ].filter(Boolean).join("\n\n")
}

const TYPE_NAME: Record<string, string> = { price_anchor: "Price next to the alternative", newness: "What’s new", confession: "Honest truth", curiosity: "Curiosity", bold_claim: "Bold, provable claim", reverse: "Reverse psychology", warning: "Warning", contrarian: "Contrarian" }

export function hooksMd(s: AdStrategy): string {
  const by = new Map<string, string[]>()
  for (const h of s.hooks ?? []) by.set(h.type, [...(by.get(h.type) ?? []), h.line])
  return Array.from(by.entries()).map(([t, lines]) => `**${TYPE_NAME[t] ?? t}**\n${lines.map((l) => `- ${l}`).join("\n")}`).join("\n\n")
}

export function scriptMd(x: Script, i: number): string {
  return [
    `### ${i + 1}. ${x.title} (${x.seconds}s, ${x.format})`,
    `${x.platforms.join(", ")} · angle: ${x.angle}${x.labels.length ? ` · show on screen: ${x.labels.join(", ")}` : ""}`,
    "",
    "| Time | Visual | On screen | Voice-over | Audio |",
    "|---|---|---|---|---|",
    ...x.scenes.map((c) => `| ${esc(c.t)} | ${esc(c.visual)} | ${esc(c.onScreen)} | ${esc(c.vo || "—")} | ${esc(c.audio)} |`),
    "",
    `**Test these openings too:** ${x.hookSwaps.map((h) => `“${h}”`).join(" · ")}`,
  ].join("\n")
}

export function staticsMd(s: AdStrategy): string {
  const st = s.statics
  if (!st) return ""
  return [
    st.meta.length ? `**Facebook & Instagram** (primary text 125, headline 40)\n${st.meta.map((m, i) => `${i + 1}. ${m.primary}\n   Headline: ${m.headline} · On the image: ${m.imageHeadline}`).join("\n")}` : "",
    st.linkedin.length ? `**LinkedIn** (intro 150, headline 70)\n${st.linkedin.map((m, i) => `${i + 1}. ${m.intro}\n   Headline: ${m.headline}`).join("\n")}` : "",
    st.google.headlines.length ? `**Google search** (headlines 30, descriptions 90)\nHeadlines: ${st.google.headlines.join(" · ")}\n\nDescriptions:\n${st.google.descriptions.map((d) => `- ${d}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n")
}

export function testingMd(s: AdStrategy): string {
  const t = s.testing
  if (!t) return ""
  const rows = t.platforms.map((p) => `| ${p.platform} | ${p.monthly !== null ? `${money(p.monthly, t.currency)}/mo (${money(p.daily!, t.currency)}/day)` : "—"} | ${p.judge !== null ? `${p.judge} a month` : "—"} | ${esc(p.launch)} | ${esc(p.optimise)} |`)
  return [
    t.monthly !== null ? `For your ${money(t.monthly, t.currency)} a month:` : "How I’d split your budget:",
    "",
    "| Platform | Budget | Ads it can judge | Launch with | Optimise for |",
    "|---|---|---|---|---|",
    ...rows,
    "",
    ...t.notes.map((n) => `- ${n}`),
    "",
    "**When to pause, keep or scale an ad**",
    "",
    "| Measure | Pause | Keep testing | Scale |",
    "|---|---|---|---|",
    ...THRESHOLDS.rows.map((r) => `| ${r.metric} | ${r.kill} | ${r.hold} | ${r.scale} |`),
    "",
    ...THRESHOLDS.rules.map((r) => `- ${r}`),
  ].join("\n")
}

export function specsMd(): string {
  return [
    `- **Size:** ${SPECS.master}`,
    `- **Length:** ${SPECS.length}`,
    `- **Brand:** ${SPECS.brand}`,
    `- **Safe area:** ${SPECS.safeBox}`,
    `- **Captions:** ${SPECS.captions}`,
    `- **Pacing:** ${SPECS.pacing}`,
    `- **Voice:** ${SPECS.voice}`,
    `- **Sound:** ${SPECS.sound} ${SPECS.loudness}`,
  ].join("\n")
}

export function guardrailsMd(s: AdStrategy): string {
  return [
    `**Music:** use ${MUSIC.yes.join("; ")}. Never ${MUSIC.never.join(", ")}. ${MUSIC.why} ${MUSIC.log}`,
    `**AI:**\n${AI_RULES.map((r) => `- ${r}`).join("\n")}`,
    `**Every ad:**\n${LEGAL.map((r) => `- ${r}`).join("\n")}`,
    s.guardrails?.vertical.length ? `**For your kind of business:**\n${s.guardrails.vertical.map((r) => `- ${r}`).join("\n")}` : "",
    s.guardrails?.owner?.length ? `**Your brand rules:**\n${s.guardrails.owner.map((r) => `- ${r}`).join("\n")}` : "",
  ].filter(Boolean).join("\n\n")
}

/** The whole plan, for the printable page. */
export function strategyMd(s: AdStrategy): string {
  return [
    `## Your two strongest angles\n\n${anglesMd(s)}`,
    `## What your competitors run\n\n${competitorsMd(s)}`,
    `## Your opening lines\n\n${hooksMd(s)}`,
    `## Your video scripts\n\n${(s.scripts ?? []).map(scriptMd).join("\n\n")}`,
    `## Your static ads\n\n${staticsMd(s)}`,
    `## Your budget and testing plan\n\n${testingMd(s)}`,
    `## How to make them\n\n${specsMd()}`,
    `## Rules every ad follows\n\n${guardrailsMd(s)}`,
  ].join("\n\n")
}

// ── HTML (escaped): headings, bold, https links, lists, numbered items and pipe tables ─────────
const escH = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const inlineH = (s: string) => escH(s)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, (_m, t: string, u: string) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`)

export function planHtml(md: string): string {
  const out: string[] = []
  let list: string[] = []
  let table: string[][] = []
  const flushList = () => { if (list.length) { out.push(`<ul>${list.map((l) => `<li>${inlineH(l)}</li>`).join("")}</ul>`); list = [] } }
  const flushTable = () => {
    if (!table.length) return
    const [head, ...body] = table
    out.push(`<div style="overflow-x:auto"><table class="ag-plan-t"><thead><tr>${head.map((c) => `<th>${inlineH(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inlineH(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`)
    table = []
  }
  for (const raw of md.split("\n")) {
    const line = raw.trim()
    if (line.startsWith("|")) {
      flushList()
      if (/^\|[\s|:-]+\|$/.test(line)) continue
      table.push(line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()))
      continue
    }
    flushTable()
    if (!line) { flushList(); continue }
    const h = line.match(/^(#{2,4})\s+(.+)$/)
    if (h) { flushList(); out.push(`<h${h[1].length}>${inlineH(h[2])}</h${h[1].length}>`); continue }
    const li = line.match(/^[-*]\s+(.+)$/)
    if (li) { list.push(li[1]); continue }
    flushList()
    out.push(`<p>${inlineH(line)}</p>`)
  }
  flushList()
  flushTable()
  return out.join("\n")
}
