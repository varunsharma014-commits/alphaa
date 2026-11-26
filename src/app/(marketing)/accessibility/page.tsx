import { pageMeta } from "@/lib/seo"
import { V3Page, Frame, Section } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/article.css"

export const metadata = pageMeta({
  title: "Accessibility Statement",
  description: "How Alphaa works to make its website and app usable for everyone, what we know still needs work, and how to tell us about a barrier.",
  path: "/accessibility",
})

const sections = [
  {
    title: "Our goal",
    body: `We want alphaa.app and the Alphaa app to be usable by everyone, including people who use screen readers, keyboard navigation, zoom or high-contrast settings. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1, level AA.`,
  },
  {
    title: "Where we are",
    body: `We believe the site is partially conformant with WCAG 2.1 AA, which means some parts may not yet meet the standard. What we do:
• Text and controls are designed to meet AA colour contrast, including the website footer.
• Pages declare their language (for example Arabic pages are marked as Arabic and right-to-left).
• We build pages to work with a keyboard and give meaningful images text alternatives.
• We try not to rely on colour alone to carry meaning.`,
  },
  {
    title: "Known limitations",
    body: `• The full scan report and some dashboard pages are in English only for now.
• Some charts and illustrations in the dashboard may not have full text equivalents yet.
• Content from third parties (for example the Stripe checkout and sign-in screens) follows those providers' own accessibility work.`,
  },
  {
    title: "Tell us about a barrier",
    body: `If something on alphaa.app is hard to use, email hi@alphaa.app with the page address and what happened. We reply within 5 business days and, where we can, provide the information in another format.

Mailing address:
9629033 Canada INC (Alphaa)
1000 Innovation Drive, Suite 500
Kanata, ON K2K 3E7
Canada`,
  },
]

export default function AccessibilityPage() {
  return (
    <V3Page>
      <Frame top>
      <Section flush>
      <div className="rd3">
        <h1 className="v3-h1 v3-h1--md">Accessibility Statement</h1>
        <p className="lgl3-updated" style={{ marginBottom: 32 }}>Last updated: November 15, 2026</p>
        {sections.map((s) => (
          <div key={s.title} className="lgl3-sec">
            <h2>{s.title}</h2>
            <div className="lgl3-body">{s.body}</div>
          </div>
        ))}
      </div>
      </Section>
      </Frame>
    </V3Page>
  )
}
