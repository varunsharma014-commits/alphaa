import type { CSSProperties, ReactNode } from "react"

// Design-system card. Default = bordered card. Pass `accent` (a hex color) for
// the left-accent-border variant.
export function DsCard({
  accent,
  className,
  style,
  children,
}: {
  accent?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const base: CSSProperties = accent
    ? {
        background: "var(--ds-surface)",
        borderRadius: "0 16px 16px 0",
        borderLeft: `3px solid ${accent}`,
        padding: "1.25rem 1.5rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        transition: "box-shadow 200ms ease, transform 200ms ease",
      }
    : {
        background: "var(--ds-surface)",
        border: "1px solid var(--ds-border)",
        borderRadius: "16px",
        padding: "1.25rem 1.5rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        transition: "box-shadow 200ms ease, transform 200ms ease",
      }
  return (
    <div className={className} style={{ ...base, ...style }}>
      {children}
    </div>
  )
}
