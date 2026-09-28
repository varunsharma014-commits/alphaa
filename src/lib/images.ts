// Featured images for agent-written posts. Generated once per draft (OpenAI
// GPT Image, low quality JPEG ≈ 1–2¢), stored as a MockActivity row, and
// served from a signed public URL so WordPress, Shopify and Webflow can fetch it.
import OpenAI from "openai"
import { createHmac } from "crypto"
import { db } from "@/lib/db"

const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini"

function secret(): string {
  return process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"
}
export const imageSig = (id: string) => createHmac("sha256", secret()).update(`img:${id}`).digest("hex").slice(0, 24)
export const imageUrl = (id: string) => `${process.env.NEXT_PUBLIC_APP_URL ?? "https://alphaa.app"}/api/img/${id}.jpg?s=${imageSig(id)}` // ".jpg": WordPress only sideloads URLs that look like images

/** Returns { id, url, alt } or null (no key, refused, or timed out — posts still work without one). */
export async function generatePostImage(userId: string, input: { title: string; businessType: string | null; city: string | null }): Promise<{ id: string; url: string; alt: string } | null> {
  if (!process.env.OPENAI_API_KEY) return null
  const alt = input.title.slice(0, 120)
  const prompt = `Editorial photograph to illustrate a blog post titled "${input.title}" for a ${input.businessType || "local business"}${input.city ? ` in ${input.city}` : ""}. Realistic, natural light, warm and professional, like a magazine photo. No text, no words, no logos, no watermarks, no close-up faces.`
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await client.images.generate({ model: MODEL, prompt, size: "1536x1024", quality: "low", output_format: "jpeg", output_compression: 72, n: 1 }, { timeout: 90_000 })
    const b64 = res.data?.[0]?.b64_json
    if (!b64) return null
    const row = await db.mockActivity.create({ data: { userId, type: "post_image", title: `Made an image for “${alt}”`, metadata: { b64, mime: "image/jpeg", alt } } })
    return { id: row.id, url: imageUrl(row.id), alt }
  } catch (err) {
    console.error("[images]", err instanceof Error ? err.message : err)
    return null
  }
}
