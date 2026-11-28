// The campaign plan I show the owner before anything is created in Google Ads.
export type PlanKeyword = { text: string; match: "EXACT" | "PHRASE"; searches: number | null; why?: string }
export type PlanAdGroup = {
  name: string
  keywords: PlanKeyword[]
  ad: { headlines: string[]; descriptions: string[]; path1?: string; path2?: string }
}
export type AdPlan = {
  id: string
  at: string
  status: "proposed" | "created" | "discarded" | "failed"
  customerId: string
  currency: string
  campaignName: string
  finalUrl: string
  adGroups: PlanAdGroup[]
  /** Three themed lists, added as campaign-level negative keywords. */
  negatives: { theme: string; keywords: string[] }[]
  location: { label: string; cityName?: string; provinceCode?: string; postalCode?: string; countryCode?: string; radius: number; units: "MILES" | "KILOMETERS" }
  language: string | null
  bidding: "clicks" | "conversions"
  /** Daily budget in the account currency; null = the owner must type one. */
  daily: number | null
  dailySource: "cap" | "suggested" | "none"
  /** Where a suggested daily budget comes from, in plain words with real numbers. */
  dailyBasis?: string
  /** Monthly cap from autopilot.adBudget, if the owner set one. */
  cap: number | null
  /** Why this campaign: each line from the facts I used. */
  why: string[]
  /** Facts I used (shown folded). */
  sources: string[]
  keywordCheck: "checked" | "unchecked"
  /** Brand guardrail notes for the owner (e.g. the disclaimer didn't fit). */
  notes?: string[]
  error?: string
}
