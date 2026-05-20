"use client"

import { useEffect, useState } from "react"

interface ScoreGaugeProps {
  score: number
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0
      const step = setInterval(() => {
        current += 2
        if (current >= score) { setDisplayed(score); clearInterval(step) }
        else setDisplayed(current)
      }, 20)
    }, 300)
    return () => clearTimeout(timer)
  }, [score])

  const size = 160
  const strokeWidth = 10
  const r = (size - strokeWidth) / 2
  const circumference = Math.PI * r // half circle
  const offset = circumference * (1 - displayed / 100)

  const color = score < 40 ? "#EF4444" : score < 65 ? "#FBBF24" : "#22C55E"
  const label = score < 40 ? "Low" : score < 65 ? "Fair" : "Good"

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Track */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="-mt-4 text-center">
        <span className="mono text-5xl font-medium text-white">{displayed}</span>
        <span className="text-muted text-xl">/100</span>
        <p className="text-sm font-medium mt-1" style={{ color }}>{label} visibility</p>
      </div>
    </div>
  )
}
