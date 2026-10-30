import { LocalGuide, guideMeta, guideParams } from "@/components/marketing/local/LocalGuide"

export const dynamicParams = false
export function generateStaticParams() {
  return guideParams("uk")
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return guideMeta("uk", (await params).slug)
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <LocalGuide k="uk" slug={(await params).slug} />
}
