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
  | { type: "draft"; topic: string; competitor?: string; mode?: "faq" | "reply" | "post" | "meta" | "location" | "outreach"; url?: string; locationId?: string; kind?: string } // agent writes something: FAQ, discussion reply, blog post, page title, location page, outreach
  | { type: "run"; task: Task } // agent runs a job right now
  | { type: "wp-connect"; direct?: boolean } // connect a website; direct = skip the platform choice and go to WordPress
  | { type: "wp-push"; op: SiteOp; title?: string; text?: string; docId?: string; url?: string; locationId?: string; draftId?: string } // publish an approved change to the connected site
  | { type: "wp-undo"; changeId: string }
  | { type: "handoff"; what: SiteOp; title?: string; text?: string; docId?: string; url?: string; locationId?: string; draftId?: string } // email it to the owner's web person
  | { type: "setting"; key: "bingPlacesDone" | "appleConnectDone" | "autoPublishPosts"; value: boolean; done: string }
  | { type: "connect"; platform: "wordpress" | "webflow" | "shopify" | "wix" } // start connecting that kind of site
  | { type: "review-ask" } // open the "ask a customer for a review" form
  | { type: "profile-add" } // form: a profile URL the owner has
  | { type: "location-add" } // form: another location
  | { type: "bing-connect" } // form: Bing Webmaster API key
  | { type: "questions-edit" } // form: the tracked customer questions
  | { type: "questions-run" } // ask all tracked questions now

export type SiteOp = "page" | "schema" | "llms" | "robots" | "post" | "meta" | "sitemap" | "headers"
export type Task = "site-check" | "citations" | "schema" | "security" | "profiles" | "listings" | "bing"

export type FormField = {
  name: string
  label: string
  type: "text" | "email" | "tel" | "url" | "checkbox" | "textarea"
  placeholder?: string
  value?: string
  required?: boolean
}

export type Chip = { label: string; action: ChipAction; primary?: boolean }

export type Block =
  | { kind: "text"; text: string; big?: boolean }
  | { kind: "steps"; items: string[]; done?: number; ticker?: string[][] } // done = how many are finished; the next one spins. ticker[i] = live status lines cycled under step i while it runs
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
  | { kind: "sources"; title?: string; collapseOk?: boolean; limit?: number; items: { name: string; detail?: string; status: string; ok: boolean; href?: string }[] } // collapseOk: fold passing rows behind "N already right"
  | { kind: "stat"; value: string; label: string }
  | { kind: "doc"; title: string; meta?: string; text?: string; html?: string; docId?: string; editable?: boolean; markdown?: boolean; image?: string } // markdown: show text formatted, edit as text
  | { kind: "diff"; beforeLabel: string; afterLabel: string; before: string[]; after: string[]; highlight?: string }
  | { kind: "receipt"; title: string; sub?: string; items: string[] }
  | { kind: "chips"; items: Chip[] }
  | { kind: "cta"; chip: Chip; sub?: string } // the one big button a message ends on
  | { kind: "divider"; text: string }
  | { kind: "email"; label: string; placeholder: string; cta: string; fine: string }
  | { kind: "form"; formId: string; fields: FormField[]; cta: string; fine?: string }
  | { kind: "platforms"; items: { platform: import("@/lib/connector/types").Platform; available: boolean }[] } // "connect your website" picker with logos; unavailable = Coming soon

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
