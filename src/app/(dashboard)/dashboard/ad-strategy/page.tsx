import { redirect } from "next/navigation"

// The ad plan lives under Ads now (2026-11-28).
export default async function AdStrategyPage({ searchParams }: { searchParams: Promise<{ print?: string }> }) {
  const { print } = await searchParams
  redirect(print === "1" ? "/dashboard/ads/plan?print=1" : "/dashboard/ads/plan")
}
