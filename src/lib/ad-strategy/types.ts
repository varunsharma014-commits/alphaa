import type { Vertical } from "./playbook"
import type { CompetitorAd } from "./competitor-ads"

export const AD_STRATEGY = "ad_strategy"

export type Scene = { t: string; visual: string; onScreen: string; vo: string; audio: string }
export type Script = {
  title: string
  angle: string
  format: string
  hookType: string
  seconds: number
  platforms: string[]
  scenes: Scene[]
  hookSwaps: string[]
  /** "Example" / "Dramatization" tags the edit must show on screen. */
  labels: string[]
}
export type Hook = { type: string; line: string }
export type Angle = { name: string; why: string }
export type MetaStatic = { primary: string; headline: string; imageHeadline: string; imageId?: string | null }
export type LinkedInStatic = { intro: string; headline: string }

export type PlatformPlan = { platform: "Facebook & Instagram" | "Google" | "LinkedIn"; monthly: number | null; daily: number | null; judge: number | null; launch: string; optimise: string }
export type TestingPlan = { monthly: number | null; currency: string; platforms: PlatformPlan[]; notes: string[] }

export type AdStrategy = {
  v: 1
  status: "running" | "ready" | "failed"
  at: string
  playbook: string
  error?: string
  business?: { name: string; vertical: Vertical; b2b: boolean; local: boolean; markets: string }
  angles?: Angle[]
  competitors?: { looked: string[]; ads: CompetitorAd[]; cliches: string[]; gaps: string[] }
  hooks?: Hook[]
  scripts?: Script[]
  statics?: { meta: MetaStatic[]; linkedin: LinkedInStatic[]; google: { headlines: string[]; descriptions: string[] } }
  testing?: TestingPlan
  /** vertical = per-vertical legal rules; owner = notes from the owner's brand guardrails (lib/guardrails.ts). */
  guardrails?: { vertical: string[]; owner?: string[] }
  /** Lines my checks removed (a claim I couldn't back up, over the limit…). */
  dropped?: number
}
