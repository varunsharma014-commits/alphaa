import type { Metadata } from "next"
import Link from "next/link"
import { readApproveToken } from "@/lib/approve-token"
import { approvalPreview } from "@/lib/approvals"
import { ApproveButton } from "./ApproveButton"

// Where "Approve & publish" in the weekly briefing email lands. The link names
// one item; the owner sees exactly what goes live and taps once more to publish
// (a page, not a GET action, so mail scanners that open links publish nothing).

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Approve", robots: { index: false, follow: false } }

export default async function ApprovePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams
  const claim = readApproveToken(t)
  const item = claim ? await approvalPreview(claim.u, claim.k, claim.i).catch(() => null) : null

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-12 bg-white text-black">
      <div className="w-full max-w-lg">
        {!claim || !item ? (
          <>
            <h1 className="text-2xl font-semibold mb-3">This link has expired.</h1>
            <p className="text-neutral-600">Open Alphaa and it’s waiting for you at the top.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-2">Waiting for your OK</p>
            <h1 className="text-xl font-semibold mb-4">{item.title}</h1>
            <div className="whitespace-pre-wrap border border-neutral-200 rounded-2xl p-4 text-[15px] leading-relaxed mb-5 max-h-[50vh] overflow-auto">{item.text}</div>
            {item.done ? (
              <p className="font-medium">Already published. Nothing else to do.</p>
            ) : (
              <ApproveButton token={t} kind={claim.k} id={claim.i} />
            )}
          </>
        )}
        <p className="mt-8 text-sm">
          <Link href="/dashboard" className="text-neutral-500 underline">Edit it in Alphaa</Link>
        </p>
      </div>
    </main>
  )
}
