import { StartAgent } from "@/components/agent/StartAgent"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta({
  title: "Free AI check: what 4 AIs say about your business",
  description:
    "Enter your website. In about 60 seconds your AI marketing agent shows what ChatGPT, Gemini, Claude and Perplexity say about your business and who they name instead. Free, no card. Plans from $99/month.",
  path: "/start",
})

export default function StartPage() {
  // The conversation renders in the browser, so crawlers saw no heading at all.
  return (
    <>
      <h1 className="sr-only">Start with your AI marketing agent: give it your website and get your first week of marketing</h1>
      <StartAgent />
    </>
  )
}
