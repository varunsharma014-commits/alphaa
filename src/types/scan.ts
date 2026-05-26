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
  businessName: string
  city: string
  businessUrl: string
  ogData: { title: string; description: string; image: string | null; favicon: string; domain: string } | null
  engineResponses: Record<string, string> | null
}
