// Loading shimmer. Use instead of "Loading…" text. kind: line (text), row (list row), card, tile, circle.
export function Skeleton({ kind = "line", width, height, lines = 3, rows = 3 }: {
  kind?: "line" | "title" | "row" | "card" | "tile" | "circle"
  width?: number | string
  height?: number
  /** card: text lines */
  lines?: number
  /** row: how many rows */
  rows?: number
}) {
  if (kind === "row") {
    return (
      <div aria-busy="true" aria-label="Loading">
        {Array.from({ length: rows }, (_, i) => (
          <div className="xd-skrow" key={i}>
            <span className="xd-sk" style={{ width: 36, height: 36, borderRadius: 10, flex: "none" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="xd-sk line" style={{ width: `${70 - i * 12}%` }} />
              <span className="xd-sk line" style={{ width: "40%", height: 10 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (kind === "card") {
    return (
      <div className="ax-card xd-skcard" aria-busy="true" aria-label="Loading">
        <span className="xd-sk line t" style={{ width: "45%" }} />
        {Array.from({ length: lines }, (_, i) => <span key={i} className="xd-sk line" style={{ width: i === lines - 1 ? "60%" : "100%" }} />)}
      </div>
    )
  }
  if (kind === "tile") {
    return (
      <div className="xd-stat" aria-busy="true" aria-label="Loading">
        <span className="xd-sk line" style={{ width: "50%" }} />
        <span className="xd-sk" style={{ width: "70%", height: 26 }} />
      </div>
    )
  }
  if (kind === "circle") return <span className="xd-sk circ" style={{ width: width ?? 32, height: height ?? width ?? 32, display: "inline-block" }} aria-hidden="true" />
  return <span className={`xd-sk line${kind === "title" ? " t" : ""}`} style={{ width: width ?? "100%", height }} aria-hidden="true" />
}
