import Anthropic from "@anthropic-ai/sdk"
import { installPauseGuard } from "./ai-paused"
import OpenAI from "openai"
import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai"

export type EngineResult = {
  engine: "chatgpt" | "claude" | "gemini" | "perplexity"
  status: "appeared" | "not_appearing" | "not_configured" | "error"
  appeared: boolean
  position: number | null
  snippet: string | null
  query: string
  response: string
}

export type ScanEngineResults = {
  results: EngineResult[]
  queriesUsed: string[]
}

function buildQueries(businessType: string, city: string): string[] {
  return [
    `I'm looking for recommendations for ${businessType} in ${city}. What are some good options?`,
    `What are the best ${businessType} near ${city}? I'd love some highly rated recommendations.`,
    `Can you suggest top-rated ${businessType} in the ${city} area? Looking for reliable options.`,
  ]
}

function stripBusinessSuffixes(name: string): string {
  return name
    .replace(/\b(llc|inc|co|corp|ltd|the|&|and)\b/gi, "")
    .replace(/[^a-z0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractKeyWords(businessName: string): string[] {
  const cleaned = stripBusinessSuffixes(businessName)
  return cleaned
    .split(" ")
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2)
}

function checkAppearance(
  response: string,
  businessName: string
): { appeared: boolean; position: number | null; snippet: string | null } {
  const lowerResponse = response.toLowerCase()
  const lowerName = businessName.toLowerCase()

  // Try exact match first
  const exactIdx = lowerResponse.indexOf(lowerName)
  if (exactIdx !== -1) {
    const start = Math.max(0, exactIdx - 50)
    const end = Math.min(response.length, exactIdx + lowerName.length + 100)
    return {
      appeared: true,
      position: 1,
      snippet: response.slice(start, end).trim(),
    }
  }

  // Try key word matching (2+ words must match)
  const keyWords = extractKeyWords(businessName)
  if (keyWords.length === 0) {
    return { appeared: false, position: null, snippet: null }
  }

  // Find sentences/chunks that contain multiple key words
  const sentences = response.split(/(?<=[.!?])\s+/)
  for (let i = 0; i < sentences.length; i++) {
    const lowerSentence = sentences[i].toLowerCase()
    const matchCount = keyWords.filter((w) => lowerSentence.includes(w)).length
    const threshold = keyWords.length === 1 ? 1 : Math.max(2, Math.ceil(keyWords.length * 0.5))
    if (matchCount >= threshold) {
      const snippet = sentences[i].slice(0, 150).trim()
      return { appeared: true, position: i + 1, snippet }
    }
  }

  return { appeared: false, position: null, snippet: null }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ])
}

async function scanClaude(
  businessName: string,
  businessType: string,
  city: string,
  queries: string[]
): Promise<EngineResult> {
  const query = queries[0]
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    installPauseGuard(client)
    const message = await withTimeout(
      client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 600,
        messages: [{ role: "user", content: query }],
      }),
      20000
    )
    const response = message.content[0].type === "text" ? message.content[0].text : ""
    const { appeared, position, snippet } = checkAppearance(response, businessName)
    return {
      engine: "claude",
      status: appeared ? "appeared" : "not_appearing",
      appeared,
      position,
      snippet,
      query,
      response,
    }
  } catch (err) {
    console.error("Claude scan error:", err)
    return {
      engine: "claude",
      status: "error",
      appeared: false,
      position: null,
      snippet: null,
      query,
      response: "",
    }
  }
}

async function scanChatGPT(
  businessName: string,
  businessType: string,
  city: string,
  queries: string[]
): Promise<EngineResult> {
  const query = queries[1]
  if (!process.env.OPENAI_API_KEY) {
    return {
      engine: "chatgpt",
      status: "not_configured",
      appeared: false,
      position: null,
      snippet: null,
      query,
      response: "",
    }
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 600,
        messages: [{ role: "user", content: query }],
      }),
      20000
    )
    const response = completion.choices[0]?.message?.content ?? ""
    const { appeared, position, snippet } = checkAppearance(response, businessName)
    return {
      engine: "chatgpt",
      status: appeared ? "appeared" : "not_appearing",
      appeared,
      position,
      snippet,
      query,
      response,
    }
  } catch (err) {
    console.error("ChatGPT scan error:", err)
    return {
      engine: "chatgpt",
      status: "error",
      appeared: false,
      position: null,
      snippet: null,
      query,
      response: "",
    }
  }
}

