"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ScanLoader } from "@/components/scan/ScanLoader"
import { ScoreGauge } from "@/components/scan/ScoreGauge"
import { IssueCard } from "@/components/scan/IssueCard"
import { AiStatusGrid } from "@/components/scan/AiStatusGrid"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { GlassCard } from "@/components/common/GlassCard"
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

  const criticalCount = result.issues.filter((i) => i.severity === "critical").length

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <GlassCard className="text-center mb-8 py-10">
          <p className="text-muted text-sm mb-6">Your visibility score</p>
          <ScoreGauge score={result.visibilityScore} />
          <p className="text-muted text-sm mt-6 max-w-sm mx-auto">{result.competitorInsight}</p>
        </GlassCard>

        <div className="mb-8">
          <h2 className="text-white font-semibold text-lg mb-4">
            {result.issues.length} issues found
            {criticalCount > 0 && <span className="ml-2 text-red-400 text-sm font-normal">({criticalCount} critical)</span>}
          </h2>
          <div className="space-y-3">
            {result.issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-white font-semibold text-lg mb-4">AI search presence</h2>
          <AiStatusGrid status={result.aiSearchStatus} />
        </div>

        <GlassCard
          className="text-center py-10"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,26,0.1) 0%, transparent 70%)" }}
        >
          <h2 className="text-white font-semibold text-xl mb-2">
            Alphaa fixes all {result.issues.length} issues — automatically.
          </h2>
          <p className="text-muted text-sm mb-6">Start your 14-day free trial. No credit card required.</p>
          <OrangePillButton href="/signup" size="lg">Start fixing these issues →</OrangePillButton>
          <p className="text-muted/50 text-xs mt-3">Your results were also sent to your email.</p>
        </GlassCard>
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
