import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { MonoNumber } from "@/components/common/MonoNumber"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { TrendingUp, Globe, Star, FileText, ArrowUpRight, CheckCircle2 } from "lucide-react"

export const metadata = { title: "Dashboard" }

async function getDashboardData(userId: string) {
  const user = await db.user.findUnique({ where: { clerkId: userId }, include: { audits: { orderBy: { createdAt: "desc" }, take: 1 }, mockActivity: { orderBy: { createdAt: "desc" }, take: 5 } } })
  return user
}

export default async function DashboardPage() {
  const { userId } = await auth()
  const data = await getDashboardData(userId!)
  const latestAudit = data?.audits?.[0]
  const score = latestAudit?.visibilityScore ?? 48

  const metrics = [
    { label: "Visibility Score", value: `${score}/100`, icon: TrendingUp, change: "+4", positive: true },
    { label: "AI Citations Found", value: "3", icon: Globe, change: "This week", positive: true },
    { label: "Reviews Monitored", value: "12", icon: Star, change: "+2 new", positive: true },
    { label: "Content Pieces", value: "8", icon: FileText, change: "This month", positive: true },
  ]

  const actions = [
    { label: "Your Google Business Profile needs 2 more posts this week", cta: "View posts", href: "/dashboard/posts" },
    { label: "3 competitors are outranking you on ChatGPT for your top keyword", cta: "See details", href: "/dashboard/visibility" },
    { label: "2 new reviews need responses", cta: "Respond", href: "/dashboard/reviews" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold text-2xl">Overview</h1>
          <p className="text-muted text-sm mt-0.5">Here's what's happening with your visibility this week.</p>
        </div>
        <OrangePillButton href="/dashboard/audit" size="sm">Run audit →</OrangePillButton>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <GlassCard key={m.label} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <m.icon className="w-4 h-4 text-muted" />
              <span className={`text-xs font-medium ${m.positive ? "text-green-400" : "text-red-400"}`}>{m.change}</span>
            </div>
            <div>
              <MonoNumber className="text-white text-2xl font-medium block">{m.value}</MonoNumber>
              <span className="text-muted text-xs">{m.label}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* This week */}
        <GlassCard className="lg:col-span-2">
          <h2 className="text-white font-medium mb-4">This week we did</h2>
          <div className="space-y-3">
            {data?.mockActivity?.map((a: { id: string; title: string; description: string | null }) => (
              <div key={a.id} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">{a.title}</p>
                  {a.description && <p className="text-muted text-xs">{a.description}</p>}
                </div>
              </div>
            )) ?? (
              <p className="text-muted text-sm">Activity will appear here as Alphaa works for you.</p>
            )}
          </div>
        </GlassCard>

        {/* Recommended actions */}
        <GlassCard>
          <h2 className="text-white font-medium mb-4">Recommended actions</h2>
          <div className="space-y-4">
            {actions.map((a, i) => (
              <div key={i} className="flex flex-col gap-1.5 pb-4 border-b border-white/[0.06] last:border-0 last:pb-0">
                <p className="text-white/80 text-xs leading-relaxed">{a.label}</p>
                <a href={a.href} className="text-brand-orange text-xs font-medium hover:underline flex items-center gap-1">
                  {a.cta} <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* AI Search status */}
      <GlassCard>
        <h2 className="text-white font-medium mb-4">AI search citations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { engine: "ChatGPT", icon: "🤖", status: "Tracking", statusColor: "text-yellow-400" },
            { engine: "Perplexity", icon: "🔍", status: "Not appearing", statusColor: "text-red-400" },
            { engine: "Google AI", icon: "🌐", status: "Occasionally", statusColor: "text-yellow-400" },
            { engine: "Gemini", icon: "✨", status: "Not appearing", statusColor: "text-red-400" },
          ].map((e) => (
            <div key={e.engine} className="bg-bg-tertiary rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">{e.icon}</span>
              <div>
                <p className="text-white text-xs font-medium">{e.engine}</p>
                <p className={`text-xs ${e.statusColor}`}>{e.status}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
