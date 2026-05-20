"use client"

import { useEffect, useState } from "react"
import { SCAN_MESSAGES } from "@/lib/constants"

export function ScanLoader() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % SCAN_MESSAGES.length)
    }, 4500)
    const progTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 1.5, 95))
    }, 600)
    return () => { clearInterval(msgTimer); clearInterval(progTimer) }
  }, [])

  return (
    <div className="pt-32 pb-20 px-4 flex flex-col items-center justify-center min-h-[60vh]">
      {/* Animated ring */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-brand-orange/20" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-orange animate-spin"
          style={{ animationDuration: "1.2s" }}
        />
        <div className="absolute inset-3 rounded-full bg-brand-orange/10 flex items-center justify-center">
          <span className="mono text-brand-orange text-lg font-medium">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Status message */}
      <p className="text-white font-medium text-lg mb-2 text-center h-7 transition-all">
        {SCAN_MESSAGES[msgIdx]}
      </p>
      <p className="text-muted text-sm mb-8">Analyzing your local visibility…</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-orange rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
