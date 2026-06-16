import type { CSSProperties, ReactNode } from "react"

export type PillVariant = "found" | "warning" | "error" | "neutral" | "info"

const VARIANTS: Record<PillVariant, { bg: string; color: string; border: string }> = {
  found: { bg: "#0d2218", color: "#22c55e", border: "#14532d" },
  warning: { bg: "#1a1200", color: "#f59e0b", border: "#78350f" },
  error: { bg: "#1a0808", color: "#dc2626", border: "#7f1d1d" },
  neutral: { bg: "#1a1a1a", color: "#666666", border: "#2a2a2a" },
  info: { bg: "#0d1520", color: "#3b82f6", border: "#1e2d45" },
}

export function StatusPill({
  variant = "neutral",
  children,
  style,
}: {
  variant?: PillVariant
  children: ReactNode
  style?: CSSProperties
}) {
  const s = VARIANTS[variant]
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: "10px",
        fontWeight: 500,
        padding: "2px 10px",
        borderRadius: "20px",
        display: "inline-block",
        whiteSpace: "nowrap",
        lineHeight: 1.5,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
