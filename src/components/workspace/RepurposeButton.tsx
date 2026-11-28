"use client"

import { useState } from "react"
import type { Message } from "@/lib/agent/types"
import { askAlphaa, toast } from "@/lib/workspace/events"

// "Repurpose": one finished blog post → a social post, a LinkedIn post, a Google listing update,
// the customer email and a short video script, each a draft in its usual queue
// (POST /api/agent/repurpose → lib/repurpose.ts). The result opens in the chat panel.
export function RepurposeButton({ draftId, done = false, small = true, label }: { draftId: string; done?: boolean; small?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [made, setMade] = useState(done)
  async function go() {
    setBusy(true)
    const res = await fetch("/api/agent/repurpose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; messages?: Message[]; result?: { items: { status: string }[] } } | null
    setBusy(false)
    if (!res?.ok || !d?.messages) return toast(d?.error ?? "That didn’t go through. Try again in a minute.")
    const n = d.result?.items.filter((i) => i.status === "made").length ?? 0
    setMade(true)
    toast(n ? `Made ${n} drafts from this post. They wait for your OK.` : "I couldn’t make drafts from it just now.")
    askAlphaa({ push: d.messages })
  }
  return (
    <button className={`ax-btn s${small ? " sm" : ""}`} type="button" disabled={busy} onClick={() => void go()} title="Turn it into a social post, a LinkedIn post, a Google update, an email and a video script">
      {busy ? "Repurposing…" : label ?? (made ? "See repurposed drafts" : "Repurpose")}
    </button>
  )
}
