import { LocalIndustry, industryMeta, industryParams, MARKETS } from "@/components/marketing/local/LocalIndustry"

export const dynamicParams = false
export function generateStaticParams() {
  return industryParams(MARKETS.de)
}
export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }) {
  return industryMeta(MARKETS.de, (await params).industry)
}
export default async function Page({ params }: { params: Promise<{ industry: string }> }) {
  return <LocalIndustry m={MARKETS.de} slug={(await params).industry} />
}
