import type { CSSProperties, ReactNode } from "react"

export type PillVariant = "found" | "warning" | "error" | "neutral" | "info"

// Black & white status language (same as /start and the ads): solid
// black = good, solid mid-grey = partial, hollow grey ring = missing/neutral.
// Only "error" keeps a hue, for real failures.
const VARIANTS: Record<PillVariant, { bg: string; color: string; border: string }> = {
  found: { bg: "var(--ds-accent)", color: "var(--ds-on-accent)", border: "var(--ds-accent)" },
  warning: { bg: "var(--ds-partial)", color: "var(--ds-on-accent)", border: "var(--ds-partial)" },
  error: { bg: "var(--ds-bad-bg)", color: "var(--ds-bad)", border: "var(--ds-bad-border)" },
  neutral: { bg: "transparent", color: "var(--ds-text-mute)", border: "var(--ds-border-3)" },
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
        fontSize: "12px",
        fontWeight: 590,
        padding: "3px 11px",
        borderRadius: "20px",
        display: "inline-block",
        whiteSpace: "nowrap",
        lineHeight: 1.5,
        letterSpacing: "-0.01em",
        ...style,
      }}
    >
      {children}
    </span>
  )
}
