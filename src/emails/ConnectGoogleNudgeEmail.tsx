import {
  Body, Button, Container, Head, Html,
  Preview, Section, Text, Link,
} from "@react-email/components"
import { appUrl, hi, orYourBusiness } from "@/emails/copy"

interface ConnectGoogleNudgeEmailProps {
  firstName?: string | null
  businessName?: string | null
  isSecondNudge?: boolean
}

export default function ConnectGoogleNudgeEmail({
  firstName, businessName, isSecondNudge,
}: ConnectGoogleNudgeEmailProps) {
  const base = appUrl()
  const connectUrl = `${base}/dashboard/settings/integrations`
  return (
    <Html>
      <Head />
      <Preview>
        {isSecondNudge
          ? "I am still waiting on a connection to your Google account."
          : "Connecting takes about 30 seconds. You sign in with Google once, and I handle the rest."}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>✦ alphaa</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>{hi(firstName)}</Text>

            {isSecondNudge ? (
              <>
                <Text style={paragraph}>
                  A quick reminder that I am still waiting on a connection to your Google account.
                </Text>
                <Text style={paragraph}>
                  I cannot publish updates or track your visibility until this is connected. It takes 30 seconds, and you can disconnect at any time.
                </Text>
                <Button style={button} href={connectUrl}>Connect Google (30 seconds) →</Button>
              </>
            ) : (
              <>
                <Text style={paragraph}>
                  I am set up for {orYourBusiness(businessName)}, but my autopilot is paused.
                </Text>
                <Text style={paragraph}>
                  Until I am connected to your Google account, I cannot publish updates to your Business Profile, check your reviews, or track your visibility.
                </Text>
                <Text style={paragraph}>
                  Connecting takes about 30 seconds. You sign in with Google once, and I handle the rest.
                </Text>
                <Button style={button} href={connectUrl}>Connect Google (30 seconds) →</Button>
                <Text style={reassureNote}>
                  I use read-only access wherever possible, and you can disconnect anytime in Settings.
                </Text>
              </>
            )}

            <Text style={paragraph}>— Your AI Agent</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you have an alphaa account. Manage emails in Settings.
            </Text>
            <Text style={footerText}>
              <Link href={`${base}/dashboard/settings`} style={footerLink}>Manage preferences</Link>
              {" · "}
              <Link href={`${base}/privacy`} style={footerLink}>Privacy</Link>
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
const logoText = { color: "#000000", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 0" }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const button = { backgroundColor: "#000000", color: "#ffffff", borderRadius: "980px", fontSize: "16px", fontWeight: "400", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 16px" }
const reassureNote = { color: "#86868b", fontSize: "12px", margin: "0 0 20px" }
const footer = { padding: "20px 40px", borderTop: "1px solid #d2d2d7" }
const footerText = { color: "#86868b", fontSize: "12px", textAlign: "center" as const, margin: "0 0 4px" }
const footerLink = { color: "#86868b", textDecoration: "none" }
