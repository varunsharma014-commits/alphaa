// How a Repurpose run reads in the chat (lib/repurpose.ts): one message with what was made and
// where each draft waits, the video script as a doc, and links to the queues.
import { agent, type Chip, type Message } from "@/lib/agent/types"
import type { RepurposeResult } from "@/lib/repurpose"

const NAME: Record<string, string> = { social: "Social post", linkedin: "LinkedIn post", gbp: "Google listing update", email: "Email", video: "Short video script" }
const HREF: Record<string, string> = { social: "/dashboard/social", linkedin: "/dashboard/social", gbp: "/dashboard/posts", email: "/dashboard/email" }

export function repurposeMessages(r: RepurposeResult): Message[] {
  const made = r.items.filter((i) => i.status === "made")
  const lines = r.items.map((i) => (i.status === "made" ? `${NAME[i.kind]}${i.kind === "social" || i.kind === "email" ? `: “${i.title}”` : ""} → ${i.where}` : `${NAME[i.kind]}: ${i.note ?? "not made"}`))
  const chips: Chip[] = []
  for (const k of ["social", "gbp", "email"] as const) if (made.some((i) => i.kind === k || (k === "social" && i.kind === "linkedin"))) chips.push({ label: k === "social" ? "Open Social Studio" : k === "gbp" ? "Open Google posts" : "Open the email", action: { type: "link", href: HREF[k] }, primary: k === "social" })
  const out: Message[] = [agent([
    { kind: "text", text: made.length ? `I turned “${r.postTitle}” into ${made.length} ${made.length === 1 ? "draft" : "drafts"}. Nothing goes out until you approve it.` : `I couldn’t make drafts from “${r.postTitle}” just now.`, big: true },
    { kind: "receipt", title: "Made from your post", sub: r.url ?? undefined, items: lines },
    ...(chips.length ? [{ kind: "chips" as const, items: chips }] : []),
  ], `rp-${r.draftId}`)]
  const video = r.items.find((i) => i.kind === "video" && i.status === "made" && i.text)
  if (video) out.push(agent([{ kind: "doc", title: "Short video script (30-45 seconds)", meta: "film it on your phone", text: video.text }, { kind: "chips", items: [{ label: "Copy the script", action: { type: "copy", text: video.text!, done: "Copied. Paste it into your notes app." } }] }], `rp-video-${r.draftId}`))
  return out
}
