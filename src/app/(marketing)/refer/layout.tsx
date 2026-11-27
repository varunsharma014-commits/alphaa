import { pageMeta } from "@/lib/seo"
import { PLAN_PRICES } from "@/lib/constants"

// 30% of a Pro plan billed monthly for a year, from the live price (was a hard-coded old figure).
const PRO_CUT_YEAR = Math.floor(PLAN_PRICES.pro.monthly * 0.3 * 12).toLocaleString("en-US")

// page.tsx is a client component (the earnings slider), so metadata lives here.
export const metadata = pageMeta({
  title: "Refer & earn — 30% recurring commission",
  description:
    `Refer a business to Alphaa and earn 30% recurring commission for as long as they stay a customer — up to $${PRO_CUT_YEAR} a year per Pro referral. Apply to the partner program.`,
  path: "/refer",
})

export default function ReferLayout({ children }: { children: React.ReactNode }) {
  return children
}
