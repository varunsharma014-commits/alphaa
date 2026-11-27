import { pageMeta } from "@/lib/seo"

// page.tsx is a client component (category filtering), so metadata lives here.
export const metadata = pageMeta({
  title: "How 11 Kinds of Businesses Get Recommended by AI",
  description:
    "Dentists, law firms, plumbers, med spas, restaurants, real-estate teams, Shopify brands and SaaS: the exact questions customers ask ChatGPT and a week-by-week plan to show up.",
  path: "/case-studies",
})

export default function CaseStudiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
