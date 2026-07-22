import Link from "next/link"

// ─────────────────────────────────────────────────────────────────────────────
// (newhome) LAYOUT — light, Apple-inspired.
//
// The route lives in its own group so it escapes the dark (marketing) layout
// (which pins data-theme="dark" + dark nav/footer). We render a full-height WHITE
// wrapper that covers the dark root <body>, our own minimal Apple-style nav +
// footer, and set the SF-Pro system font stack for everything inside.
// ─────────────────────────────────────────────────────────────────────────────

const APPLE_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif'

const NAV_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Reviews", href: "#reviews" },
  { label: "Pricing", href: "#pricing" },
]

export default function NewHomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="light"
      className="min-h-screen bg-white text-[#1d1d1f] relative z-10"
      style={{ fontFamily: APPLE_FONT }}
    >
      {/* ── Apple-style nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <nav className="max-w-[1024px] mx-auto h-12 px-4 flex items-center justify-between">
          <Link href="/new-home-page" className="text-[17px] font-semibold tracking-tight text-[#1d1d1f]">
            alphaa
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[12px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:inline text-[12px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/scan"
              className="text-[12px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ED] px-4 py-1.5 rounded-full transition-colors duration-200"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      {/* ── Apple-style footer ──────────────────────────────────────────── */}
      <footer className="bg-[#f5f5f7] border-t border-black/[0.06]">
        <div className="max-w-[1024px] mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-[12px]">
            <div>
              <p className="text-[#6e6e73] font-semibold mb-3">Product</p>
              <ul className="space-y-2 text-[#6e6e73]">
                <li><a href="#features" className="hover:text-[#1d1d1f]">Features</a></li>
                <li><a href="#how" className="hover:text-[#1d1d1f]">How it works</a></li>
                <li><a href="#pricing" className="hover:text-[#1d1d1f]">Pricing</a></li>
                <li><Link href="/scan" className="hover:text-[#1d1d1f]">Free scan</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[#6e6e73] font-semibold mb-3">Company</p>
              <ul className="space-y-2 text-[#6e6e73]">
                <li><Link href="/case-studies" className="hover:text-[#1d1d1f]">Case studies</Link></li>
                <li><Link href="/blog" className="hover:text-[#1d1d1f]">Blog</Link></li>
                <li><a href="#reviews" className="hover:text-[#1d1d1f]">Reviews</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[#6e6e73] font-semibold mb-3">Legal</p>
              <ul className="space-y-2 text-[#6e6e73]">
                <li><Link href="/terms" className="hover:text-[#1d1d1f]">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-[#1d1d1f]">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[#6e6e73] font-semibold mb-3">Get started</p>
              <ul className="space-y-2 text-[#6e6e73]">
                <li><Link href="/signup" className="hover:text-[#1d1d1f]">Start free trial</Link></li>
                <li><Link href="/login" className="hover:text-[#1d1d1f]">Sign in</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-black/[0.08] text-[11px] text-[#86868b]">
            <p>Copyright © 2026 Alphaa. AI Search Optimization for local businesses. This is a design preview.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
