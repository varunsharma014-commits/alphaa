import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components"

// Sent when the owner (or an admin) invites someone to work on a brand (lib/team/store.ts).
// Transactional: the invitee asked for nothing yet, so it says who invited them and why, once.

export interface TeamInviteEmailProps {
  inviter: string
  brand: string
  role: string
  roleHint: string
  acceptUrl: string
}

export default function TeamInviteEmail({ inviter, brand, role, roleHint, acceptUrl }: TeamInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${inviter} invited you to work on ${brand} in Alphaa.`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>alphaa</Text>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>Hi,</Text>
            <Text style={paragraph}>
              {inviter} invited you to work on <strong>{brand}</strong> in Alphaa as a <strong>{role}</strong>. {roleHint}
            </Text>
            <Text style={paragraph}>Sign in or create a free login with this email address to accept. The link works for 14 days.</Text>
            <Button style={button} href={acceptUrl}>Accept the invite</Button>
            <Text style={small}>Not expecting this? Ignore it and nothing happens.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

TeamInviteEmail.PreviewProps = {
  inviter: "Varun",
  brand: "Bright Smile Dental",
  role: "Reviewer",
  roleHint: "Writes and approves. A publisher puts it live.",
  acceptUrl: "https://alphaa.app/team/accept?t=example",
} satisfies TeamInviteEmailProps

const body = { backgroundColor: "#f5f5f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "24px auto", backgroundColor: "#ffffff", borderRadius: "18px", overflow: "hidden" as const }
const header = { padding: "32px 40px 20px", borderBottom: "1px solid #d2d2d7" }
const logoText = { color: "#111114", fontSize: "20px", fontWeight: "600", margin: "0" }
const content = { padding: "32px 40px 28px" }
const paragraph = { color: "#424245", fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }
const small = { color: "#86868b", fontSize: "13px", lineHeight: "1.5", margin: "8px 0 0" }
const button = { backgroundColor: "#111114", color: "#ffffff", borderRadius: "980px", fontSize: "16px", padding: "14px 28px", textDecoration: "none", display: "inline-block", margin: "0 0 12px" }
