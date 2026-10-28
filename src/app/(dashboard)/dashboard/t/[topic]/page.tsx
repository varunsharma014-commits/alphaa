import { redirect } from "next/navigation"

// Retired: every topic now opens inside the home briefing (/dashboard?ask=<topic>).
// Kept as a redirect so old email links and website-connect callbacks still land
// in the right place; any query (?connected=…, ?connect=…) is passed along.
export default async function TopicPage({ params, searchParams }: { params: Promise<{ topic: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { topic } = await params
  const q = new URLSearchParams({ ask: topic })
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string") q.set(k, v)
  redirect(`/dashboard?${q}`)
}
