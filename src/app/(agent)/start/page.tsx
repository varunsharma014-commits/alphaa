import { StartAgent } from "@/components/agent/StartAgent"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta({
  title: "See what AI says about your business",
  description:
    "Alphaa is an AI Agent that gets local businesses recommended by ChatGPT, Gemini, Claude and Perplexity. Give it your website and see what the AIs say today.",
  path: "/start",
})

export default function StartPage() {
  // The conversation renders in the browser, so crawlers saw no heading at all.
  return (
    <>
      <h1 className="sr-only">See what ChatGPT, Gemini, Claude and Perplexity say about your business</h1>
      <StartAgent />
    </>
  )
}
