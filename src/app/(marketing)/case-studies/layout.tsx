import { pageMeta } from "@/lib/seo"

// page.tsx is a client component (category filtering), so metadata lives here.
export const metadata = pageMeta({
  title: "Examples: what an AI Agent does to get you named by AI",
  description:
    "Illustrative examples for dentists, law firms and HVAC companies: what Alphaa's AI Agent does, week by week, to get a business named by ChatGPT, Gemini, Claude and Perplexity.",
  path: "/case-studies",
})

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
