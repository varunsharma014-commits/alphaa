import type { Metadata } from "next"
import { StartAgent } from "@/components/agent/StartAgent"

export const metadata: Metadata = {
  title: "See what AI says about your business",
  description:
    "Alphaa is an AI agent that gets local businesses recommended by ChatGPT, Gemini, Claude and Perplexity. Give it your website — it shows you what the AIs say today and starts fixing it.",
  alternates: { canonical: "https://alphaa.app/start" },
}

export default function StartPage() {
  return <StartAgent />
}
