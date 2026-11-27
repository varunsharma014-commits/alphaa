import { pageMeta } from "@/lib/seo"

// page.tsx is a client component (category filtering), so metadata lives here.
export const metadata = pageMeta({
  title: "Examples: what an AI marketing agent does for a local business",
  description:
    "Illustrative examples (not real customers) for dentists, law firms, home services, med spas, restaurants, fitness studios, real-estate teams, online stores and SaaS: what Alphaa's AI agent does, week by week, to run their marketing, from Google posts and reviews to getting named by ChatGPT, Gemini, Claude and Perplexity.",
  path: "/case-studies",
})

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
