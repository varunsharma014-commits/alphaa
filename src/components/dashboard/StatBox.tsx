import type { ReactNode } from "react"

export type StatTone = "default" | "success" | "warning" | "danger" | "muted"

const TONE_COLOR: Record<StatTone, string> = {
  default: "var(--ds-text)",
  success: "var(--ds-ok)",
  warning: "var(--ds-warn)",
  danger: "var(--ds-bad)",
  muted: "var(--ds-text-mute)",
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
        background: "var(--ds-surface)",
        border: "1px solid var(--ds-border)",
        borderRadius: "8px",
        padding: "10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "22px", fontWeight: 500, color: TONE_COLOR[tone], lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: "10px", color: "var(--ds-text-faint)", marginTop: "2px", lineHeight: 1.3 }}>
        {label}
      </div>
      {delta && (
        <div
          style={{
            fontSize: "10px",
            marginTop: "2px",
            color: deltaDir === "down" ? "var(--ds-bad)" : "var(--ds-ok)",
          }}
        >
          {deltaDir === "down" ? "↓" : "↑"} {delta}
        </div>
      )}
    </div>
  )
}
