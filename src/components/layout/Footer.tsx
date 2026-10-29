import Link from "next/link"
import { Sparkles } from "lucide-react"

const footerLinks = {
  Product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/case-studies", label: "Case studies" },
    { href: "/pricing", label: "Pricing" },
    { href: "/compare", label: "Compare" },
    { href: "/integrations", label: "Integrations" },
    { href: "/start", label: "Free AI check" },
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

// Alphaa's own brand profiles. Add X / Instagram here once those accounts exist.
const socials = [
  {
    href: "https://www.linkedin.com/company/135966599/",
    label: "LinkedIn",
    path: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
  },
  {
    href: "https://www.facebook.com/61592044887737",
    label: "Facebook",
    path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z",
  },
  {
    href: "https://medium.com/@alphaaaiagent",
    label: "Medium",
    path: "M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z",
  },
]

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
            <div className="flex gap-2 mt-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Alphaa on ${s.label}`}
                  className="w-8 h-8 rounded-full bg-white border border-[#d2d2d7] flex items-center justify-center text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
                </a>
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
