"use client"

import { useState } from "react"

export function ApproveButton({ token, kind, id }: { token: string; kind: string; id: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle")
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  async function go() {
    setState("busy")
    setError(null)
    const res = await fetch("/api/agent/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, kind, id }) }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as { error?: string; url?: string | null } | undefined
    if (!res?.ok) {
      setState("idle")
      setError(data?.error ?? "That didn’t go through. Nothing was published.")
      return
    }
    setUrl(data?.url ?? null)
    setState("done")
  }

  if (state === "done")
    return (
      <p className="font-medium">
        Done. It’s live.{url && <> <a href={url} className="underline" target="_blank" rel="noopener">See it</a></>}
      </p>
    )
  return (
    <>
      <button onClick={go} disabled={state === "busy"} className="w-full rounded-full bg-black text-white py-3.5 text-base font-semibold disabled:opacity-60">
        {state === "busy" ? "I’m publishing it…" : "Approve & publish"}
      </button>
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
    </>
  )
}
