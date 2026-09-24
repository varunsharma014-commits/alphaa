"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/how-it-works", label: "How it Works" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
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
          // Apple's global nav: thin, frosted, hairline once you scroll.
          "fixed top-0 left-0 right-0 z-50 transition-colors duration-500 bg-[rgba(251,251,253,0.8)] backdrop-blur-[20px] backdrop-saturate-[1.8]",
          scrolled ? "border-b border-black/[0.08]" : "border-b border-transparent"
        )}
      >
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 relative flex items-center justify-center">
              <Sparkles className="w-[18px] h-[18px] text-[#1d1d1f]" />
            </div>
            <span className="text-[#1d1d1f] font-semibold text-[17px] tracking-[-0.022em]">
              alphaa
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[12px] tracking-[-0.01em] transition-colors duration-300",
                  pathname === link.href
                    ? "text-[#1d1d1f]"
                    : "text-[#1d1d1f]/80 hover:text-[#1d1d1f]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: Login sits directly beside the CTA */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/login"
              className="text-[12px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors duration-300"
            >
              Login
            </Link>
            <Link
              href="/start"
              className="text-[12px] text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full px-3 py-[5px] transition-colors duration-200"
            >
              Free AI Scan
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors"
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
            className="absolute inset-0 bg-[rgba(251,251,253,0.96)] backdrop-blur-[20px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-12 left-0 right-0 px-10 pt-6 pb-10 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] py-1.5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-[28px] font-semibold tracking-[-0.015em] text-[#1d1d1f] py-1.5"
            >
              Login
            </Link>
            <Link href="/start" className="mt-6 self-start text-[17px] text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full px-5 py-2.5 transition-colors">
              Free AI Scan
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
