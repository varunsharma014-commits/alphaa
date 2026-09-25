import { Resend } from "resend"

// Plain, Apple-light emails the agent sends on the owner's behalf. Replies go
// to the owner, never to us.
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDR = process.env.RESEND_FROM_EMAIL ?? "hello@alphaa.app"

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export function shell(inner: string, footer: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif;color:#1d1d1f">
<div style="max-width:600px;margin:0 auto;padding:32px 16px">
<div style="background:#fff;border-radius:18px;padding:32px 28px;font-size:16px;line-height:1.5">${inner}</div>
<p style="font-size:12px;color:#6e6e73;text-align:center;margin:20px 8px 0">${footer}</p>
</div></body></html>`
}

export const codeBox = (code: string) =>
  `<pre style="background:#f5f5f7;border-radius:12px;padding:16px;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word;margin:12px 0 20px">${esc(code)}</pre>`

export async function sendAs(opts: { fromName: string; to: string; replyTo?: string | null; subject: string; html: string; text: string }) {
  const { error } = await resend.emails.send({
    from: `${opts.fromName.replace(/[<>"]/g, "")} <${FROM_ADDR}>`,
    to: opts.to,
    replyTo: opts.replyTo ?? undefined,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })
  if (error) throw new Error(error.message)
}
