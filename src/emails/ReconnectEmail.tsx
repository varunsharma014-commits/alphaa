import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"

interface ReconnectEmailProps {
  firstName?: string
  businessName: string
}

export default function ReconnectEmail({
  firstName, businessName,
}: ReconnectEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>alphaa lost access to your Google account — reconnect in 30 seconds to keep autopilot running</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Section style={urgencyBanner}>
              <Text style={urgencyText}>⚠ AUTOPILOT PAUSED — ACTION NEEDED</Text>
            </Section>

            <Heading style={h1}>alphaa lost access to your Google account{firstName ? `, ${firstName}` : ""}.</Heading>
            <Text style={paragraph}>
              Google disconnected us from <strong>{businessName}</strong> — this usually happens
              when you change your Google password or security settings. Nothing is broken on
              your end, but until you reconnect, autopilot is paused:
            </Text>

            <Section style={pauseBox}>
              {[
                "Google Business Profile posting — paused",
                "Google ranking tracking — paused",
                "New review monitoring — paused",
              ].map((item) => (
                <Text key={item} style={pauseItem}>⏸ {item}</Text>
              ))}
            </Section>

            <Text style={paragraph}>
              Reconnecting takes about 30 seconds — one click, sign in with Google, done.
              Everything picks up right where it left off.
            </Text>

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations`}>
              Reconnect Google →
            </Button>
            <Text style={reassureNote}>Your data and settings are safe. Nothing was lost.</Text>

            <Hr style={hr} />

            <Text style={smallText}>
              Stuck? Just reply to this email and we&apos;ll walk you through it.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`} style={footerLink}>Manage preferences</Link>
              {" · "}
              <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>Privacy</Link>
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
const logoText = { color: "#0066cc", fontSize: "22px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const urgencyBanner = { backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", padding: "10px 16px", margin: "0 0 24px" }
const urgencyText = { color: "#b64400", fontSize: "13.2px", fontWeight: "600", letterSpacing: "1px", margin: "0", textAlign: "center" as const }
const h1 = { color: "#1d1d1f", fontSize: "26.4px", fontWeight: "600", margin: "0 0 16px", lineHeight: "1.3" }
const paragraph = { color: "#424245", fontSize: "16.5px", lineHeight: "1.6", margin: "0 0 20px" }
const pauseBox = { backgroundColor: "#fff5eb", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const pauseItem = { color: "#424245", fontSize: "15.4px", margin: "0 0 8px", lineHeight: "1.5" }
const button = { backgroundColor: "#0071e3", color: "#ffffff", borderRadius: "980px", fontSize: "17.6px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const reassureNote = { color: "#86868b", fontSize: "13.2px", margin: "0 0 24px" }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const smallText = { color: "#6e6e73", fontSize: "14.3px", lineHeight: "1.6", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "13.2px", textAlign: "center" as const, margin: "0" }
const footerLink = { color: "#86868b", textDecoration: "none" }
