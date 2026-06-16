import type { ReactNode } from "react"

export type StatTone = "default" | "success" | "warning" | "danger" | "muted"

const TONE_COLOR: Record<StatTone, string> = {
  default: "#ffffff",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#dc2626",
  muted: "#888888",
}

export function StatBox({
  value,
  label,
  delta,
  deltaDir,
  tone = "default",
}: {
  value: ReactNode
  label: string
  delta?: string
  deltaDir?: "up" | "down"
  tone?: StatTone
}) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #222222",
        borderRadius: "8px",
        padding: "10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "22px", fontWeight: 500, color: TONE_COLOR[tone], lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: "10px", color: "#555555", marginTop: "2px", lineHeight: 1.3 }}>
        {label}
      </div>
      {delta && (
        <div
          style={{
            fontSize: "10px",
            marginTop: "2px",
            color: deltaDir === "down" ? "#dc2626" : "#22c55e",
          }}
        >
          {deltaDir === "down" ? "↓" : "↑"} {delta}
        </div>
      )}
    </div>
  )
}
