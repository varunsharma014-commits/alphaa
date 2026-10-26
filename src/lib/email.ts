import { Resend } from "resend"
import { render } from "@react-email/render"
import WelcomeEmail from "@/emails/WelcomeEmail"
import WeeklyReportEmail from "@/emails/WeeklyReportEmail"
import AuditResultsEmail from "@/emails/AuditResultsEmail"
import TrialEndingEmail from "@/emails/TrialEndingEmail"
import PaymentFailureEmail from "@/emails/PaymentFailureEmail"
import ReconnectEmail from "@/emails/ReconnectEmail"
import ConnectGoogleNudgeEmail from "@/emails/ConnectGoogleNudgeEmail"
import WeekOneRecapEmail from "@/emails/WeekOneRecapEmail"
import WinEmail from "@/emails/WinEmail"
import { agentFrom, REPLY_TO } from "@/lib/email-sender"
import { orYou } from "@/emails/copy"

const resend = new Resend(process.env.RESEND_API_KEY)

async function send(to: string, subject: string, react: React.ReactElement) {
  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })])
  const { error } = await resend.emails.send({ from: agentFrom(), replyTo: REPLY_TO, to, subject, html, text })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

// Subjects live next to the send so the template file and the subject line
// never drift. Templates own the fallbacks for the body copy (emails/copy.ts).

export const subjects = {
  welcome: (p: { businessName?: string | null }) => `I am ready to work for ${orYou(p.businessName)}.`,
  weeklyReport: (p: { businessName?: string | null }) =>
    p.businessName?.trim() ? `Your weekly report for ${p.businessName.trim()}.` : "Your weekly report.",
  auditResults: (p: { overallScore: number }) => `Your AI visibility score is ${p.overallScore}/100.`,
  paymentFailure: () => "Action required: Your payment failed.",
  reconnect: () => "I lost access to your Google account.",
  connectNudge: (p: { isSecondNudge?: boolean }) =>
    p.isSecondNudge ? "Reminder: I am still paused." : "I am paused. Please connect your Google account.",
  weekOneRecap: () => "Your first week on autopilot.",
  win: (p: { engine?: string | null; businessName?: string | null; scoreRise?: { from: number; to: number } | null }) =>
    p.engine
      ? `🎉 ${p.engine} just recommended ${orYou(p.businessName)}.`
      : p.scoreRise
        ? `🎉 Your AI visibility score rose from ${p.scoreRise.from} to ${p.scoreRise.to}.`
        : "🎉 New win on your latest visibility scan.",
}

export async function sendWelcomeEmail(to: string, props: Parameters<typeof WelcomeEmail>[0]) {
  await send(to, subjects.welcome(props), WelcomeEmail(props))
}

export async function sendWeeklyReportEmail(to: string, props: Parameters<typeof WeeklyReportEmail>[0]) {
  await send(to, subjects.weeklyReport(props), WeeklyReportEmail(props))
}

export async function sendAuditResultsEmail(to: string, props: Parameters<typeof AuditResultsEmail>[0]) {
  await send(to, subjects.auditResults(props), AuditResultsEmail(props))
}

/** Dead: no caller since trials ended (2026-09). Left as it was on purpose. */
export async function sendTrialEndingEmail(to: string, props: Parameters<typeof TrialEndingEmail>[0]) {
  const subject = props.daysLeft === 1
    ? `Last day: keep your AI visibility for ${props.businessName}`
    : `${props.daysLeft} days left on your Alphaa trial`
  await send(to, subject, TrialEndingEmail(props))
}

export async function sendPaymentFailureEmail(to: string, props: Parameters<typeof PaymentFailureEmail>[0]) {
  await send(to, subjects.paymentFailure(), PaymentFailureEmail(props))
}

export async function sendReconnectEmail(to: string, props: Parameters<typeof ReconnectEmail>[0]) {
  await send(to, subjects.reconnect(), ReconnectEmail(props))
}

export async function sendConnectGoogleNudgeEmail(to: string, props: Parameters<typeof ConnectGoogleNudgeEmail>[0]) {
  await send(to, subjects.connectNudge(props), ConnectGoogleNudgeEmail(props))
}

export async function sendWeekOneRecapEmail(to: string, props: Parameters<typeof WeekOneRecapEmail>[0]) {
  await send(to, subjects.weekOneRecap(), WeekOneRecapEmail(props))
}

export async function sendWinEmail(to: string, props: Parameters<typeof WinEmail>[0]) {
  await send(to, subjects.win(props), WinEmail(props))
}
