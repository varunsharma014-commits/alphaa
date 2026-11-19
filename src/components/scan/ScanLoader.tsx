"use client"

import { useEffect, useState } from "react"
import { SCAN_MESSAGES } from "@/lib/constants"
import "@/components/marketing/v3/v3.css"
import "@/components/marketing/v3/pages/scan.css"

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
    <div className="v3 v3-page">
      <div className="v3-frame v3-frame--top">
        <div className="sc3-load">
          {/* Animated ring */}
          <div className="sc3-ring">
            <span>{Math.round(progress)}%</span>
          </div>

          {/* Status message */}
          <p className="sc3-load__msg">
            {SCAN_MESSAGES[msgIdx]}
          </p>
          <p className="sc3-load__sub">I’m checking what AI says about you…</p>

          {/* Progress bar */}
          <div className="sc3-bar">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
