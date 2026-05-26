import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import RunScanButton from "./RunScanButton"

export const metadata = { title: "AI Visibility" }
export const dynamic = "force-dynamic"

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

function statusLabel(status: string | undefined | null): string {
  if (!status || status === "not_appearing") return "Not appearing"
  if (status === "occasionally") return "Occasionally"
  if (status === "frequently") return "Frequently"
  return "Unknown"
}

function statusColor(status: string | undefined | null): string {
  if (status === "appeared" || status === "occasionally" || status === "frequently") return "text-green-400"
  if (!status || status === "not_appearing") return "text-red-400"
  return "text-amber-400"
}

export default async function VisibilityPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/sign-in")

  // Fetch the most recent audit with engine results
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-semibold text-2xl">AI Visibility</h1>
          <p className="text-muted text-sm mt-0.5">
            Where your business shows up when people search on AI tools.
          </p>
        </div>
        <RunScanButton />
      </div>

      {!audit ? (
        <GlassCard>
          <div className="text-center py-8 space-y-4">
            <p className="text-4xl">🔍</p>
            <h2 className="text-white font-semibold text-lg">No scan yet</h2>
            <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">
              Run your first AI visibility scan to see whether ChatGPT, Gemini, Perplexity, and
              Claude mention your business when people search for it.
            </p>
            <RunScanButton prominent />
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {engineOrder.map((engineKey) => {
              const meta = ENGINE_META[engineKey]
              const engineResult = audit.aiEngineResults.find((r) => r.engine === engineKey)
              const rawStatus = aiStatus[meta.aiStatusKey] ?? null
              const appeared = engineResult?.appeared ?? false
              const snippet = engineResult?.snippet ?? null
              const query = engineResult?.query ?? null
              // If we have an engine result but the business didn't appear and the ai status is not set,
              // consider it configured but not appearing. "not_configured" means no result row at all
              // and the aiStatus key is absent.
              const isNotConfigured = !engineResult && rawStatus === null

              return (
                <GlassCard key={engineKey}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{meta.icon}</span>
                    <div>
                      <h3 className="text-white font-medium">{meta.label}</h3>
                      {isNotConfigured ? (
                        <span className="text-xs text-amber-400 font-medium">
                          Not configured — add API key
                        </span>
                      ) : (
                        <span className={`text-xs font-medium ${statusColor(rawStatus)}`}>
                          {statusLabel(rawStatus)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-bg-tertiary rounded-xl p-3">
                      <p className={`font-medium text-lg mono ${appeared ? "text-green-400" : "text-white"}`}>
                        {appeared ? "Yes" : "No"}
                      </p>
                      <p className="text-muted text-xs">Found in response</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-3">
                      <p className={`font-medium text-lg mono ${appeared ? "text-green-400" : "text-white"}`}>
                        {engineResult?.position ?? "—"}
                      </p>
                      <p className="text-muted text-xs">Mention position</p>
                    </div>
                  </div>

                  {snippet && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <p className="text-green-400 text-xs font-medium mb-1">Mentioned in response</p>
                      <p className="text-white/80 text-xs leading-relaxed italic">
                        &ldquo;{snippet}&rdquo;
                      </p>
                    </div>
                  )}

                  {!snippet && !isNotConfigured && query && (
                    <div className="bg-bg-tertiary rounded-xl p-3">
                      <p className="text-muted text-xs font-medium mb-1">Query used</p>
                      <p className="text-white/60 text-xs leading-relaxed">{query}</p>
                    </div>
                  )}

                  {!snippet && !isNotConfigured && !query && (
                    <div className="bg-bg-tertiary rounded-xl p-3">
                      <p className="text-muted text-xs">
                        Run a scan to get real data for this engine.
                      </p>
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-medium">Scan details</h2>
              <span className="text-muted text-xs">
                Last scanned{" "}
                {audit.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Alphaa queries ChatGPT, Perplexity, Google AI, and Gemini with searches relevant to
              your business and city. We check each response to see if your business is mentioned,
              and extract the exact quote when it appears.
            </p>
            {audit.aiEngineResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-muted text-xs font-medium uppercase tracking-wide">Queries sent</p>
                {Array.from(new Set(audit.aiEngineResults.map((r) => r.query))).map((q) => (
                  <p key={q} className="text-white/60 text-xs leading-relaxed bg-bg-tertiary rounded-lg px-3 py-2">
                    {q}
                  </p>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  )
}
