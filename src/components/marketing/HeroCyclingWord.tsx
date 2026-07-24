"use client"

import { useEffect, useState } from "react"

const WORDS = ["ChatGPT", "Gemini", "Claude", "Perplexity"]

export function HeroCyclingWord() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      key={WORDS[index]}
      className="inline-block serif-italic text-brand-orange animate-fade-up"
    >
      {WORDS[index]}.
    </span>
  )
}
