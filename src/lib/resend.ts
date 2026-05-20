import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Alphaa <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      react,
    })
    if (error) console.error("Resend error:", error)
    return data
  } catch (err) {
    console.error("Failed to send email:", err)
  }
}
