"use client"

// The hero button: the check runs right below it, so jump there and put the
// cursor in the website box instead of leaving the page.
export function HeroCta() {
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
      Scan your website free
    </a>
  )
}
