import type { CSSProperties, ReactNode } from "react"

export type PillVariant = "found" | "warning" | "error" | "neutral" | "info"

const VARIANTS: Record<PillVariant, { bg: string; color: string; border: string }> = {
  found: { bg: "var(--ds-ok-bg)", color: "var(--ds-ok)", border: "var(--ds-ok-border)" },
  warning: { bg: "var(--ds-warn-bg)", color: "var(--ds-warn)", border: "var(--ds-warn-border)" },
  error: { bg: "var(--ds-bad-bg)", color: "var(--ds-bad)", border: "var(--ds-bad-border)" },
  neutral: { bg: "var(--ds-surface)", color: "var(--ds-text-soft)", border: "var(--ds-border-2)" },
  info: { bg: "var(--ds-info-bg)", color: "var(--ds-info)", border: "var(--ds-info-border)" },
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