async function scanGemini(
  businessName: string,
  businessType: string,
  city: string,
  queries: string[]
): Promise<EngineResult> {
  const query = queries[2]
  if (!process.env.GEMINI_API_KEY) {
    return {
      engine: "gemini",
      status: "not_configured",
      appeared: false,
      position: null,
      snippet: null,
      query,
      response: "",
    }
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    // Verified against the live API (July 2026): gemini-1.5/2.0/2.5-flash all
    // return 404 ("no longer available"). Model names churn — if this engine
    // starts returning "error", re-probe ListModels before assuming a key issue.
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      // thinkingBudget 0 is load-bearing, not a tweak. Gemini 3 reasons before
      // answering: left on, it takes ~11.5s and blows the timeout (engine looks
      // dead); capped, it answers in ~5.4s. Setting maxOutputTokens alone is
      // worse than useless — the thinking consumes the budget and you get a
      // ~90-char stub instead of an answer. Measured, not guessed.
      // Cast: SDK 0.24.1's GenerationConfig type predates thinkingConfig, but the
      // API honours it (verified live against the prod key).
      generationConfig: { thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 600 } as unknown as GenerationConfig,
    })
    const result = await withTimeout(model.generateContent(query), 20000)
    const response = result.response.text()
    const { appeared, position, snippet } = checkAppearance(response, businessName)
    return {
      engine: "gemini",
      status: appeared ? "appeared" : "not_appearing",
      appeared,
      position,
      snippet,
      query,
      response,
    }
  } catch (err) {
    console.error("Gemini scan error:", err)
    return {
      engine: "gemini",
      status: "error",
      appeared: false,
      position: null,
      snippet: null,
      query,
      response: "",
    }
  }
}

async function scanPerplexity(
  businessName: string,
  businessType: string,
  city: string,
  queries: string[]
): Promise<EngineResult> {
  const query = queries[0]
  if (!process.env.PERPLEXITY_API_KEY) {
    return {
      engine: "perplexity",
      status: "not_configured",
      appeared: false,
      position: null,
      snippet: null,
      query,
      response: "",
    }
  }
  try {
    const client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: "https://api.perplexity.ai",
    })
    const completion = await withTimeout(
      client.chat.completions.create({
        // Verified live (July 2026): the llama-3.1-sonar-* names are gone; "sonar" is current.
        model: "sonar",
        max_tokens: 600,
        messages: [{ role: "user", content: query }],
      }),
      20000
    )
    const response = completion.choices[0]?.message?.content ?? ""
    const { appeared, position, snippet } = checkAppearance(response, businessName)
    return {
      engine: "perplexity",
      status: appeared ? "appeared" : "not_appearing",
      appeared,
      position,
      snippet,
      query,
      response,
    }
  } catch (err) {
    console.error("Perplexity scan error:", err)
    return {
      engine: "perplexity",
      status: "error",
      appeared: false,
      position: null,
      snippet: null,
      query,
      response: "",
    }
  }
}

export async function scanAllEngines(
  businessName: string,
  businessType: string,
  city: string,
  _websiteUrl?: string,
  // Optional business-specific customer question (built by the public-scan
  // pipeline via claude-haiku). When provided, ALL engines are asked this one
  // question. When absent, falls back to the generic buildQueries() behavior.
  customQuery?: string
): Promise<ScanEngineResults> {
  const queries =
    customQuery && customQuery.trim().length > 0
      ? [customQuery.trim(), customQuery.trim(), customQuery.trim()]
      : buildQueries(businessType, city)

  const settled = await Promise.allSettled([
    scanClaude(businessName, businessType, city, queries),
    scanChatGPT(businessName, businessType, city, queries),
    scanGemini(businessName, businessType, city, queries),
    scanPerplexity(businessName, businessType, city, queries),
  ])

  const results: EngineResult[] = settled.map((s, i) => {
    const engines: EngineResult["engine"][] = ["claude", "chatgpt", "gemini", "perplexity"]
    if (s.status === "fulfilled") return s.value
    return {
      engine: engines[i],
      status: "error",
      appeared: false,
      position: null,
      snippet: null,
      query: queries[i % queries.length],
      response: "",
    }
  })

  return { results, queriesUsed: queries }
}
