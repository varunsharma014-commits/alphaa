import { ScanForm } from "@/components/scan/ScanForm"
import { V3Page, Frame, Section } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/scan.css"
import { Bot } from "lucide-react"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta({
  title: "Free AI Visibility Scan | Alphaa AI marketing agent",
  description: "See what ChatGPT, Gemini, Claude and Perplexity say about your business, and who they name instead of you. Free, in about 60 seconds. Then let Alphaa's AI agent run your marketing.",
  path: "/scan",
})

export default function ScanPage() {
  return (
    <V3Page>
      <Frame top>
        <Section flush>
          <div className="sc3">
            <div className="v3-center">
              <p className="v3-kicker">Free scan</p>
              <h1 className="v3-h1 v3-h1--md">
                See your free{" "}
                <span className="v3-blue">visibility score</span>
              </h1>
              <p className="v3-lede">
                We check Google, ChatGPT, Maps, and your website, and show you exactly what's stopping customers from finding you. Takes 2 minutes. Then your AI agent can run your marketing and fix it.
              </p>
            </div>

            {/* What the scan checks — honest, no invented numbers */}
            <div className="sc3-checks">
              <Bot />
              <p>
                Live check across <b>ChatGPT, Claude, Gemini &amp; Perplexity</b> plus your website
              </p>
            </div>

            <ScanForm />
            <p className="sc3-fine">
              No credit card · Results emailed to you
            </p>
          </div>
        </Section>
      </Frame>
    </V3Page>
  )
}
