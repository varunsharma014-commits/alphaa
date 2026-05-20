export interface ScanInput {
  businessName: string
  city: string
  websiteUrl: string
  email: string
}

export interface ScanResult {
  scanId: string
  visibilityScore: number
  issues: import("./audit").AuditIssue[]
  competitorInsight: string
  aiSearchStatus: import("./audit").AuditResult["ai_search_status"]
}
