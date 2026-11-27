// Window events between the workspace pages, the shell and the agent chat (client-safe).
//
//   WS_EVENT     anything on a page → the shell: open the chat panel, then pass `detail` on.
//   AGENT_EVENT  the shell → DashboardAgent (mounted inside the chat panel): run a chip, send a
//                message as the owner, or push messages. Topics go through the existing ASK_EVENT.
import type { Chip, Message } from "@/lib/agent/types"

/** Pull a topic thread into the chat (handled by DashboardAgent). */
export const ASK_EVENT = "alphaa:ask"
export type AskDetail = { topic: string; label: string }

export const WS_EVENT = "alphaa:ws"
export const AGENT_EVENT = "alphaa:agent"
export const TOAST_EVENT = "alphaa:toast"

export type AgentEventDetail = { chip?: Chip; say?: string; push?: Message[] }
export type WsDetail = AgentEventDetail & { topic?: string; label?: string }

/** Open the chat and do one thing there (pull a thread, run a chip, or say something). */
export function askAlphaa(detail: WsDetail = {}) {
  window.dispatchEvent(new CustomEvent<WsDetail>(WS_EVENT, { detail }))
}

export function toast(text: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: text }))
}

/** Shown in the chat panel and under "Going out soon". */
export const AI_NOTE = "Alphaa is AI and can make mistakes. Check anything important before it goes out."

/** A page sets the status island text while it is open (null = back to the default). */
export const ISLAND_EVENT = "alphaa:island"
