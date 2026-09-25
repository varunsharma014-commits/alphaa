// The agent UI speaks in messages made of typed blocks. Both the public
// /start conversation and the signed-in dashboard feed render this same
// shape, so the two surfaces look and behave identically by construction.

export type EngineKey = "chatgpt" | "claude" | "gemini" | "perplexity"

export const ENGINE_LABEL: Record<EngineKey, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
}

export type VerdictState = "found" | "partial" | "missing" | "unknown"

export type ChipAction =
  | { type: "link"; href: string }
  | { type: "say"; text: string } // canned agent reply, no network
  | { type: "ask"; text: string } // send to the chat endpoint as the user
  | { type: "live"; question: string } // ask the four AIs right now
  | { type: "review-draft"; reviewId: string }
  | { type: "review-post"; reviewId: string; text: string; docId?: string }
  | { type: "post-publish"; postId: string }
  | { type: "post-delete"; postId: string }
  | { type: "dismiss" }
  | { type: "copy"; text: string; done?: string } // copy to clipboard, confirm in-thread
  | { type: "draft"; topic: string; competitor?: string; mode?: "faq" | "reply"; url?: string } // agent writes an FAQ draft, or a reply for a discussion AI cites
  | { type: "run"; task: "site-check" | "citations" | "schema" } // agent runs a job right now
  | { type: "wp-connect" } // show the steps + key to connect a WordPress site
  | { type: "wp-push"; op: SiteOp; title?: string; text?: string; docId?: string } // publish an approved change to the connected site
  | { type: "wp-undo"; changeId: string }
  | { type: "handoff"; what: SiteOp; title?: string; text?: string; docId?: string } // email it to the owner's web person
  | { type: "setting"; key: "bingPlacesDone" | "appleConnectDone"; value: boolean; done: string }
  | { type: "review-ask" } // open the "ask a customer for a review" form

export type SiteOp = "page" | "schema" | "llms" | "robots"

export type FormField = {
  name: string
  label: string
  type: "text" | "email" | "tel" | "url" | "checkbox"
  placeholder?: string
  value?: string
  required?: boolean
}

export type Chip = { label: string; action: ChipAction; primary?: boolean }

export type Block =
  | { kind: "text"; text: string; big?: boolean }
  | { kind: "steps"; items: string[]; done?: number } // done = how many are finished; the next one spins
  | { kind: "verdicts"; items: { engine: EngineKey; state: VerdictState; note?: string }[] }
  | {
      kind: "answer"
      engine: EngineKey
      query: string
      answer: string
      appeared: boolean
      mentioned: string[]
      businessName: string
      sources?: string[]
    }
  | { kind: "sources"; title?: string; items: { name: string; detail?: string; status: string; ok: boolean; href?: string }[] }
  | { kind: "stat"; value: string; label: string }
  | { kind: "doc"; title: string; meta?: string; text?: string; html?: string; docId?: string; editable?: boolean }
  | { kind: "diff"; beforeLabel: string; afterLabel: string; before: string[]; after: string[]; highlight?: string }
  | { kind: "receipt"; title: string; sub?: string; items: string[] }
  | { kind: "chips"; items: Chip[] }
  | { kind: "divider"; text: string }
  | { kind: "email"; label: string; placeholder: string; cta: string; fine: string }
  | { kind: "form"; formId: string; fields: FormField[]; cta: string; fine?: string }

export type Message = {
  id: string
  role: "agent" | "user"
  blocks: Block[]
}

let counter = 0
export function mid(prefix = "m"): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}

export const agent = (blocks: Block[], id?: string): Message => ({ id: id ?? mid("a"), role: "agent", blocks })
export const user = (text: string, id?: string): Message => ({ id: id ?? mid("u"), role: "user", blocks: [{ kind: "text", text }] })
