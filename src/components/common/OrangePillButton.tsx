"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"

interface OrangePillButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: "primary" | "ghost"
  size?: "sm" | "md" | "lg"
  className?: string
  type?: "button" | "submit"
  disabled?: boolean
  loading?: boolean
}

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
}

export function OrangePillButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
  loading,
}: OrangePillButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 cursor-pointer",
    sizeClasses[size],
    variant === "primary" && "btn-orange",
    variant === "ghost" && "btn-ghost",
    (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none",
    className
  )

  if (href) {
    return (
      <Link href={href} className={base}>
        {loading ? <Spinner /> : children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={base}>
      {loading ? <Spinner /> : children}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
