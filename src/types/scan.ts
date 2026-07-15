export interface ScanInput {
  businessName: string
  city: string
  websiteUrl: string
  email: string
}

// New-shape per-engine evidence (written by /api/scan for new scans).
// Old rows store a plain string per engine — always runtime-guard before use.
export interface EngineEvidence {
  query: string
  response: string
  appeared: boolean
  mentioned: string[]
}

// Optional insights block inside ogData (new scans only).
export interface ScanInsights {
  industry: string
  isLocal: boolean
  competitors: string[]
  estimatedMonthlyLoss: { low: number; high: number; basis: string } | null
}

export interface ScanResult {
  scanId: string
  visibilityScore: number
  issues: import("./audit").AuditIssue[]
  competitorInsight: string
  aiSearchStatus: import("./audit").AuditResult["ai_search_status"]
  businessName: string
  city: string
  businessUrl: string
  ogData: {
    title: string
    description: string
    image: string | null
    favicon: string
    domain: string
    insights?: ScanInsights | null
    sentEmail?: boolean
  } | null
  // Old rows: Record<string, string>. New rows: Record<string, EngineEvidence>.
  engineResponses: Record<string, string | EngineEvidence> | null
}
