import { LocalGuide, guideMeta, guideParams } from "@/components/marketing/local/LocalGuide"

export const dynamicParams = false
export function generateStaticParams() {
  return guideParams("fr")
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return guideMeta("fr", (await params).slug)
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <LocalGuide k="fr" slug={(await params).slug} />
}
