"use client"

// Renders a date in the VISITOR's timezone. Server-side toLocaleDateString
// runs in UTC on Railway, which showed "Written Jul 21" to a user for whom it
// was still Jul 20. Render nothing on the server and fill in after hydration
// so the date is always the user's own.

import { useEffect, useState } from "react"

export function LocalDate({ iso }: { iso: string | Date }) {
  const [text, setText] = useState("")
  useEffect(() => {
    const d = typeof iso === "string" ? new Date(iso) : iso
    setText(d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
  }, [iso])
  return <>{text}</>
}
