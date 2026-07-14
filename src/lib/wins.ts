// Win detection + notification — after each visibility scan, compare the new
// audit against the PREVIOUS audit and record real, measured wins in the
// activity ledger (MockActivity type="win"). Reuses existing models only.
//
// Strictly honest: a win fires only when there is a prior audit to compare
// against AND the delta actually happened —
//   (a) an engine result is appeared=true now and was false/absent before, or
//   (b) visibilityScore rose by >= 5 points.
//
// Everything here is best-effort: a failure must NEVER break the scan that
// triggered it, so processWinsForAudit swallows all errors.

import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { sendWinEmail } from "@/lib/email"

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
}

const SCORE_JUMP_THRESHOLD = 5
// Max 1 win email per user per 7 days (tracked via MockActivity type="win_email").
const WIN_EMAIL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export interface DetectedWin {
  /** MockActivity row id — also the public share page id (/w/[id]). */
  id: string
  kind: "engine_appeared" | "score_jump"
  title: string
  description: string
  engine?: string
  oldScore?: number
  newScore?: number
}

interface WinUser {
  id: string
  email: string
  fullName: string | null
  businessName: string | null
  businessType: string | null
  city: string | null
}

type WinCandidate = Omit<DetectedWin, "id">

/**
 * Entry point called from the visibility scan flow right after an Audit is
 * persisted. Detects wins vs the previous audit, records them in the activity
 * ledger, and (capped) emails the user about the best one. Never throws.
 */
export async function processWinsForAudit(user: WinUser, auditId: string): Promise<DetectedWin[]> {
  try {
    const wins = await detectAndRecordWins(user, auditId)
    if (wins.length > 0) {
      await maybeSendWinEmail(user, wins)
    }
    return wins
  } catch (err) {
    console.error(`[wins] processing failed for user ${user.id}:`, err)
    return []
  }
}

// ── Detection ─────────────────────────────────────────────────────────────────

async function detectAndRecordWins(user: WinUser, auditId: string): Promise<DetectedWin[]> {
  const audit = await db.audit.findUnique({
    where: { id: auditId },
    include: { aiEngineResults: true },
  })
  if (!audit || audit.userId !== user.id) return []

  // The audit immediately before this one. No prior audit → no baseline →
  // no wins. We never fabricate a "newly appeared" claim without a comparison.
  const prevAudit = await db.audit.findFirst({
    where: {
      userId: user.id,
      id: { not: audit.id },
      createdAt: { lte: audit.createdAt },
    },
    orderBy: { createdAt: "desc" },
    include: { aiEngineResults: true },
  })
  if (!prevAudit) return []

  const businessName = user.businessName ?? "your business"
  const candidates: WinCandidate[] = []

  // (a) Engine newly appeared: appeared=true now, was false or absent before.
  for (const result of audit.aiEngineResults) {
    if (!result.appeared) continue
    const prevResult = prevAudit.aiEngineResults.find((p) => p.engine === result.engine)
    if (prevResult?.appeared) continue // already appearing last time — not new
    const label = ENGINE_LABELS[result.engine] ?? result.engine
    candidates.push({
      kind: "engine_appeared",
      engine: result.engine,
      title: `🎉 ${label} now mentions ${businessName}`,
      description: prevResult
        ? `Your latest visibility scan found ${businessName} in ${label}'s answers — it wasn't there on the previous scan.`
        : `Your latest visibility scan found ${businessName} in ${label}'s answers for the first time.`,
    })
  }

  // (b) Visibility score rose by >= 5 points between the two audits.
  const scoreDelta = audit.visibilityScore - prevAudit.visibilityScore
  if (scoreDelta >= SCORE_JUMP_THRESHOLD) {
    candidates.push({
      kind: "score_jump",
      oldScore: prevAudit.visibilityScore,
      newScore: audit.visibilityScore,
      title: `Your visibility score jumped ${prevAudit.visibilityScore} → ${audit.visibilityScore}`,
      description: `Measured across your last two visibility scans — up ${scoreDelta} points.`,
    })
  }

  const wins: DetectedWin[] = []
  for (const candidate of candidates) {
    const win = await recordWin(user.id, audit.id, candidate)
    if (win) wins.push(win)
  }
  return wins
}

// Creates the ledger row directly (not via logActivity) so we get the row id
// back — that id IS the public share URL id (/w/[id]) — then stamps it into
// the row's own metadata as winId.
async function recordWin(
  userId: string,
  auditId: string,
  candidate: WinCandidate,
): Promise<DetectedWin | null> {
  const metadata: Record<string, unknown> = {
    kind: candidate.kind,
    auditId,
  }
  if (candidate.engine !== undefined) metadata.engine = candidate.engine
  if (candidate.oldScore !== undefined) metadata.oldScore = candidate.oldScore
  if (candidate.newScore !== undefined) metadata.newScore = candidate.newScore

  try {
    const row = await db.mockActivity.create({
      data: {
        userId,
        type: "win",
        title: candidate.title,
        description: candidate.description,
        metadata: metadata as Prisma.InputJsonValue,
      },
    })
    try {
      await db.mockActivity.update({
        where: { id: row.id },
        data: { metadata: { ...metadata, winId: row.id } as Prisma.InputJsonValue },
      })
    } catch {
      // Stamping winId into metadata is best-effort — the row id itself is canonical.
    }
    return { ...candidate, id: row.id }
  } catch (err) {
    console.error(`[wins] failed to record win for user ${userId}:`, err)
    return null
  }
}

// ── Email ─────────────────────────────────────────────────────────────────────

async function maybeSendWinEmail(user: WinUser, wins: DetectedWin[]): Promise<void> {
  try {
    // Cap: max 1 win email per user per 7 days.
    const since = new Date(Date.now() - WIN_EMAIL_COOLDOWN_MS)
    const recent = await db.mockActivity.findFirst({
      where: { userId: user.id, type: "win_email", createdAt: { gte: since } },
      select: { id: true },
    })
    if (recent) return

    // Prefer an engine win (the most shareable story), else the score jump.
    const win = wins.find((w) => w.kind === "engine_appeared") ?? wins[0]
    if (!win) return

    const businessName = user.businessName ?? "your business"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://alphaa.app"
    const winUrl = `${appUrl}/w/${win.id}`
    const headline = win.title.replace(/^🎉\s*/u, "")

    let detail: string
    if (win.kind === "engine_appeared") {
      const engineLabel = ENGINE_LABELS[win.engine ?? ""] ?? win.engine ?? "an AI engine"
      const category = user.businessType ?? "businesses like yours"
      const cityPart = user.city ? ` in ${user.city}` : ""
      detail = `A customer asking ${engineLabel} about ${category}${cityPart} now sees YOUR business. alphaa measured this on your latest visibility scan — real answer data, not a projection.`
    } else {
      detail = `Your AI visibility score rose from ${win.oldScore} to ${win.newScore} between your last two scans — measured by alphaa, not estimated.`
    }

    await sendWinEmail(user.email, {
      firstName: user.fullName?.split(" ")[0] || undefined,
      businessName,
      headline,
      detail,
      winUrl,
      measuredOn: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    })

    // Ledger marker that enforces the 7-day cap (and reads honestly in the feed).
    await logActivity(
      user.id,
      "win_email",
      "Emailed you a win alert",
      `"${headline}" — win emails are capped at one per week.`,
      { winId: win.id },
    )
  } catch (err) {
    console.error(`[wins] win email failed for user ${user.id}:`, err)
  }
}
