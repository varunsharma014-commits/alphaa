"use client"

// The hero button: the check runs right below it, so jump there and put the
// cursor in the website box instead of leaving the page.
// With `href` it's a plain link instead (homepage → /start, Varun 2026-11-15).
export function HeroCta({ label = "Scan your website free", href }: { label?: string; href?: string }) {
  if (href) return <a className="ag-hero__big" href={href}>{label}</a>
  return (
    <a
      className="ag-hero__big"
      href="#check"
      onClick={(e) => {
        const input = document.getElementById("start-input") as HTMLInputElement | null
        if (!input) return
        e.preventDefault()
        document.getElementById("check")?.scrollIntoView({ behavior: "smooth", block: "center" })
        window.setTimeout(() => input.focus({ preventScroll: true }), 400)
      }}
    >
      {label}
    </a>
  )
}
