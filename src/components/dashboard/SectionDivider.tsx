import type { ReactNode } from "react"

// Uppercase section label with a trailing rule line.
export function SectionDivider({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "28px", marginBottom: "14px" }}>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--ds-text-soft)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: "1px", background: "var(--ds-border)" }} />
    </div>
  )
}
