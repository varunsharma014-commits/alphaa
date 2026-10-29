import {
  Body, Button, Container, Head, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"
import { appUrl, hi, known, orYourBusiness } from "@/emails/copy"

interface PaymentFailureEmailProps {
  firstName?: string | null
  /** The user's business (never their personal name). */
  businessName?: string | null
  amount: string
  /** Formatted date of Stripe's next attempt, or null when Stripe gave none. */
  retryDate?: string | null
  updateUrl: string
}

export default function PaymentFailureEmail({
  firstName, businessName, amount, retryDate, updateUrl,
}: PaymentFailureEmailProps) {
  const base = appUrl()
  const retry = known(retryDate)
  return (
    <Html>
      <Head />
      <Preview>Your subscription payment of {amount} was declined. Please update your payment method.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Section style={alertBanner}>
              <Text style={alertText}>⚠ PAYMENT FAILED</Text>
            </Section>

            <Text style={paragraph}>{hi(firstName)}</Text>
            <Text style={paragraph}>
              Your subscription payment of <strong>{amount}</strong> for <strong>{orYourBusiness(businessName)}</strong> was declined.
            </Text>
            <Text style={paragraph}>
              I am still working, but I will try the charge again {retry ? <>on <strong>{retry}</strong></> : "soon"}.
            </Text>
            <Text style={paragraph}>
              If the next attempt fails, your account will be paused. Please update your payment method to keep your AI visibility tracking active.
            </Text>

            <Button style={button} href={updateUrl}>
              Update payment method →
            </Button>

            <Text style={paragraph}>— Your AI Agent</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${base}/briefing/billing`} style={footerLink}>Billing</Link>
              {" · "}
              <Link href={`${base}/privacy`} style={footerLink}>Privacy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

PaymentFailureEmail.PreviewProps = {
  firstName: "Sarah",
  businessName: "Bright Smile Dental",
  amount: "$99.00",
  retryDate: "May 27, 2026",
  updateUrl: "https://alphaa.app/briefing/billing",
} satisfies PaymentFailureEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#000000", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const alertBanner = { backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "10px 16px", margin: "0 0 24px" }
const alertText = { color: "#d70015", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", margin: "0", textAlign: "center" as const }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "#86868b", textDecoration: "none" }
