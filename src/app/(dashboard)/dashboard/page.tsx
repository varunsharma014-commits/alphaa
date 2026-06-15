import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ScoreRing } from "@/components/common/ScoreRing"
import {
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Star,
  FileText,
  Sparkles,
} from "lucide-react"

export const metadata = { title: "Dashboard — alphaa" }

async function getDashboardData(userId: string) {
  return db.user.findUnique({
    where: { clerkId: userId },
    include: {
      audits: { orderBy: { createdAt: "desc" }, take: 1 },
      mockActivity: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function scoreLabel(score: number) {
  if (score >= 75) return { text: "Looking strong", color: "text-green-400" }
  if (score >= 50) return { text: "Making progress", color: "text-brand-orange" }
  return { text: "Room to grow", color: "text-red-400" }
}

const AI_ENGINES = [
  { name: "ChatGPT", emoji: "🤖", status: "appearing" as const },
  { name: "Google AI", emoji: "🌐", status: "appearing" as const },
  { name: "Perplexity", emoji: "🔍", status: "partial" as const },
  { name: "Gemini", emoji: "✨", status: "missing" as const },
] as const

type EngineStatus = "appearing" | "partial" | "missing"

const ENGINE_STATUS: Record<EngineStatus, { label: string; dot: string; text: string }> = {
  appearing: { label: "Found you",  dot: "bg-green-400", text: "text-green-400" },
  partial:   { label: "Sometimes",  dot: "bg-amber-400", text: "text-amber-400" },
  missing:   { label: "Not yet",    dot: "bg-white/20",  text: "text-white/35"  },
}

const URGENT_ACTIONS = [
  {
    label: "2 customer reviews are waiting for your response",
    cta: "Respond now",
    href: "/dashboard/reviews",
  },
  {
    label: "Your Google Posts need 2 more entries this week",
    cta: "Create a post",
    href: "/dashboard/posts",
  },
]

export default async function DashboardPage() {
  const { userId } = await auth()
  const data = await getDashboardData(userId!)

  const latestAudit = data?.audits?.[0]
  const score = latestAudit?.visibilityScore ?? 48
  const scoreChange = 4 // TODO: calculate delta from previous audit
  const { text: scoreText, color: scoreColor } = scoreLabel(score)

  const firstName = data?.fullName?.split(" ")[0] ?? ""

  const quickStats = [
    { label: "Reviews monitored", value: "12", icon: Star },
    { label: "AI mentions found",  value: "3",  icon: TrendingUp },
    { label: "Content published",  value: "8",  icon: FileText },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-semibold leading-tight">
            {greeting()}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Here's what alphaa has been doing for your business.
          </p>
        </div>
        <OrangePillButton href="/dashboard/audit" size="sm">
          Run new audit →
        </OrangePillButton>
      </div>

      {/* ── Score strip ── */}
      <GlassCard className="flex items-center gap-6 py-5">
        {/* Score ring */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <ScoreRing score={score} size={84} />
          <div>
            <p className="text-white/35 text-[11px] uppercase tracking-widest font-medium mb-0.5">
              Presence Score
            </p>
            <p className={`font-semibold text-base leading-tight ${scoreColor}`}>
              {scoreText}
            </p>
            <p className="text-white/40 text-xs mt-1">
              ↑ +{scoreChange} pts this week
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-white/[0.06] hidden sm:block mx-2" />

        {/* Quick stats */}
        <div className="flex-1 grid grid-cols-3 gap-4 hidden sm:grid">
          {quickStats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <s.icon className="w-3 h-3 text-white/25" />
                <span className="text-white/35 text-xs">{s.label}</span>
              </div>
              <span className="text-white text-2xl font-bold font-mono leading-none">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Main two-column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity feed — 2 / 3 */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-semibold">What we did this week</h2>
            {data?.mockActivity?.length ? (
              <span className="text-[11px] font-medium bg-green-500/10 text-green-400 px-2.5 py-0.5 rounded-full">
                {data.mockActivity.length} actions completed
              </span>
            ) : null}
          </div>

          {data?.mockActivity?.length ? (
            <div className="space-y-0">
              {data.mockActivity.map(
                (a: { id: string; title: string; description: string | null }, i: number) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 py-3.5 border-b border-white/[0.05] last:border-0"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-green-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/90 text-sm font-medium leading-snug">{a.title}</p>
                      {a.description && (
                        <p className="text-white/35 text-xs mt-0.5 leading-relaxed">
                          {a.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-brand-orange" />
              </div>
              <p className="text-white/80 text-sm font-medium">alphaa is getting started</p>
              <p className="text-white/35 text-xs mt-1 leading-relaxed max-w-xs mx-auto">
                Your weekly activity report will appear here once alphaa begins working on your business.
              </p>
            </div>
          )}
        </GlassCard>

        {/* Right column */}
        <div className="space-y-4">

          {/* Needs attention */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-3 h-3 text-amber-400" />
              </div>
              <h2 className="text-white/90 text-sm font-semibold flex-1">
                Needs your attention
              </h2>
              <span className="text-[11px] font-semibold bg-amber-500/15 text-amber-400 w-5 h-5 flex items-center justify-center rounded-full">
                {URGENT_ACTIONS.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {URGENT_ACTIONS.map((a, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.10] transition-colors"
                >
                  <p className="text-white/70 text-xs leading-relaxed mb-2">{a.label}</p>
                  <a
                    href={a.href}
                    className="inline-flex items-center gap-1 text-brand-orange text-xs font-semibold hover:underline"
                  >
                    {a.cta}
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* AI Engine presence */}
          <GlassCard>
            <h2 className="text-white/90 text-sm font-semibold mb-3">
              Where people find you
            </h2>
            <div className="space-y-0">
              {AI_ENGINES.map((e) => {
                const s = ENGINE_STATUS[e.status]
                return (
                  <div
                    key={e.name}
                    className="flex items-center gap-2.5 py-2.5 border-b border-white/[0.05] last:border-0"
                  >
                    <span className="text-base leading-none w-5 text-center">{e.emoji}</span>
                    <span className="text-white/80 text-sm flex-1">{e.name}</span>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <a
              href="/dashboard/visibility"
              className="mt-3 flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              View full AI report <ArrowUpRight className="w-3 h-3" />
            </a>
          </GlassCard>

        </div>
      </div>
    </div>
  )
}
