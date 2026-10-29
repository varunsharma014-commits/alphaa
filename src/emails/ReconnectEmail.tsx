import {
  Body, Button, Container, Head, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"
import { appUrl, hi, orYourBusiness } from "@/emails/copy"

interface ReconnectEmailProps {
  firstName?: string | null
  businessName?: string | null
}

export default function ReconnectEmail({
  firstName, businessName,
}: ReconnectEmailProps) {
  const base = appUrl()
  return (
    <Html>
      <Head />
      <Preview>Reconnecting takes 30 seconds, and I will pick up right where I left off.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Section style={urgencyBanner}>
              <Text style={urgencyText}>⚠ AUTOPILOT PAUSED — ACTION NEEDED</Text>
            </Section>

            <Text style={paragraph}>{hi(firstName)}</Text>
            <Text style={paragraph}>
              Google disconnected me from <strong>{orYourBusiness(businessName)}</strong>. This usually happens when a password or security setting changes.
            </Text>
            <Text style={paragraph}>
              My autopilot is paused. I cannot publish posts, track rankings, or monitor reviews until you reconnect.
            </Text>
            <Text style={paragraph}>
              Reconnecting takes 30 seconds, and I will pick up right where I left off.
            </Text>

            <Button style={button} href={`${base}/briefing/connections`}>
              Reconnect Google →
            </Button>

            <Text style={paragraph}>— Your AI Agent</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${base}/briefing/preferences`} style={footerLink}>Agent preferences</Link>
              {" · "}
              <Link href={`${base}/privacy`} style={footerLink}>Privacy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

ReconnectEmail.PreviewProps = {
  firstName: "James",
  businessName: "CoolAir Pro",
} satisfies ReconnectEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#000000", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const urgencyBanner = { backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "10px 16px", margin: "0 0 24px" }
const urgencyText = { color: "#b64400", fontSize: "12px", fontWeight: "600", letterSpacing: "1px", margin: "0", textAlign: "center" as const }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 20px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "#86868b", textDecoration: "none" }
