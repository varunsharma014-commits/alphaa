import type { Metadata } from "next"

// page.tsx is a client component (the earnings slider), so metadata lives here.
export const metadata: Metadata = {
  title: "Refer & earn — 30% recurring commission",
  description:
    "Refer a business to Alphaa and earn 30% recurring commission for as long as they stay a customer — up to $716 a year per Pro referral. Apply to the partner program.",
  alternates: { canonical: "/refer" },
}

export default function ReferLayout({ children }: { children: React.ReactNode }) {
  return children
}
