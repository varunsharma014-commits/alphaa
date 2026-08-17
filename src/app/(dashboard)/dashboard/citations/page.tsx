export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { CitationsClient } from "./CitationsClient"
import type { CitationReport } from "@/lib/citations"

export const metadata = { title: "Where AI looks you up" }

function readReport(metadata: unknown): CitationReport | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const m = metadata as Record<string, unknown>
  if (!Array.isArray(m.targets)) return null
  return m as unknown as CitationReport
}

export default async function CitationsPage() {
  const { userId: clerkId } = await auth()
  const user = clerkId ? await db.user.findUnique({ where: { clerkId } }) : null

  const row = user
    ? await db.mockActivity.findFirst({
        where: { userId: user.id, type: "citation_scan" },
        orderBy: { createdAt: "desc" },
      })
    : null

  return <CitationsClient initial={row ? readReport(row.metadata) : null} />
}
