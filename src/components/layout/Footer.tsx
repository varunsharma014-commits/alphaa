import Link from "next/link"
import { Sparkles } from "lucide-react"

const footerLinks = {
  Product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/scan", label: "Free scan" },
  ],
  Company: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              <span className="text-white font-semibold text-lg font-sans">alphaa</span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              The platform that gets local businesses found on Google, ChatGPT, and Maps — automatically. No agency. No contracts.
            </p>
            <p className="text-muted/50 text-xs mt-6">
              © {new Date().getFullYear()} Alphaa. All rights reserved.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-white font-medium text-sm mb-4">{section}</p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted text-sm hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
