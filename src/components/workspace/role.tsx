"use client"

// The signed-in person's role on the open brand (lib/team), for hiding or relabelling what the
// role can't do. The server enforces every rule on its own; this is only what the UI shows.
import { createContext, useContext, useEffect } from "react"
import { can, goLiveMode, type Action, type Role } from "@/lib/team/permissions"
import { TOAST_EVENT } from "@/lib/workspace/events"

export const RoleContext = createContext<Role>("owner")
export const useRole = (): Role => useContext(RoleContext)
export const useCan = (action: Action): boolean => can(useContext(RoleContext), action)

/** Labels for the one "go live" button by role: owners and publishers see the usual words. */
export function goLiveLabel(role: Role, usual: string): string {
  const m = goLiveMode(role)
  return m === "approve" ? "Approve for a publisher" : m === "submit" ? "Send for review" : usual
}

/** After a go-live request: the server answers `{ review, message }` when it only marked it. */
export function reviewMessage(d: unknown): string | null {
  const x = d as { review?: string; message?: string } | null
  return x && (x.review === "approved" || x.review === "submitted") ? x.message ?? "Sent on for review." : null
}

let patched = false
/** Team members only: a refused request (401/403 from /api/*) gets a plain sentence, not silence. */
export function useMemberFetchNotice(role: Role) {
  useEffect(() => {
    if (role === "owner" || patched || typeof window === "undefined") return
    patched = true
    const orig = window.fetch.bind(window)
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await orig(...args)
      try {
        const init = args[1]
        const method = (init?.method ?? (args[0] instanceof Request ? args[0].method : "GET")).toUpperCase()
        const raw = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url
        const url = new URL(raw, window.location.href)
        if (method !== "GET" && url.origin === window.location.origin && url.pathname.startsWith("/api/") && (res.status === 401 || res.status === 403)) {
          const body = (await res.clone().json().catch(() => null)) as { error?: string; role?: boolean } | null
          const text = res.status === 403 && body?.role && body.error ? body.error : "Your role on this brand can’t do that. Ask the owner or an admin."
          window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: text }))
        }
      } catch {
        // the notice is a courtesy; never break the request
      }
      return res
    }
  }, [role])
}
