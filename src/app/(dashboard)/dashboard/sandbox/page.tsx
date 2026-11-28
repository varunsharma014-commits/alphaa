export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { checkQuota } from "@/lib/quotas"
import { pageTitle } from "@/lib/page-title"
import { latestQuestionScan } from "@/lib/questions"
import { PageHeader } from "@/components/workspace/ui"
import SandboxClient from "@/components/dashboard/SandboxClient"
import { SANDBOX_DAILY_LIMIT, suggestedQuestion } from "@/lib/sandbox"

export const metadata = { title: pageTitle("Ask the AIs") }

export default async function SandboxPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  // Resolve clerkId to the internal user.id before any child query.
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  // Same quota the API enforces (lib/quotas.ts sandbox_question), so the page opens with a true number.
  const [quota, qs] = await Promise.all([
    checkQuota(user, "sandbox_question", { record: false }),
    latestQuestionScan(user.id).catch(() => null),
  ])
  const limit = quota.limit ?? SANDBOX_DAILY_LIMIT
  const remaining = quota.remaining ?? limit
  const questions = [...new Set((qs?.scan.questions ?? []).map((q) => q.q?.trim()).filter((q): q is string => !!q && q.length <= 200))].slice(0, 5)

  return (
    <>
      <PageHeader
        title="Ask the AIs"
        sub="Ask any question a customer might ask and see what ChatGPT, Claude, Perplexity and Gemini answer right now."
      />
      <SandboxClient
        businessName={user.businessName ?? ""}
        placeholder={suggestedQuestion(user.businessType, user.city)}
        initialRemaining={remaining}
        limit={limit}
        questions={questions}
      />
    </>
  )
}
