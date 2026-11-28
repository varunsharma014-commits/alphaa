import type { ReactNode } from "react"

// Status is always a soft pill, never a solid black button. Actions are always Buttons.
export type Tone = "ok" | "warn" | "bad" | "info" | "idle" | "glass"
const TONE: Record<Tone, string> = { ok: "g", warn: "a", bad: "r", info: "b", idle: "n", glass: "w" }

export function Pill({ tone = "idle", children, dot = false, title }: { tone?: Tone; children: ReactNode; dot?: boolean; title?: string }) {
  return (
    <span className={`ax-pill ${TONE[tone]}`} title={title}>
      {dot && <span className={`xd-sd ${tone === "ok" ? "ok" : tone === "warn" ? "warn" : tone === "bad" ? "bad" : ""}`} aria-hidden="true" />}
      {children}
    </span>
  )
}

/** The status dot alone (connections, rows). */
export function StatusDot({ tone = "idle", label }: { tone?: "ok" | "warn" | "bad" | "idle"; label?: string }) {
  return <span className={`xd-sd ${tone === "idle" ? "" : tone}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
}
