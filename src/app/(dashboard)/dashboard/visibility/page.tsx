export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import RunScanButton from "./RunScanButton"

export const metadata = { title: "AI Visibility" }

type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"

const ENGINE_META: Record<
  EngineKey,
  { label: string; icon: string; aiStatusKey: string }
> = {
  chatgpt: { label: "ChatGPT", icon: "🤖", aiStatusKey: "chatgpt" },
  claude: { label: "Claude / Google AI", icon: "🌐", aiStatusKey: "google_ai" },
  gemini: { label: "Gemini", icon: "✨", aiStatusKey: "gemini" },
  perplexity: { label: "Perplexity", icon: "🔍", aiStatusKey: "perplexity" },
}

function getStatusLabel(status: string | undefined | null): string {
  if (!status || status === "not_appearing") return "Not yet"
  if (status === "occasionally") return "Sometimes"
  if (status === "frequently" || status === "appeared") return "Found you"
  return "Not yet"
}

function getStatusMeta(status: string | undefined | null): {
  label: string
  pillClass: string
  dotClass: string
  barColor: string
  barWidth: string
} {
  if (status === "frequently" || status === "appeared") {
    return {
      label: "Found you",
      pillClass: "bg-green-500/15 border border-green-500/30 text-green-400",
      dotClass: "bg-green-400",
      barColor: "bg-green-400",
      barWidth: "100%",
    }
  }
  if (status === "occasionally") {
    return {
      label: "Sometimes",
      pillClass: "bg-amber-500/15 border border-amber-500/30 text-amber-400",
      dotClass: "bg-amber-400",
      barColor: "bg-amber-400",
      barWidth: "50%",
    }
  }
  return {
    label: "Not yet",
    pillClass: "bg-white/[0.06] border border-white/10 text-white/40",
    dotClass: "bg-white/20",
    barColor: "bg-red-400",
    barWidth: "0%",
  }
}

