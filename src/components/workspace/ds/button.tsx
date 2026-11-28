"use client"

import Link from "next/link"
import type { ReactNode, MouseEvent } from "react"

// The one button. Primary is the blue action; there is at most one per card.
// variant: primary (blue) | secondary (soft) | ghost (red text, for remove/stop) | undo (blue text) | grad | danger (solid red)
export type ButtonVariant = "primary" | "secondary" | "ghost" | "undo" | "grad" | "danger"
const CLS: Record<ButtonVariant, string> = { primary: "p", secondary: "s", ghost: "d", undo: "d undo", grad: "grad", danger: "r" }

export function Spinner({ size = 14, label }: { size?: number; label?: string }) {
  return <span className="xd-spin" style={{ width: size, height: size }} role={label ? "status" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
}

export function Button({
  children, variant = "secondary", size, loading = false, disabled, href, external, onClick, type = "button", className = "", icon, title, ariaLabel,
}: {
  children: ReactNode
  variant?: ButtonVariant
  size?: "sm"
  /** Spinner + disabled while the work runs; the label stays so the button doesn't jump. */
  loading?: boolean
  disabled?: boolean
  href?: string
  /** Open href in a new tab. */
  external?: boolean
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  type?: "button" | "submit"
  className?: string
  icon?: ReactNode
  title?: string
  ariaLabel?: string
}) {
  const cls = `ax-btn ${CLS[variant]}${size === "sm" ? " sm" : ""} ${className}`.trim()
  const inner = <>{loading ? <Spinner size={size === "sm" ? 12 : 14} /> : icon}{children}</>
  if (href && !disabled && !loading) {
    if (external || /^https?:/.test(href) || href.startsWith("/api/")) {
      return <a className={cls} href={href} onClick={onClick} title={title} aria-label={ariaLabel} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>
    }
    return <Link className={cls} href={href} onClick={onClick} title={title} aria-label={ariaLabel}>{inner}</Link>
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined} title={title} aria-label={ariaLabel}>
      {inner}
    </button>
  )
}
