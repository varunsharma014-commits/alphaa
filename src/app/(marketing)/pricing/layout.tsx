import type { Metadata } from "next"

// page.tsx is a client component (the monthly/annual toggle needs state), and
// client components can't export metadata — hence this layout.
export const metadata: Metadata = {
  title: "Pricing — $99/month, no contracts",
  description:
    "Alphaa is an AI agent that gets your business recommended by ChatGPT, Claude, Gemini and Perplexity. From $99/month, month to month, no contracts — instead of a $2,000/month SEO agency. Starter, Pro and Full Service plans.",
  alternates: { canonical: "/pricing" },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
