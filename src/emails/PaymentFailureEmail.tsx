import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"

interface PaymentFailureEmailProps {
  firstName: string
  businessName: string
  amount: string
  retryDate: string
  updateUrl: string
}

export default function PaymentFailureEmail({
  firstName, businessName, amount, retryDate, updateUrl,
}: PaymentFailureEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action required: payment failed for your Alphaa subscription</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Section style={alertBanner}>
              <Text style={alertText}>⚠ PAYMENT FAILED</Text>
            </Section>

            <Heading style={h1}>We couldn't process your payment, {firstName}.</Heading>
            <Text style={paragraph}>
              Your subscription payment of <strong>{amount}</strong> for <strong>{businessName}</strong> was declined. Your AI visibility service is still active, but we'll retry on <strong>{retryDate}</strong>.
            </Text>

            <Text style={paragraph}>
              If the retry fails, your account will be paused and your AI citation profile will stop updating. Please update your payment method now to avoid any interruption.
            </Text>

            <Button style={button} href={updateUrl}>
              Update payment method →
            </Button>

            <Hr style={hr} />

            <Text style={sectionLabel}>COMMON REASONS FOR FAILURE</Text>
            {[
              "Card expired — update your card number and expiry date",
              "Insufficient funds — ensure your account has sufficient balance",
              "Bank blocked the charge — contact your bank to authorize recurring charges from Alphaa",
              "Card details changed — update your billing information",
            ].map((item) => (
              <Text key={item} style={reasonItem}>• {item}</Text>
            ))}

            <Hr style={hr} />

            <Text style={smallText}>
              Need help? Reply to this email or contact us at{" "}
              <Link href="mailto:support@alphaa.app" style={link}>support@alphaa.app</Link>. We're happy to assist.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`} style={footerLink}>Billing settings</Link>
              {" · "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>Privacy</Link>
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
  updateUrl: "https://alphaa.app/dashboard/settings/billing",
} satisfies PaymentFailureEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#0066cc", fontSize: "22px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const alertBanner = { backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "10px 16px", margin: "0 0 24px" }
const alertText = { color: "#d70015", fontSize: "13.2px", fontWeight: "600", letterSpacing: "1px", margin: "0", textAlign: "center" as const }
const h1 = { color: "#1d1d1f", fontSize: "26.4px", fontWeight: "600", margin: "0 0 16px", lineHeight: "1.3" }
const paragraph = { color: "#424245", fontSize: "16.5px", lineHeight: "1.6", margin: "0 0 20px" }
const button = { backgroundColor: "#0071e3", color: "#ffffff", borderRadius: "980px", fontSize: "17.6px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 24px" }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const sectionLabel = { color: "#86868b", fontSize: "11px", fontWeight: "600", letterSpacing: "2px", margin: "0 0 12px" }
const reasonItem = { color: "#424245", fontSize: "15.4px", margin: "0 0 8px", lineHeight: "1.5" }
const smallText = { color: "#6e6e73", fontSize: "14.3px", lineHeight: "1.6", margin: "0 0 24px" }
const link = { color: "#0066cc", textDecoration: "none" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "13.2px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "#86868b", textDecoration: "none" }
