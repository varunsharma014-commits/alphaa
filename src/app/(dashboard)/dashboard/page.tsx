import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { ScoreRing } from "@/components/common/ScoreRing"
import {
  CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Star, FileText, Sparkles, Zap,
} from "lucide-react"

export const metadata = { title: "Dashboard — alphaa" }

async function getDashboardData(userId: string) {
  return db.user.findUnique({
    where: { clerkId: userId },
    include: {
      audits:       { orderBy: { createdAt: "desc" }, take: 1 },
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

function scoreLabel(score: number): { text: string; color: string; gradient: string; border: string; orb: string } {
  if (score >= 75) return { text: "Looking strong",  color: "text-green-400",       gradient: "from-green-500/[0.12]",       border: "border-green-500/20",  orb: "bg-green-500/15"  }
  if (score >= 50) return { text: "Making progress", color: "text-brand-orange",    gradient: "from-brand-orange/[0.12]",    border: "border-brand-orange/20", orb: "bg-brand-orange/15" }
  return              { text: "Needs attention",  color: "text-red-400",         gradient: "from-red-500/[0.12]",         border: "border-red-500/20",    orb: "bg-red-500/15"    }
}

const AI_ENGINES = [
  { name: "ChatGPT",    emoji: "🤖", status: "appearing" as const },
  { name: "Google AI",  emoji: "🌐", status: "appearing" as const },
  { name: "Perplexity", emoji: "🔍", status: "partial"   as const },
  { name: "Gemini",     emoji: "✨", status: "missing"   as const },
] as const

type EngineStatus = "appearing" | "partial" | "missing"

const ENGINE_STATUS: Record<EngineStatus, { label: string; dot: string; text: string }> = {
  appearing: { label: "Found you",  dot: "bg-green-400",  text: "text-green-400"  },
  partial:   { label: "Sometimes",  dot: "bg-amber-400",  text: "text-amber-400"  },
  missing:   { label: "Not yet",    dot: "bg-white/20",   text: "text-white/35"   },
}

const URGENT_ACTIONS = [
  { label: "2 customer reviews are waiting for your response", cta: "Respond now",   href: "/dashboard/reviews" },
  { label: "Your Google Posts need 2 more entries this week",  cta: "Create a post", href: "/dashboard/posts"   },
]

export default async function DashboardPage() {
  const { userId } = await auth()
  const data = await getDashboardData(userId!)

  const score       = data?.audits?.[0]?.visibilityScore ?? 48
  const scoreChange = 4
  const sl          = scoreLabel(score)
  const firstName   = data?.fullName?.split(" ")[0] ?? ""

  const quickStats = [
    { label: "Reviews monitored", value: "12", icon: Star,       color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "AI mentions found",  value: "3",  icon: TrendingUp, color: "text-green-400",  bg: "bg-green-500/10"  },
    { label: "Content published",  value: "8",  icon: FileText,   color: "text-blue-400",   bg: "bg-blue-500/10"   },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Greeting ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold leading-tight">
            {greeting()}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-white/35 text-sm mt-1">
            Here's what alphaa has been doing for your business.
          </p>
        </div>
        <OrangePillButton href="/dashboard/audit" size="sm">
          Run new audit →
        </OrangePillButton>
      </div>

      {/* ── Score hero ────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-2xl border ${sl.border} bg-gradient-to-br ${sl.gradient} via-transparent to-transparent p-6`}>
        <div className={`absolute -top-16 -right-16 w-44 h-44 rounded-full ${sl.orb} blur-3xl pointer-events-none`} />
        <div className="relative flex items-center gap-6 flex-wrap">
          {/* Score ring */}
          <div className="flex items-center gap-5">
            <ScoreRing score={score} size={88} />
            <div>
              <p className="text-white/30 text-[11px] uppercase tracking-widest font-semibold mb-0.5">
                Presence Score
              </p>
              <p className={`font-bold text-xl leading-tight ${sl.color}`}>{sl.text}</p>
              <p className="text-white/35 text-xs mt-1">↑ +{scoreChange} pts this week</p>
            </div>
          </div>

          <div className="w-px self-stretch bg-white/[0.08] hidden sm:block mx-2" />

          {/* Quick stats */}
          <div className="flex-1 grid grid-cols-3 gap-4 hidden sm:grid">
            {quickStats.map((s) => (
              <div key={s.label} className="flex flex-col gap-2">
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-white font-bold text-2xl font-mono leading-none">{s.value}</p>
                  <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main two-column ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Activity — left 2/3 */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-orange" />
              <h2 className="text-white font-semibold">What we did this week</h2>
            </div>
            {data?.mockActivity?.length ? (
              <span className="text-[11px] font-semibold bg-green-500/10 text-green-400 px-2.5 py-0.5 rounded-full border border-green-500/20">
                {data.mockActivity.length} completed
              </span>
            ) : null}
          </div>

          <div className="px-6 py-1">
            {data?.mockActivity?.length ? (
              data.mockActivity.map((a: { id: string; title: string; description: string | null }) => (
                <div key={a.id} className="flex items-start gap-3 py-4 border-b border-white/[0.05] last:border-0">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/90 text-sm font-medium leading-snug">{a.title}</p>
                    {a.description && (
                      <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{a.description}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-brand-orange" />
                </div>
                <p className="text-white/70 text-sm font-semibold">alphaa is getting started</p>
                <p className="text-white/30 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
                  Your first weekly activity report will appear here once alphaa begins working on your business.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Needs attention */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-amber-500/15">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h2 className="text-white/90 text-sm font-semibold flex-1">Needs attention</h2>
              <span className="text-[11px] font-bold bg-amber-500/15 text-amber-400 w-5 h-5 flex items-center justify-center rounded-full">
                {URGENT_ACTIONS.length}
              </span>
            </div>
            <div className="p-4 space-y-2.5">
              {URGENT_ACTIONS.map((a, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-colors">
                  <p className="text-white/65 text-xs leading-relaxed mb-2">{a.label}</p>
                  <a href={a.href} className="inline-flex items-center gap-1 text-brand-orange text-xs font-semibold hover:underline">
                    {a.cta} <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* AI engine status */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06]">
              <h2 className="text-white/90 text-sm font-semibold">Where people find you</h2>
            </div>
            <div className="px-5 py-2">
              {AI_ENGINES.map((e) => {
                const s = ENGINE_STATUS[e.status]
                return (
                  <div key={e.name} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                    <span className="text-lg leading-none w-6 text-center">{e.emoji}</span>
                    <span className="text-white/75 text-sm flex-1">{e.name}</span>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="px-5 pb-3.5">
              <a href="/dashboard/visibility" className="flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors">
                Full AI report <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
