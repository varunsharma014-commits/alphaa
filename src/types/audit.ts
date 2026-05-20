export type IssueSeverity = "critical" | "warning" | "improvement"

export type AiSearchStatus = "not_appearing" | "occasionally" | "frequently"

export interface AuditIssue {
  severity: IssueSeverity
  headline: string
  explanation: string
  fix_summary: string
}

export interface AuditResult {
  visibility_score: number
  issues: AuditIssue[]
  competitor_insight: string
  ai_search_status: {
    chatgpt: AiSearchStatus
    perplexity: AiSearchStatus
    google_ai: AiSearchStatus
    gemini: AiSearchStatus
  }
}
