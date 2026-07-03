import { Resend } from "resend"
import { render } from "@react-email/render"
import WelcomeEmail from "@/emails/WelcomeEmail"
import WeeklyReportEmail from "@/emails/WeeklyReportEmail"
import AuditResultsEmail from "@/emails/AuditResultsEmail"
import TrialEndingEmail from "@/emails/TrialEndingEmail"
import PaymentFailureEmail from "@/emails/PaymentFailureEmail"
import ReconnectEmail from "@/emails/ReconnectEmail"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "hello@alphaa.app"

async function send(to: string, subject: string, html: string) {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

export async function sendWelcomeEmail(to: string, props: {
  firstName: string
  businessName: string
  trialEndDate: string
}) {
  const html = await render(WelcomeEmail(props))
  await send(to, `Welcome to Alphaa, ${props.firstName} — your AI visibility starts now`, html)
}

export async function sendWeeklyReportEmail(to: string, props: Parameters<typeof WeeklyReportEmail>[0]) {
  const html = await render(WeeklyReportEmail(props))
  await send(to, `Your weekly Alphaa report — ${props.businessName}`, html)
}

export async function sendAuditResultsEmail(to: string, props: Parameters<typeof AuditResultsEmail>[0]) {
  const html = await render(AuditResultsEmail(props))
  const found = props.engines.filter((e) => e.found).length
  await send(to, `${props.businessName}: AI visibility score ${props.overallScore}/100 (${found}/6 engines found you)`, html)
}

export async function sendTrialEndingEmail(to: string, props: Parameters<typeof TrialEndingEmail>[0]) {
  const html = await render(TrialEndingEmail(props))
  const subject = props.daysLeft === 1
    ? `Last day: keep your AI visibility for ${props.businessName}`
    : `${props.daysLeft} days left on your Alphaa trial`
  await send(to, subject, html)
}

export async function sendPaymentFailureEmail(to: string, props: Parameters<typeof PaymentFailureEmail>[0]) {
  const html = await render(PaymentFailureEmail(props))
  await send(to, "Action required: your Alphaa payment failed", html)
}

export async function sendReconnectEmail(to: string, props: Parameters<typeof ReconnectEmail>[0]) {
  const html = await render(ReconnectEmail(props))
  await send(to, "alphaa lost access to your Google account", html)
}
