import { render } from "@react-email/render"
import { resend } from "@/lib/resend"
import { agentFrom, REPLY_TO } from "@/lib/email-sender"
import type { UnsubLinks } from "@/lib/unsubscribe"

// Sender for marketing email (scan-lead nurture, abandoned checkout, weekly report).
// From "Alphaa AI Agent" <RESEND_FROM_EMAIL>, replies to hi@alphaa.app.
// Every send carries the footer (company + mailing address + unsubscribe) and
// RFC 8058 one-click List-Unsubscribe headers. Without a mailing address we
// legally can't send, so callers check mailingAddress() first and send nothing.

export function mailingAddress(): string | null {
  const a = process.env.COMPANY_MAILING_ADDRESS?.trim()
  return a ? a : null
}

export async function sendMarketingEmail(opts: {
  to: string
  subject: string
  react: React.ReactElement
  unsub: UnsubLinks
}): Promise<{ id: string } | null> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Resend is not configured")
  }
  const [html, text] = await Promise.all([render(opts.react), render(opts.react, { plainText: true })])
  const { data, error } = await resend.emails.send({
    from: agentFrom(),
    to: opts.to,
    replyTo: REPLY_TO,
    subject: opts.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${opts.unsub.oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  })
  if (error) throw new Error(`Resend error: ${error.message}`)
  return data ?? null
}
