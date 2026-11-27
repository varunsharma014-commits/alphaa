import { StartAgent } from "@/components/agent/StartAgent"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta({
  title: "Free AI check + your first week of marketing",
  description:
    "Enter your website. Your AI marketing agent shows what ChatGPT, Gemini, Claude and Perplexity say about you, reads your brand and competitors, and writes your first week of posts. Free, no card.",
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
