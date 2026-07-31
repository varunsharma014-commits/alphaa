import Link from "next/link"

// Without this file Next.js falls back to its own bare 404, which renders on
// the root <body> (bg-bg-primary, dark by default) and so appeared as a black
// page with no nav or branding. This one opts into the light marketing theme.
export const metadata = { title: "Page not found" }

const links = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/blog", label: "Blog" },
]

export default function NotFound() {
  return (
    <div
      data-theme="light"
      data-brand="blue"
      className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-6 text-center"
    >
      <p className="text-muted text-sm font-semibold tracking-widest uppercase mb-4">404</p>
      <h1 className="text-[36px] sm:text-[52px] font-bold text-fg leading-[1.1] tracking-tight mb-4 text-balance">
        We couldn&apos;t find that page.
      </h1>
      <p className="text-muted text-lg max-w-md mb-9">
        The link may be out of date, or the page may have moved.
      </p>

      <Link
        href="/scan"
        className="btn-orange inline-flex items-center px-7 py-3.5 rounded-full text-[15px] font-semibold"
      >
        See where you rank on AI →
      </Link>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-muted hover:text-fg text-sm transition-colors duration-200"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
