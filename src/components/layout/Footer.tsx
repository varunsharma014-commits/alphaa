import Link from "next/link"
import { Sparkles } from "lucide-react"
import { MarketSwitcher } from "@/components/layout/MarketSwitcher"
import { CookieSettingsLink } from "@/components/common/CookieSettingsLink"
import "@/components/marketing/v3/v3.css"

const footerLinks = {
  Services: [
    { href: "/services/social-media-management", label: "Social media management" },
    { href: "/services/ads-management", label: "Ads management" },
    { href: "/services/ai-search-optimization", label: "SEO & AI search" },
    { href: "/services/content-writing", label: "Blog & content writing" },
    { href: "/services/email-marketing", label: "Email marketing" },
  ],
  Product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/case-studies", label: "Case studies" },
    { href: "/pricing", label: "Pricing" },
    { href: "/compare", label: "Compare" },
    { href: "/integrations", label: "Connections" },
    { href: "/start", label: "Get started" },
    { href: "/refer", label: "Refer & Earn" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/impressum", label: "Impressum" },
    { href: "/accessibility", label: "Accessibility" },
  ],
}

const engines = ["ChatGPT", "Claude", "Gemini", "Perplexity"]

// Alphaa's own brand profiles. Add X here once that account exists.
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
    href: "https://www.instagram.com/alphaa.ai.agent/",
    label: "Instagram",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z",
  },
  {
    href: "https://medium.com/@alphaaaiagent",
    label: "Medium",
    path: "M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z",
  },
]

export function Footer() {
  return (
    <footer className="v3 v3-foot">
      <div className="v3-foot__in">
        <div className="v3-foot__grid">
          <div className="v3-foot__brand">
            <Link href="/" className="v3-logo" style={{ marginBottom: 12 }}>
              <Sparkles aria-hidden="true" />
              alphaa
            </Link>
            <p style={{ maxWidth: 340 }}>
              Your AI marketing agent. I run your social media, ads, SEO, blogs and email every week, and work to get you recommended by ChatGPT, Claude, Gemini and Perplexity. From $99/month.
            </p>
            <p style={{ marginTop: 8 }}>{engines.join(" · ")}</p>
            <div className="v3-foot__social">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={`Alphaa on ${s.label}`}>
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3>{section}</h3>
              <ul>
                {links.map((link) => (
                  <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
                ))}
                {section === "Company" && (
                  <li><CookieSettingsLink /></li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="v3-foot__legal">
          <p>AI visibility results vary by business, location, and industry. No specific rankings or revenue outcomes are guaranteed.</p>
          <p>Alphaa is not affiliated with, endorsed by, or sponsored by OpenAI, Anthropic, Google LLC, Microsoft Corporation, or Perplexity AI.</p>
          <div className="v3-foot__bottom">
            <p>Copyright © {new Date().getFullYear()} Alphaa. All rights reserved.</p>
            <MarketSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
