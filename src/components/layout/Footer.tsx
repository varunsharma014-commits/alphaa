import Link from "next/link"
import { Sparkles } from "lucide-react"

const footerLinks = {
  Product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/case-studies", label: "Case studies" },
    { href: "/pricing", label: "Pricing" },
    { href: "/scan", label: "Free visibility scan" },
    { href: "/refer", label: "Refer & Earn" },
  ],
  Company: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
}

const engines = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Google AI", "Copilot"]

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-brand-orange" />
              <span className="text-white font-semibold text-lg font-sans">alphaa</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-5">
              Get your business found on every AI search engine — ChatGPT, Claude, Gemini, Perplexity, Google AI, and Copilot. Automatically. $99/month.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {engines.map((e) => (
                <span key={e} className="text-xs text-white/30 border border-white/[0.08] px-2 py-0.5 rounded-full">
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-white/60 font-medium text-xs uppercase tracking-widest mb-4">{section}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/40 text-sm hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-8 space-y-4">
          <div className="border-t border-white/[0.04] pt-4 flex flex-col gap-2">
            <p className="text-white/20 text-xs text-center">
              AI visibility results vary by business, location, and industry. No specific rankings or revenue outcomes are guaranteed.
            </p>
            <p className="text-white/20 text-xs text-center">
              Alphaa is not affiliated with, endorsed by, or sponsored by OpenAI, Anthropic, Google LLC, Microsoft Corporation, or Perplexity AI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/25 text-xs">© {new Date().getFullYear()} Alphaa. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
