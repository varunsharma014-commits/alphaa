export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { pageTitle } from "@/lib/page-title"
import { ENGINE_LABEL, ENGINE_ORDER, getEngineDetail } from "@/lib/workspace/visibility"
import type { EngineKey } from "@/lib/engine-evidence"
import { EngineDetailView } from "@/components/workspace/EngineDetailView"
import RunScanButton from "../RunScanButton"

const isEngine = (e: string): e is EngineKey => (ENGINE_ORDER as string[]).includes(e)

export async function generateMetadata({ params }: { params: Promise<{ engine: string }> }): Promise<Metadata> {
  const { engine } = await params
  return { title: pageTitle(isEngine(engine) ? `${ENGINE_LABEL[engine]} · AI search` : "AI search") }
}

export default async function EngineVisibilityPage({ params }: { params: Promise<{ engine: string }> }) {
  const { engine } = await params
  // The retired "Google AI" page reused Gemini's data: send old links there instead of 404ing.
  if (engine === "google-ai") redirect("/dashboard/visibility/gemini")
  if (!isEngine(engine)) notFound()

  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  return <EngineDetailView data={await getEngineDetail(user, engine)} action={<RunScanButton />} />
}
