import {
  Body, Container, Head, Html, Link, Preview, Section, Text,
} from "@react-email/components"

// Plain, text-style marketing email: black on white, no colour accents, one
// link-styled CTA. Used by the scan-lead nurture and abandoned-checkout sends.
// The footer (company + mailing address + unsubscribe) is required: callers
// must not render this without a real address.

export type NurtureBlock =
  | { kind: "p"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "quote"; text: string }

export interface NurtureEmailProps {
  preview: string
  blocks: NurtureBlock[]
  cta: { label: string; href: string }
  /** Optional line after the CTA (e.g. a P.S.). */
  after?: string
  footer: {
    /** Why they're getting this, e.g. "You ran a free AI check at alphaa.app." */
    reason: string
    address: string
    unsubscribeUrl: string
  }
}

export default function NurtureEmail({ preview, blocks, cta, after, footer }: NurtureEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {blocks.map((b, i) => {
            if (b.kind === "bullets") {
              return (
                <Section key={i} style={{ margin: "0 0 16px" }}>
                  {b.items.map((item) => (
                    <Text key={item} style={bullet}>- {item}</Text>
                  ))}
                </Section>
              )
            }
            if (b.kind === "quote") return <Text key={i} style={quote}>{b.text}</Text>
            return <Text key={i} style={paragraph}>{b.text}</Text>
          })}

          <Text style={paragraph}>
            <Link href={cta.href} style={ctaLink}>{cta.label} →</Link>
          </Text>

          <Text style={paragraph}>Alphaa</Text>
          {after && <Text style={small}>{after}</Text>}

          <Section style={footerBox}>
            <Text style={footerText}>{footer.reason}</Text>
            <Text style={footerText}>Alphaa · {footer.address}</Text>
            <Text style={footerText}>
              <Link href={footer.unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

NurtureEmail.PreviewProps = {
  preview: "When I checked Example Dental, 1 of the 4 AIs named you.",
  blocks: [
    { kind: "p", text: "When I checked Example Dental, 1 of the 4 AIs named you." },
    { kind: "bullets", items: ["no FAQ", "no reviews AI can read on your site"] },
  ],
  cta: { label: "See the full comparison", href: "https://alphaa.app/start" },
  footer: { reason: "You ran a free AI check at alphaa.app.", address: "123 Example St, City", unsubscribeUrl: "https://alphaa.app/unsubscribe" },
} satisfies NurtureEmailProps

const body = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { maxWidth: "560px", margin: "0 auto", padding: "24px 20px" }
const paragraph = { color: "#000000", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }
const bullet = { color: "#000000", fontSize: "15px", lineHeight: "1.6", margin: "0 0 4px", paddingLeft: "8px" }
const quote = { color: "#000000", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px", padding: "4px 0 4px 14px", borderLeft: "3px solid #000000" }
const ctaLink = { color: "#000000", fontWeight: "600", textDecoration: "underline" }
const small = { color: "#555555", fontSize: "13px", lineHeight: "1.6", margin: "0 0 16px" }
const footerBox = { borderTop: "1px solid #dddddd", marginTop: "24px", paddingTop: "12px" }
const footerText = { color: "#666666", fontSize: "12px", lineHeight: "1.5", margin: "0 0 4px" }
const footerLink = { color: "#666666", textDecoration: "underline" }
