// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ANTHROPIC KILL SWITCH
//
// While AI_PAUSED is true, EVERY Anthropic API call in the app is blocked before
// it leaves the server — no tokens are spent. This covers all call sites at once
// (scans, GBP posts, schema, competitor analysis, content gaps, weekly summaries,
// AI-engine checks) because both Anthropic clients route through installPauseGuard().
//
// To RESUME the app's Claude usage: set AI_PAUSED = false (or remove the env
// override) and redeploy. You can also flip it without a code change by setting
// the env var AI_PAUSED=false in Railway.
// ─────────────────────────────────────────────────────────────────────────────

export const AI_PAUSED =
  process.env.AI_PAUSED === "true" ? true : false // default: ACTIVE (resumed)

/**
 * Replaces `client.messages.create` with a function that throws, so any code path
 * that tries to hit the Anthropic API fails fast instead of spending money.
 * No-op when AI_PAUSED is false.
 */
export function installPauseGuard(client: { messages: { create: unknown } }): void {
  if (!AI_PAUSED) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(client.messages as any).create = async () => {
    throw new Error(
      "Anthropic API is PAUSED (src/lib/ai-paused.ts → AI_PAUSED=true). " +
        "No call was made. Set AI_PAUSED=false to resume."
    )
  }
}
