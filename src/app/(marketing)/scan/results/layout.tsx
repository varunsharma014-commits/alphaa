import type { Metadata } from "next"

// Each report is private (opened from an emailed link), so none of them
// belong in search results.
export const metadata: Metadata = {
  title: "Your AI check report",
  robots: { index: false, follow: false },
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children
}
