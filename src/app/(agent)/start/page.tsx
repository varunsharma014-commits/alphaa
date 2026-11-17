import { StartAgent } from "@/components/agent/StartAgent"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta({
  title: "Start with your AI marketing agent",
  description:
    "Give Alphaa your website. Your AI marketing agent checks where customers find you, including ChatGPT and Google, then writes your first week of marketing in your voice and your brand colours.",
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
