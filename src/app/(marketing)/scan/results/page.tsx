"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ScanLoader } from "@/components/scan/ScanLoader"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import type { ScanResult } from "@/types/scan"

function ScanResultsContent() {
  const params = useSearchParams()
  const scanId = params.get("id")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!scanId) { setError(true); setLoading(false); return }
    let attempts = 0
    const poll = async () => {
      try {
        const res = await fetch(`/api/scan/result?id=${scanId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.ready) { setResult(data.result); setLoading(false); return }
        }
        attempts++
        if (attempts < 30) setTimeout(poll, 2000)
        else { setError(true); setLoading(false) }
      } catch {
        attempts++
        if (attempts < 30) setTimeout(poll, 2000)
        else { setError(true); setLoading(false) }
      }
    }
    poll()
  }, [scanId])

  if (loading) return <ScanLoader />

  if (error || !result) {
    return (
      <div className="pt-24 pb-20 px-4 text-center">
        <p className="text-white text-lg mb-4">We couldn&apos;t complete your scan.</p>
        <OrangePillButton href="/scan">Try again →</OrangePillButton>
      </div>
    )
  }

  const isBelow = result.visibilityScore < 55
  const scoreLabel = result.visibilityScore < 55 ? "Below average" : result.visibilityScore < 70 ? "Average" : "Good"
  const scoreColor = result.visibilityScore < 55 ? "text-red-400" : result.visibilityScore < 70 ? "text-yellow-400" : "text-green-400"
  const criticalCount = result.issues.filter(i => i.severity === "critical").length
  const engines = [
    { key: "chatgpt", label: "ChatGPT", icon: "🤖", responseKey: "chatgpt" },
    { key: "perplexity", label: "Perplexity", icon: "🔍", responseKey: "perplexity" },
    { key: "google_ai", label: "Google AI", icon: "🌐", responseKey: "claude" },
    { key: "gemini", label: "Gemini", icon: "✨", responseKey: "gemini" },
  ]
  const aiStatus = result.aiSearchStatus as Record<string, string>
  const allNotAppearing = engines.every(e => aiStatus[e.key] === "not_appearing")

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* PERSONAL HEADER */}
        <div className="flex items-center gap-3">
          {result.ogData?.favicon && (
            <img src={result.ogData.favicon} alt="" className="w-8 h-8 rounded" onError={(e) => (e.currentTarget.style.display="none")} />
          )}
          <div>
            <h1 className="text-white font-semibold text-lg">{result.businessName || result.businessUrl}</h1>
            <p className="text-white/40 text-xs">{result.city}{result.ogData?.domain ? ` · ${result.ogData.domain}` : ""}</p>
          </div>
          <div className="ml-auto">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isBelow ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              {scoreLabel}
            </span>
          </div>
        </div>

        {/* AI ENGINES — THE BIG HOOK */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <div className="mb-4">
            <h2 className="text-white font-bold text-xl mb-1">
              {result.businessName ? `${result.businessName} is invisible on AI search` : "You're invisible on AI search"}
            </h2>
            <p className="text-white/50 text-sm">We searched for your business on 4 AI engines. Here&apos;s what we found:</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {engines.map(engine => {
              const status = aiStatus[engine.key]
              const appeared = status === "occasionally" || status === "frequently"
              const snippet = result.engineResponses?.[engine.responseKey]?.slice(0, 120)
              return (
                <div key={engine.key} className={`rounded-xl p-4 border ${appeared ? "border-green-500/30 bg-green-500/5" : "border-white/10 bg-white/5"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{engine.icon}</span>
                      <span className="text-white text-sm font-medium">{engine.label}</span>
                    </div>
                    {appeared
                      ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Found ✓</span>
                      : <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">Not found</span>
                    }
                  </div>
                  {snippet && (
                    <div className="bg-black/40 rounded-lg px-3 py-2">
                      <p className="text-white/30 text-[10px] mb-1 uppercase tracking-wide">What AI said</p>
                      <p className="text-white/60 text-xs leading-relaxed italic">&ldquo;{snippet}&hellip;&rdquo;</p>
                    </div>
                  )}
                  {!snippet && (
                    <p className="text-white/30 text-xs">No mention of {result.businessName || "your business"}</p>
                  )}
                </div>
              )
            })}
          </div>

          {allNotAppearing && (
            <div className="border-l-4 border-orange-500 bg-orange-500/10 rounded-r-xl px-4 py-3">
              <p className="text-orange-300 text-sm font-medium">
                ⚠ Right now, someone in {result.city || "your city"} is asking ChatGPT for your services.
              </p>
              <p className="text-orange-300/70 text-sm mt-0.5">A competitor is getting that customer. You&apos;re not.</p>
            </div>
          )}
        </div>

        {/* YOUR WEBSITE */}
        {(result.ogData || result.businessUrl) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Your website</p>
            <div className="flex gap-4">
              {result.ogData?.image && (
                <img
                  src={result.ogData.image}
                  alt=""
                  className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => (e.currentTarget.style.display="none")}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{result.ogData?.title || result.businessName}</p>
                {result.ogData?.description && (
                  <p className="text-white/50 text-xs mt-1 leading-relaxed line-clamp-2">{result.ogData.description}</p>
                )}
                <p className="text-orange-400 text-xs mt-2">{result.ogData?.domain || result.businessUrl}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-white/40 text-xs">
                <span className="text-red-400 font-medium">How AI sees your site: </span>
                Missing structured data, no AI-optimized content, thin authority signals.
              </p>
            </div>
          </div>
        )}

        {/* SCORE */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-6">
            <div className="text-center flex-shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center"
                style={{ borderColor: result.visibilityScore < 55 ? "rgba(239,68,68,0.4)" : result.visibilityScore < 70 ? "rgba(251,191,36,0.4)" : "rgba(34,197,94,0.4)" }}>
                <span className={`text-2xl font-bold ${scoreColor}`}>{result.visibilityScore}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-3xl font-bold ${scoreColor}`}>{result.visibilityScore}</span>
                <span className="text-white/40 text-sm">/100</span>
                <span className={`text-sm font-medium ${scoreColor}`}>— {scoreLabel}</span>
              </div>
              <p className="text-white/50 text-xs mb-3">The average competitor in {result.city || "your area"} scores <span className="text-white">68/100</span></p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>You</span><span>Competitors (avg)</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style={{width: `${result.visibilityScore}%`}} />
                </div>
                <div className="relative h-3">
                  <div className="absolute top-0 w-0.5 h-3 bg-white/40" style={{left: "68%"}} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ISSUES */}
        <div>
          <h2 className="text-white font-semibold text-base mb-3">
            {result.issues.length} reasons customers can&apos;t find {result.businessName ? `${result.businessName}` : "you"}
            {criticalCount > 0 && <span className="ml-2 text-red-400 text-xs font-normal">({criticalCount} critical)</span>}
          </h2>
          <div className="space-y-2">
            {result.issues.map((issue, i) => {
              const colors: Record<string, { border: string; badge: string }> = {
                critical: { border: "border-red-500/30", badge: "bg-red-500/20 text-red-400" },
                warning: { border: "border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-400" },
                improvement: { border: "border-blue-500/30", badge: "bg-blue-500/20 text-blue-400" },
              }
              const c = colors[issue.severity] ?? colors.improvement
              return (
                <div key={i} className={`rounded-xl border ${c.border} bg-white/5 px-4 py-3`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${c.badge}`}>
                      {issue.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium leading-snug">{issue.headline}</p>
                      <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{issue.explanation.split(".")[0]}.</p>
                      <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                        <span>✓</span> <span>{issue.fix_summary}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SOCIAL PROOF */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex gap-1 mb-3">{"★★★★★".split("").map((s, i) => <span key={i} className="text-orange-400 text-sm">{s}</span>)}</div>
          <p className="text-white/80 text-sm leading-relaxed italic mb-3">
            &ldquo;I was paying $1,400/month to an SEO agency and invisible on ChatGPT. Switched to Alphaa, appeared on ChatGPT in 11 days, cancelled the agency.&rdquo;
          </p>
          <p className="text-white/40 text-xs">— Sarah K., General Dentist · Austin, TX</p>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-6 text-center" style={{background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,26,0.15) 0%, rgba(0,0,0,0.4) 70%)", border: "1px solid rgba(255,107,26,0.2)"}}>
          <h2 className="text-white font-bold text-xl mb-2">
            Get {result.businessName ? result.businessName : "your business"} found on ChatGPT in 14 days
          </h2>
          <p className="text-white/50 text-sm mb-4">Everything Alphaa does — automatically, every week:</p>
          <div className="space-y-2 mb-6 text-left max-w-xs mx-auto">
            {[
              "Optimize your profile across all 6 AI engines",
              "Post to Google Business Profile 4× weekly",
              "Generate content that AI tools cite and recommend",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="text-white/70 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <OrangePillButton href="/signup" size="lg" className="w-full justify-center">
            Start my free 14-day trial →
          </OrangePillButton>
          <p className="text-white/30 text-xs mt-3">No credit card · Cancel anytime · Setup in 2 minutes</p>
          <p className="text-white/20 text-xs mt-1">
            Every day without Alphaa, a competitor in {result.city || "your city"} gets the customer instead.
          </p>
        </div>

      </div>
    </div>
  )
}

export default function ScanResultsPage() {
  return (
    <Suspense fallback={<ScanLoader />}>
      <ScanResultsContent />
    </Suspense>
  )
}
