// Latest-evidence resolver for the four AI engines.
//
// Why this exists: the dashboard used to read ONLY the latest weekly Audit.
// After the July 2026 purge of bogus gemini/perplexity rows, those engines had
// no key in aiSearchStatus at all — and the UI rendered that absence as
// "Not yet" (= "you're not mentioned"). Meanwhile the same user's public scan
// and sandbox question, run the same day, showed Perplexity naming them #1.
// Three surfaces, three verdicts. This module merges every evidence source we
// have and keeps "we have no data" strictly separate from "you weren't named".
//
// Sources, freshest wins per engine:
//   1. weekly  — latest Audit + AiEngineResult rows (the Wednesday scan)
//   2. scan    — latest completed public ScanLead matching the user's email
//   3. sandbox — "sandbox_result" activity rows written by /api/sandbox/ask
//
// No schema changes: sandbox evidence lives in MockActivity.metadata.

import { db } from "@/lib/db"

export type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"
export type EvidenceState = "found" | "partial" | "missing" | "unknown"
export type EvidenceSource = "weekly" | "scan" | "sandbox"

export type EngineEvidence = {
  state: EvidenceState
  // Set for every state except "unknown" (unknown = no evidence anywhere).
  source?: EvidenceSource
  at?: Date
}

export const ENGINE_KEYS: EngineKey[] = ["chatgpt", "claude", "gemini", "perplexity"]

// aiSearchStatus Json keys: the `claude` engine is stored under the legacy
// `google_ai` key in both Audit and ScanLead.
function statusKeyFor(engine: EngineKey): string {
  return engine === "claude" ? "google_ai" : engine
}

function stateFromStatus(status: unknown): EvidenceState | null {
  if (status === "frequently" || status === "appeared") return "found"
  if (status === "occasionally") return "partial"
  if (status === "not_appearing") return "missing"
  return null // absent/unknown key — NOT evidence of anything
}

type Candidate = { state: EvidenceState; source: EvidenceSource; at: Date }

export async function getEngineEvidence(user: {
  id: string
  email: string
}): Promise<Record<EngineKey, EngineEvidence>> {
  const [audit, scanLead, sandboxRows] = await Promise.all([
    db.audit.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { aiEngineResults: true },
    }),
    db.scanLead.findFirst({
      where: { email: user.email, visibilityScore: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, aiSearchStatus: true, engineResponses: true },
    }),
    db.mockActivity.findMany({
      where: { userId: user.id, type: "sandbox_result" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { createdAt: true, metadata: true },
    }),
  ])

  const evidence = {} as Record<EngineKey, EngineEvidence>

  for (const engine of ENGINE_KEYS) {
    const candidates: Candidate[] = []

    // 1. Weekly audit — prefer the unambiguous AiEngineResult row; fall back
    //    to the aiSearchStatus key. A missing key is no evidence (post-purge).
    if (audit) {
      const row = audit.aiEngineResults.find((r) => r.engine === engine)
      if (row) {
        candidates.push({ state: row.appeared ? "found" : "missing", source: "weekly", at: audit.createdAt })
      } else {
        const status = (audit.aiSearchStatus as Record<string, unknown> | null)?.[statusKeyFor(engine)]
        const state = stateFromStatus(status)
        if (state) candidates.push({ state, source: "weekly", at: audit.createdAt })
      }
    }

    // 2. Public scan by the same email — engineResponses is keyed by the real
    //    engine name (incl. "claude") and carries a per-engine `appeared`.
    if (scanLead) {
      const responses = scanLead.engineResponses as Record<string, { appeared?: unknown }> | null
      const resp = responses?.[engine]
      if (resp && typeof resp === "object") {
        candidates.push({
          state: resp.appeared ? "found" : "missing",
          source: "scan",
          at: scanLead.createdAt,
        })
      } else {
        const status = (scanLead.aiSearchStatus as Record<string, unknown> | null)?.[statusKeyFor(engine)]
        const state = stateFromStatus(status)
        if (state) candidates.push({ state, source: "scan", at: scanLead.createdAt })
      }
    }

    // 3. Sandbox questions — newest row that has a determinate result for
    //    this engine ("error"/"not_configured" runs are not evidence).
    for (const rowActivity of sandboxRows) {
      const meta = rowActivity.metadata as { results?: Array<{ engine?: string; appeared?: boolean; status?: string }> } | null
      const r = meta?.results?.find((x) => x.engine === engine)
      if (!r) continue
      if (r.status === "error" || r.status === "not_configured") continue
      candidates.push({
        state: r.appeared ? "found" : "missing",
        source: "sandbox",
        at: rowActivity.createdAt,
      })
      break
    }

    if (candidates.length === 0) {
      evidence[engine] = { state: "unknown" }
    } else {
      const freshest = candidates.reduce((a, b) => (b.at > a.at ? b : a))
      evidence[engine] = freshest
    }
  }

  return evidence
}

export const SOURCE_LABEL: Record<EvidenceSource, string> = {
  weekly: "alphaa's weekly check",
  scan: "your free scan",
  sandbox: "a live question you asked",
}
