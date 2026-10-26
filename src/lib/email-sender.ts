import { SUPPORT_EMAIL } from "@/lib/constants"

// One place for who our email comes from. Every user/lead-facing email is sent
// as "Alphaa AI Agent" with replies to hi@alphaa.app. Connector emails sent on
// an owner's behalf keep their own display name (e.g. "Bright Smile via
// Alphaa") but share the same address. Never renders "<undefined>": a missing
// RESEND_FROM_EMAIL falls back to the support address.

export const AGENT_SENDER_NAME = "Alphaa AI Agent"

export function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || SUPPORT_EMAIL
}

/** `"Name" <address>`, with characters that would break the header stripped from the name. */
export function fromAs(name: string): string {
  const clean = name.replace(/[<>"\r\n]/g, "").trim() || AGENT_SENDER_NAME
  return `${clean} <${fromAddress()}>`
}

/** "Alphaa AI Agent <RESEND_FROM_EMAIL>" */
export function agentFrom(): string {
  return fromAs(AGENT_SENDER_NAME)
}

export const REPLY_TO = SUPPORT_EMAIL
