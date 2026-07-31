import type { Metadata } from "next"

// page.tsx is a client component (the monthly/annual toggle needs state), and
// client components can't export metadata — hence this layout.
export const metadata: Metadata = {
  title: "Pricing — $99/month, no contracts",
  description:
    "Alphaa is $99/month with a 14-day free trial and no contracts. Starter, Pro, and Full Service plans that get your business recommended by ChatGPT, Claude, Gemini, and Perplexity — instead of a $2,000/month SEO agency.",
  alternates: { canonical: "/pricing" },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
