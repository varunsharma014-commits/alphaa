import Link from "next/link"
import { Sparkles } from "lucide-react"

const footerLinks = {
  Product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/case-studies", label: "Case studies" },
    { href: "/pricing", label: "Pricing" },
    { href: "/compare", label: "Compare" },
    { href: "/start", label: "Free visibility scan" },
    { href: "/refer", label: "Refer & Earn" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
}

const engines = ["ChatGPT", "Claude", "Gemini", "Perplexity"]

export function Footer() {
  return (
    <footer className="bg-[#f5f5f7] text-[12px] leading-[1.33] tracking-[-0.01em] text-[#6e6e73]">
      <div className="max-w-[980px] mx-auto px-4 sm:px-6 pt-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#1d1d1f]" />
              <span className="text-[#1d1d1f] font-semibold text-[14px]">alphaa</span>
            </Link>
            <p className="text-[#6e6e73] text-[12px] leading-[1.5] max-w-xs mb-3">
              Get your business found on every AI search engine — ChatGPT, Claude, Gemini, and Perplexity. Automatically. $99/month.
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {engines.map((e) => (
                <span key={e} className="text-[12px] text-[#86868b]">
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <p className="text-[#1d1d1f] font-semibold text-[12px] mb-2.5">{section}</p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#424245] text-[12px] hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#d2d2d7] pt-4 space-y-3">
          <div className="flex flex-col gap-2">
            <p className="text-[#6e6e73] text-[12px]">
              AI visibility results vary by business, location, and industry. No specific rankings or revenue outcomes are guaranteed.
            </p>
            <p className="text-[#6e6e73] text-[12px]">
              Alphaa is not affiliated with, endorsed by, or sponsored by OpenAI, Anthropic, Google LLC, Microsoft Corporation, or Perplexity AI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[#6e6e73] text-[12px]">Copyright © {new Date().getFullYear()} Alphaa. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
