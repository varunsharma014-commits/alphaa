// The customer email itself (HTML + text). No db imports, so scripts and previews can use it.
import { esc, shell } from "@/lib/connector/mail"
import type { Campaign } from "./store"

export type Sender = { biz: string; signOff: string; replyTo: string; address: string; city?: string | null }

export function render(c: Pick<Campaign, "subject" | "preview" | "paragraphs" | "cta">, s: Sender, to: { n?: string }, unsubUrl: string) {
  const first = to.n?.split(/\s+/)[0]
  const hi = first ? `Hi ${first},` : "Hi there,"
  const sign = s.signOff.split("\n")
  const inner = `<div style="display:none;max-height:0;overflow:hidden">${esc(c.preview)}</div>
<p style="margin:0 0 16px">${esc(hi)}</p>
${c.paragraphs.map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`).join("\n")}
${c.cta ? `<p style="margin:24px 0"><a href="${esc(c.cta.url)}" style="display:inline-block;background:#000000;color:#fff;text-decoration:none;border-radius:980px;padding:12px 24px;font-size:16px">${esc(c.cta.label)}</a></p>` : ""}
<p style="margin:0">${sign.map(esc).join("<br>")}</p>`
  const footer = `You’re getting this because you’re a customer of ${esc(s.biz)}${s.city?.trim() ? ` in ${esc(s.city.trim())}` : ""}. Reply to reach them directly.<br>${esc(s.biz)}, ${esc(s.address)}. <a href="${esc(unsubUrl)}" style="color:#6e6e73">Unsubscribe</a>`
  const text = `${hi}\n\n${c.paragraphs.join("\n\n")}\n\n${c.cta ? `${c.cta.label}: ${c.cta.url}\n\n` : ""}${s.signOff}\n\n--\nYou’re getting this because you’re a customer of ${s.biz}.\n${s.biz}, ${s.address}\nUnsubscribe: ${unsubUrl}`
  return { html: shell(inner, footer), text }
}

