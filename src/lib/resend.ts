import { Resend } from "resend"
import { agentFrom, REPLY_TO } from "@/lib/email-sender"

export const resend = new Resend(process.env.RESEND_API_KEY)

/** Low-level send as "Alphaa AI Agent", replies to hi@alphaa.app. Logs and swallows errors. */
export async function sendEmail({
  to,
  subject,
  react,
  headers,
}: {
  to: string
  subject: string
  react: React.ReactElement
  headers?: Record<string, string>
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: agentFrom(),
      replyTo: REPLY_TO,
      to,
      subject,
      react,
      headers,
    })
    if (error) console.error("Resend error:", error)
    return data
  } catch (err) {
    console.error("Failed to send email:", err)
  }
}