export default async function VisibilityPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/sign-in")

  const audit = await db.audit.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      aiEngineResults: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const aiStatus = (audit?.aiSearchStatus ?? {}) as Record<string, string>
  const engineOrder: EngineKey[] = ["chatgpt", "perplexity", "gemini", "claude"]

  // Count how many engines found the business
  const appearedCount = audit
    ? engineOrder.filter((key) => {
        const meta = ENGINE_META[key]
        const rawStatus = aiStatus[meta.aiStatusKey] ?? null
        const engineResult = audit.aiEngineResults.find((r) => r.engine === key)
        return engineResult?.appeared || rawStatus === "frequently" || rawStatus === "appeared"
      }).length
    : 0

  const lastScanDate = audit?.createdAt
    ? audit.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  // ── No scan yet ──────────────────────────────────────────────────────────────
  if (!audit) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-white font-semibold text-2xl">AI Visibility</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Where your business shows up when people search on AI tools.
          </p>
        </div>

        {/* Empty state */}
        <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.12] via-transparent to-transparent p-12">
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#FF6B1A]/20 blur-3xl pointer-events-none" />
          <div className="relative text-center space-y-5 max-w-md mx-auto">
            <p className="text-6xl">🔍</p>
            <div className="space-y-2">
              <h2 className="text-white font-bold text-2xl">No AI scan yet</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Find out if ChatGPT, Gemini, Perplexity, and Claude mention your business
                when customers search for services like yours. Takes about 30 seconds.
              </p>
            </div>
            <div className="pt-2">
              <RunScanButton prominent />
            </div>
          </div>
        </div>

        {/* Engine preview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {engineOrder.map((key) => {
            const meta = ENGINE_META[key]
            return (
              <GlassCard key={key} className="p-4 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">{meta.icon}</span>
                <p className="text-white/70 text-sm font-medium">{meta.label}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/30">
                  Not scanned
                </span>
              </GlassCard>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Has scan data ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-white font-semibold text-2xl">AI Visibility</h1>
        <p className="text-white/40 text-sm mt-0.5">
          Where your business shows up when people search on AI tools.
        </p>
      </div>

      {/* Hero summary card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.12] via-transparent to-transparent p-6">
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#FF6B1A]/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Left: headline */}
          <div className="space-y-3">
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">
                AI Reach
              </p>
              <p className="text-white font-bold text-3xl leading-tight">
                {appearedCount} of 4{" "}
                <span className="text-white/50 font-normal text-xl">AI engines know about you</span>
              </p>
            </div>
            {/* 4 status dots */}
            <div className="flex items-center gap-3">
              {engineOrder.map((key) => {
                const meta = ENGINE_META[key]
                const rawStatus = aiStatus[meta.aiStatusKey] ?? null
                const engineResult = audit.aiEngineResults.find((r) => r.engine === key)
                const isFound =
                  engineResult?.appeared ||
                  rawStatus === "frequently" ||
                  rawStatus === "appeared"
                const isPartial = rawStatus === "occasionally"
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                        isFound
                          ? "bg-green-400"
                          : isPartial
                          ? "bg-amber-400"
                          : "bg-white/20"
                      }`}
                    />
                    <span className="text-white/50 text-xs">{meta.label}</span>
                  </div>
                )
              })}
            </div>
            {lastScanDate && (
              <p className="text-white/30 text-xs">Last scanned {lastScanDate}</p>
            )}
          </div>
          {/* Right: scan button */}
          <div className="flex-shrink-0">
            <RunScanButton />
          </div>
        </div>
      </div>

      {/* 4 engine cards (2x2 grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {engineOrder.map((engineKey) => {
          const meta = ENGINE_META[engineKey]
          const engineResult = audit.aiEngineResults.find((r) => r.engine === engineKey)
          const rawStatus = aiStatus[meta.aiStatusKey] ?? null
          const appeared = engineResult?.appeared ?? false
          const snippet = engineResult?.snippet ?? null
          const isNotConfigured = !engineResult && rawStatus === null
          const statusMeta = getStatusMeta(rawStatus)

          return (
            <GlassCard key={engineKey} className="space-y-4">
              {/* Engine header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{meta.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg leading-tight">
                      {meta.label}
                    </h3>
                    {isNotConfigured ? null : (
                      <p className="text-white/40 text-xs mt-0.5">AI search engine</p>
                    )}
                  </div>
                </div>
                {/* Status badge */}
                {isNotConfigured ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium whitespace-nowrap">
                    Not configured
                  </span>
                ) : (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${statusMeta.pillClass}`}
                  >
                    {appeared || rawStatus === "frequently" || rawStatus === "appeared"
                      ? "✓ Found you"
                      : rawStatus === "occasionally"
                      ? "Sometimes"
                      : "Not yet"}
                  </span>
                )}
              </div>

              {/* Not configured notice */}
              {isNotConfigured ? (
                <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <span className="text-amber-400 text-base mt-0.5">⚠️</span>
                  <p className="text-amber-400/80 text-xs leading-relaxed">
                    API key not configured for this engine. Contact support to enable it.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mention frequency bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-white/40 text-xs font-medium">Mention frequency</p>
                      <p className={`text-xs font-medium ${
                        appeared || rawStatus === "frequently" || rawStatus === "appeared"
                          ? "text-green-400"
                          : rawStatus === "occasionally"
                          ? "text-amber-400"
                          : "text-white/30"
                      }`}>
                        {getStatusLabel(rawStatus)}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${statusMeta.barColor}`}
                        style={{ width: statusMeta.barWidth }}
                      />
                    </div>
                  </div>

                  {/* Snippet quote bubble */}
                  {snippet && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                      <p className="text-green-400 text-xs font-medium mb-2">
                        Mentioned in response
                      </p>
                      <p className="text-white/70 text-xs leading-relaxed italic">
                        &ldquo;{snippet}&rdquo;
                      </p>
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          )
        })}
      </div>

      {/* How we check card */}
      <GlassCard>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B1A]/15 border border-[#FF6B1A]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-base">📡</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">How we check</h2>
            <p className="text-white/40 text-xs mt-0.5">
              Alphaa asks each AI engine the same questions your customers might type.
            </p>
          </div>
        </div>
        <p className="text-white/50 text-sm leading-relaxed mb-4">
          We query ChatGPT, Perplexity, Gemini, and Google AI with searches relevant to your
          business and city, then check each response to see if your business is mentioned —
          and extract the exact quote when it appears.
        </p>
        {audit.aiEngineResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-white/30 text-xs font-medium uppercase tracking-wider">
              Queries we sent
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(audit.aiEngineResults.map((r) => r.query))).map((q) => (
                <span
                  key={q}
                  className="inline-block text-white/50 text-xs leading-relaxed bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 font-mono"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
