import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

// Standard empty state: orange icon tile + value-stating title + reassuring body.
// Pass an action button (or any node) as children. Omit children for fully
// automatic flows that need no user action.

export function EmptyState({
  icon: Icon,
  title,
  body,
  sub,
  children,
}: {
  icon: LucideIcon
  title: string
  body: string
  sub?: string
  children?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={22} color="#e05a2b" />
      </div>
      <div style={{ maxWidth: "420px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", marginBottom: "6px" }}>
          {title}
        </h3>
        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>{body}</p>
        {sub && <p style={{ fontSize: "11px", color: "#555555", marginTop: "8px" }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}
