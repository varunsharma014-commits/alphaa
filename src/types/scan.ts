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

// One organic Google result captured for the scan keyword (v2 scans).
export interface SerpEntry {
  position: number
  title: string
  url: string
  domain: string
}

// Top organic Google results (max 10) for the customer-facing keyword.
// null when SERP evidence wasn't available (no APIFY_TOKEN, SCAN_SERP_DISABLED,
// Apify run failed, or the 20s cap was hit).
export interface ScanSerp {
  keyword: string
  results: SerpEntry[]
  // ISO country code the SERP was fetched for (e.g. "ca") — google.com when absent.
  countryCode?: string
}

// Per-competitor intelligence (v2 scans). One entry per v1 competitor name.
// domain/url/googleRank are null when no confident SERP match was found.
export interface CompetitorDetail {
  name: string
  domain: string | null
  url: string | null
  aiMentions: number // how many AI engines (0-4) recommended this competitor
  googleRank: number | null // organic position for the scan keyword, if matched
}

// Optional insights block inside ogData (new scans only).
// v2 adds keyword/serp/competitorDetails — rows written before v2 lack them,
// so runtime-guard before use (same rule as engineResponses below).
export interface ScanInsights {
  industry: string
  isLocal: boolean
  competitors: string[]
  keyword: string
  serp: ScanSerp | null
  competitorDetails: CompetitorDetail[]
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
