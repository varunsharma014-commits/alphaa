import type { ReactNode } from "react"

// Uppercase section label with a trailing rule line.
export function SectionDivider({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", marginBottom: "8px" }}>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--ds-text-ghost)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: "1px", background: "var(--ds-border)" }} />
    </div>
  )
}
