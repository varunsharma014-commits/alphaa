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
        background: "#161616",
        borderRadius: "0 10px 10px 0",
        borderLeft: `3px solid ${accent}`,
        padding: "1rem 1.25rem",
      }
    : {
        background: "#161616",
        border: "0.5px solid #222222",
        borderRadius: "10px",
        padding: "1rem 1.25rem",
      }
  return (
    <div className={className} style={{ ...base, ...style }}>
      {children}
    </div>
  )
}
