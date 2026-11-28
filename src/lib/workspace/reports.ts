// Weekly reports (/dashboard/reports), UI audit package 5. One WeeklyReport row per week from
// /api/cron/weekly, plus what the agent logged across every channel in that same week (activity
// ledger rows), so the page isn't only Google posts and reviews. Real rows only.
import { db } from "@/lib/db"
import { realEmail } from "@/lib/sites"

const ENGINE_NAME: Record<string, string> = { chatgpt: "ChatGPT", perplexity: "Perplexity", google_ai: "Claude", claude: "Claude", gemini: "Gemini" }

export type ReportWeek = {
  id: string
  at: string
  summary: string | null
  emailed: boolean
  counts: { google: number; reviews: number; social: number; replies: number; emails: number; ads: number }
  /** AIs that started (+1) or stopped (-1) naming the business that week. */
  ai: { name: string; change: number }[]
  movers: { query: string; change: number }[]
}

export type ReportsData = { email: string; weeks: ReportWeek[] }

const LEDGER = ["social_published", "review_reply", "email_campaign_sent", "ads_change"] as const

export async function getReportsData(user: { id: string; email: string }): Promise<ReportsData> {
  const reports = await db.weeklyReport.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 26 })
  const oldest = reports.length ? new Date(reports[reports.length - 1].createdAt.getTime() - 7 * 86_400_000) : null
  const rows = oldest
    ? await db.mockActivity.findMany({ where: { userId: user.id, type: { in: [...LEDGER] }, createdAt: { gte: oldest } }, select: { type: true, createdAt: true } })
    : []

  const weeks = reports.map((r): ReportWeek => {
    const end = r.createdAt.getTime(), start = end - 7 * 86_400_000
    const inWeek = (t: string) => rows.filter((x) => x.type === t && x.createdAt.getTime() > start && x.createdAt.getTime() <= end).length
    const vd = r.visibilityDelta && typeof r.visibilityDelta === "object" && !Array.isArray(r.visibilityDelta) ? (r.visibilityDelta as Record<string, unknown>) : {}
    const movers = Array.isArray(r.keywordMovers) ? (r.keywordMovers as { query?: unknown; change?: unknown }[]) : []
    return {
      id: r.id,
      at: r.createdAt.toISOString(),
      summary: r.summary?.trim() || null,
      emailed: r.emailSent,
      counts: { google: r.postsPublished, reviews: r.reviewsNew, social: inWeek("social_published"), replies: inWeek("review_reply"), emails: inWeek("email_campaign_sent"), ads: inWeek("ads_change") },
      ai: Object.entries(vd).filter(([, v]) => typeof v === "number" && v !== 0).map(([k, v]) => ({ name: ENGINE_NAME[k] ?? k, change: Math.sign(v as number) })),
      movers: movers.filter((m) => typeof m.query === "string" && typeof m.change === "number" && m.change !== 0).slice(0, 5).map((m) => ({ query: m.query as string, change: m.change as number })),
    }
  })
  return { email: realEmail(user.email), weeks }
}
