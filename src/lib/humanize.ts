// Turn technical strings into plain English for non-technical business owners.
// NEVER show raw issue codes, API errors, or snake_case to users.

const ISSUE_MAP: Record<string, string> = {
  meta_description_too_long:
    "Some pages have descriptions that are too long — Google will cut them off in search results",
  meta_description_missing:
    "Some pages are missing a short description — Google uses this to show your page in search results",
  title_too_long:
    "Some page titles are too long — Google will cut them off mid-sentence",
  title_missing:
    "Some pages don't have a title — this makes them nearly invisible to Google",
  broken_link:
    "One or more links on your site lead to pages that don't exist — visitors hit a dead end",
  missing_h1:
    "Some pages don't have a main heading — this makes it harder for Google to understand what the page is about",
  slow_lcp:
    "Your page takes too long to show the main content — visitors may leave before it loads",
  missing_alt_text:
    "Some images don't have descriptions — Google can't 'see' images without them",
  duplicate_title:
    "Multiple pages have the same title — Google may ignore some of them",
  redirect_chain:
    "Some links take visitors through multiple redirects — this slows down your site",
  missing_schema:
    "Your site is missing structured data — this helps Google and AI engines understand your business",
}

const ISSUE_FALLBACK =
  "A technical issue was found on your site — alphaa is working on a fix"

/** Map a technical issue code (any casing/spacing) to a plain-English sentence. */
export function humanizeIssue(code: string | null | undefined): string {
  if (!code) return ISSUE_FALLBACK
  const key = String(code).trim().toLowerCase().replace(/[\s-]+/g, "_")
  return ISSUE_MAP[key] ?? ISSUE_FALLBACK
}

/** Friendly, reassuring fallback for any failed external call. Never leak errors. */
export function friendlyError(): string {
  return "alphaa hit a snag and is retrying this automatically. If it keeps happening, contact support@alphaa.app."
}

/** "morning" | "afternoon" | "evening" for greetings. */
export function timeOfDayGreeting(date: Date = new Date()): "morning" | "afternoon" | "evening" {
  const h = date.getHours()
  if (h < 12) return "morning"
  if (h < 18) return "afternoon"
  return "evening"
}
