// What an Anthropic call costs us, from list prices ($ per million tokens: [input, output]).
// AI_PRICES_JSON ({"model": [inputPerMTok, outputPerMTok]}) overrides without a deploy.
// Cache writes bill 1.25x input, cache reads 0.1x (0.05x on Opus/Sonnet 5.5), web searches
// $0.01 each. Used by the usage meter (lib/usage.ts, quotas) and /dashboard/admin/usage.
// Pure: no database, safe to import anywhere (scripts/test-quotas.ts imports it).
export const BASE_PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-opus-5": [5, 25],
  "claude-sonnet-5": [2, 10],
  "claude-opus-4-8": [5, 25],
  "claude-sonnet-4-6": [3, 15],
  "claude-haiku-4-5": [1, 5],
}
export const SEARCH_USD = 0.01
/** A model with no price set is costed like this (the dearest list price), never as free. */
const FALLBACK: [number, number] = [5, 25]

let cached: { raw: string | undefined; prices: Record<string, [number, number]> } | null = null
export function aiPrices(): Record<string, [number, number]> {
  const raw = process.env.AI_PRICES_JSON
  if (cached && cached.raw === raw) return cached.prices
  let prices: Record<string, [number, number]> = { ...BASE_PRICES }
  try {
    prices = { ...BASE_PRICES, ...JSON.parse(raw || "{}") }
  } catch {
    prices = { ...BASE_PRICES }
  }
  cached = { raw, prices }
  return prices
}

export type Tok = { in: number; out: number; cacheRead?: number; cacheWrite?: number }

/** Cost of one model's tokens, or null when the model has no price. */
export function tokCost(model: string, t: Tok): number | null {
  const p = aiPrices()[model]
  if (!p) return null
  const readX = /(opus|sonnet)-5-5$/.test(model) ? 0.05 : 0.1
  return (t.in * p[0] + (t.cacheWrite ?? 0) * p[0] * 1.25 + (t.cacheRead ?? 0) * p[0] * readX + t.out * p[1]) / 1e6
}

/** Cost of a tokens-by-model map plus web searches. Unpriced models use the fallback price (for limits: never free). */
export function usageCost(tokens: Record<string, Tok> | undefined, searches = 0): number {
  let c = searches * SEARCH_USD
  for (const [model, t] of Object.entries(tokens ?? {})) {
    const k = tokCost(model, t)
    c += k ?? (t.in * FALLBACK[0] + (t.cacheWrite ?? 0) * FALLBACK[0] * 1.25 + (t.cacheRead ?? 0) * FALLBACK[0] * 0.1 + t.out * FALLBACK[1]) / 1e6
  }
  return c
}

/** Worst-case-ish cost of a call before it runs: its output budget (capped at 8k tokens) + a rough input size. */
export function estimateCallCost(model: string, maxTokens: number | undefined, inputChars: number): number {
  const p = aiPrices()[model] ?? FALLBACK
  const out = Math.min(maxTokens ?? 4096, 8000)
  return (out * p[1] + (inputChars / 4) * p[0]) / 1e6
}
