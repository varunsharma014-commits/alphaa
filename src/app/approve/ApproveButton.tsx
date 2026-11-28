"use client"

import { useState } from "react"
import { BannedWordConfirm } from "@/components/workspace/BannedWordConfirm"

export function ApproveButton({ token, kind, id, label = "Approve & publish", busyLabel = "I’m publishing it…" }: { token: string; kind: string; id: string; label?: string; busyLabel?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle")
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  async function go() {
    setState("busy")
    setError(null)
    const res = await fetch("/api/agent/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token, kind, id }) }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as { error?: string; url?: string | null; review?: string; message?: string } | undefined
    if (!res?.ok) {
      setState("idle")
      setError(data?.error ?? "That didn’t go through. Nothing was published.")
      return
    }
    setUrl(data?.url ?? null)
    setNote(data?.review ? data.message ?? "Done." : null)
    setState("done")
  }

  if (state === "done" && note) return <p className="font-medium">{note}</p>
  if (state === "done")
    return (
      <p className="font-medium">
        Done. It’s live.{url && <> <a href={url} className="underline" target="_blank" rel="noopener">See it</a></>}
      </p>
    )
  return (
    <>
      <BannedWordConfirm />
      <button onClick={go} disabled={state === "busy"} className="w-full rounded-full bg-black text-white py-3.5 text-base font-semibold disabled:opacity-60">
        {state === "busy" ? busyLabel : label}
      </button>
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
    </>
  )
}
