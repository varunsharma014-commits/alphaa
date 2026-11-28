import type { Metadata } from "next"
import Link from "next/link"
import { realAuth } from "@/lib/auth"
import { openInvite } from "@/lib/team/store"
import { ROLE_HINT, ROLE_LABEL, isMemberRole } from "@/lib/team/permissions"
import { AcceptButton } from "./AcceptButton"

// Where a team invite email lands (lib/team/store.ts). Signed out: create a login or sign in with
// the invited email, then come back here. Signed in: one tap to accept (POST /api/team/accept
// checks the token and that the login's verified email is the invited one).

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Join the team", robots: { index: false, follow: false } }

export default async function AcceptPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams
  const v = await openInvite(t).catch(() => ({ ok: false as const, error: "This invite link has expired. Ask for a new one." }))
  const { userId } = await realAuth()
  const back = `/team/accept?t=${encodeURIComponent(t)}`

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-12 bg-white text-black">
      <div className="w-full max-w-md">
        {!v.ok ? (
          <>
            <h1 className="text-2xl font-semibold mb-3">{v.error}</h1>
            <p className="text-neutral-600">The person who invited you can send a new one from Your rules in Alphaa.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-2">Team invite</p>
            <h1 className="text-2xl font-semibold mb-3">Work on {v.brand.businessName?.trim() || v.brand.websiteUrl || "this brand"} in Alphaa</h1>
            {isMemberRole(v.member.role) && (
              <p className="text-neutral-700 mb-6">
                You’re invited as a <b>{ROLE_LABEL[v.member.role].toLowerCase()}</b>. {ROLE_HINT[v.member.role]}
              </p>
            )}
            {v.member.status === "active" ? (
              <Link href="/dashboard" className="inline-block rounded-full bg-black text-white px-6 py-3 font-semibold">Open Alphaa</Link>
            ) : userId ? (
              <AcceptButton token={t} email={v.member.email} />
            ) : (
              <div className="flex flex-col gap-3">
                <Link href={`/signup?redirect_url=${encodeURIComponent(back)}`} className="w-full text-center rounded-full bg-black text-white py-3.5 font-semibold">Create a free login</Link>
                <Link href={`/login?redirect_url=${encodeURIComponent(back)}`} className="w-full text-center rounded-full border border-neutral-300 py-3.5 font-semibold">I already have one</Link>
                <p className="text-sm text-neutral-500">Use {v.member.email}. The invite only works for that address.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
