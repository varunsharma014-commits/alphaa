import type { Metadata } from "next"

// page.tsx is a client component (category filtering), so metadata lives here.
export const metadata: Metadata = {
  title: "Case studies — businesses getting found on AI search",
  description:
    "How local businesses went from invisible on AI search to being named by ChatGPT, Claude, Gemini, and Perplexity — with the timelines, the work involved, and what it replaced.",
  alternates: { canonical: "/case-studies" },
}

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
