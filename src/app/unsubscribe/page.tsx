import type { Metadata } from "next"
import Link from "next/link"
import { unsubscribeBySignedLink } from "@/lib/unsubscribe"

// The footer link in every marketing email. Opening it unsubscribes the
// address straight away (no extra click) and says so in plain words.

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } }

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; t?: string }>
}) {
  const { s = "", t = "" } = await searchParams
  const ok = await unsubscribeBySignedLink(s, t).catch((e) => {
    console.error("[unsubscribe] failed", e)
    return false
  })

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        {ok ? (
          <>
            <h1 className="text-2xl font-semibold text-fg mb-3">You’re unsubscribed.</h1>
            <p className="text-muted text-base">
              You won’t get any more marketing email from Alphaa. If you have an account, billing and
              account email still arrives.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-fg mb-3">That link didn’t work.</h1>
            <p className="text-muted text-base">
              It may be incomplete. Email{" "}
              <a href="mailto:hi@alphaa.app" className="underline">hi@alphaa.app</a> and we’ll remove you by hand.
            </p>
          </>
        )}
        <p className="mt-8 text-sm">
          <Link href="/" className="text-muted underline">alphaa.app</Link>
        </p>
      </div>
    </main>
  )
}
