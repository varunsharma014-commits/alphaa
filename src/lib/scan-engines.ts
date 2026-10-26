// Per-engine verdicts for a public scan (ScanLead), for the report emails.
// Three states, never two: an engine that didn't answer (error, timeout, not
// configured) is "unknown", which is a different claim from "didn't name you"
// (CLAUDE.md gotcha 18). Owner-facing order: ChatGPT, Gemini, Claude, Perplexity.

export type ScanEngineStatus = "found" | "missing" | "unknown"
export interface ScanEngineRow {
  name: string
  status: ScanEngineStatus
  /** Start of the engine's own answer, when it named the business. */
  snippet?: string
}

const ENGINES = [
  { key: "chatgpt", responseKey: "chatgpt", name: "ChatGPT" },
  { key: "gemini", responseKey: "gemini", name: "Gemini" },
  // Legacy: the Claude verdict is stored under google_ai in aiSearchStatus.
  { key: "google_ai", responseKey: "claude", name: "Claude" },
  { key: "perplexity", responseKey: "perplexity", name: "Perplexity" },
] as const

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export function scanEngineRows(
  lead: { aiSearchStatus: unknown; engineResponses: unknown },
  opts: { snippets?: boolean } = {},
): ScanEngineRow[] {
  const status = isRecord(lead.aiSearchStatus) ? lead.aiSearchStatus : {}
  const responses = isRecord(lead.engineResponses) ? lead.engineResponses : {}
  // New-contract rows store { query, response, appeared } per engine that
  // actually answered. On those rows aiSearchStatus also holds model estimates
  // and errors written as "not_appearing", so it can't tell us who answered.
  const newContract = Object.values(responses).some((r) => isRecord(r) && typeof r.appeared === "boolean")
  const cut = (s: string) => (s.length > 160 ? `${s.slice(0, 157).replace(/\s+\S*$/, "")}...` : s)

  return ENGINES.map((e) => {
    const raw = responses[e.responseKey]
    if (isRecord(raw) && typeof raw.appeared === "boolean") {
      const found = raw.appeared
      const snippet = found && opts.snippets && typeof raw.response === "string" && raw.response.trim() ? cut(raw.response.trim()) : undefined
      return { name: e.name, status: found ? "found" : "missing", snippet }
    }
    if (newContract) return { name: e.name, status: "unknown" }
    // Old rows: a string verdict per engine; a missing key means it wasn't checked.
    const v = status[e.key]
    const st: ScanEngineStatus = v === "occasionally" || v === "frequently" ? "found" : v === "not_appearing" ? "missing" : "unknown"
    const snippet = st === "found" && opts.snippets && typeof raw === "string" && raw.trim() ? cut(raw.trim()) : undefined
    return { name: e.name, status: st, snippet }
  })
}
