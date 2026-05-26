"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Sparkles } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/pricing", label: "Pricing" },
  { href: "/scan", label: "Free scan" },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-bg-primary/90 backdrop-blur-xl border-b border-white/[0.06]"
            : "bg-bg-primary/60 backdrop-blur-sm"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-orange group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight font-sans">
              alphaa
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-white"
                    : "text-muted hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-white transition-colors"
            >
              Login
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex">
            <OrangePillButton href="/scan" size="sm">
              Get free scan →
            </OrangePillButton>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-muted hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-bg-secondary border-b border-white/[0.08] p-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-white py-2 border-b border-white/[0.06] last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-base font-medium text-muted py-2"
            >
              Login
            </Link>
            <OrangePillButton href="/scan" className="mt-2 w-full justify-center">
              Get free scan →
            </OrangePillButton>
          </div>
        </div>
      )}
    </>
  )
}
