import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"

interface ConnectGoogleNudgeEmailProps {
  firstName?: string
  businessName: string
  isSecondNudge?: boolean
}

export default function ConnectGoogleNudgeEmail({
  firstName, businessName, isSecondNudge,
}: ConnectGoogleNudgeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>alphaa is ready — one click to switch it on</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>
              {isSecondNudge ? "Quick reminder — " : ""}alphaa is ready{firstName ? `, ${firstName}` : ""} — one click to switch it on.
            </Heading>
            <Text style={paragraph}>
              Your account for <strong>{businessName}</strong> is set up, but autopilot is
              still waiting on one thing: a connection to your Google account. Until
              it&apos;s connected, alphaa can&apos;t post to your Google Business Profile or
              track where you rank.
            </Text>

            <Section style={waitBox}>
              {[
                "Google Business Profile posting — waiting",
                "Google ranking tracking — waiting",
                "Review monitoring — waiting",
              ].map((item) => (
                <Text key={item} style={waitItem}>○ {item}</Text>
              ))}
            </Section>

            <Text style={paragraph}>
              Connecting takes about 30 seconds — one click, sign in with Google, done.
              Everything switches on from there, automatically.
            </Text>

            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations`}>
              Connect Google (30 seconds) →
            </Button>
            <Text style={reassureNote}>
              We use read-only access wherever possible, and you can disconnect anytime from Settings.
            </Text>

            <Hr style={hr} />

            <Text style={smallText}>
              Stuck or have questions? Just reply to this email and we&apos;ll walk you through it.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you have an alphaa account. Manage emails in Settings.
            </Text>
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

ConnectGoogleNudgeEmail.PreviewProps = {
  firstName: "James",
  businessName: "CoolAir Pro",
  isSecondNudge: false,
} satisfies ConnectGoogleNudgeEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#0066cc", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const h1 = { color: "#1d1d1f", fontSize: "24px", fontWeight: "600", margin: "0 0 16px", lineHeight: "1.3" }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const waitBox = { backgroundColor: "#fff5eb", border: "1px solid rgba(0,113,227,0.2)", borderRadius: "12px", padding: "20px 24px", margin: "0 0 24px" }
const waitItem = { color: "#424245", fontSize: "14px", margin: "0 0 8px", lineHeight: "1.5" }
const button = { backgroundColor: "#0071e3", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
const reassureNote = { color: "#86868b", fontSize: "12px", margin: "0 0 24px" }
const hr = { borderColor: "#d2d2d7", margin: "24px 0" }
const smallText = { color: "#6e6e73", fontSize: "13px", lineHeight: "1.6", margin: "0 0 24px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0 0 4px" }
const footerLink = { color: "#86868b", textDecoration: "none" }
