#!/usr/bin/env node
// Generate a hero image for a blog post.
//
//   railway run node scripts/blog-image.mjs <slug> "<prompt>"
//
// Uses the same OpenAI image model as src/lib/images.ts (OPENAI_IMAGE_MODEL,
// default gpt-image-1-mini), reads OPENAI_API_KEY from env (never printed),
// then crops/compresses with sharp to a 1600x900 webp under ~200KB at
// public/blog/<slug>.webp. Paste the printed `image` object into the post meta.
import OpenAI from "openai"
import sharp from "sharp"
import { mkdirSync, writeFileSync } from "fs"
import path from "path"

const STYLE =
  "Clean editorial photography or minimal 3D illustration, soft natural light, calm neutral palette, generous negative space, 16:9 composition. " +
  "No text, no words, no letters, no numbers, no logos, no real brands or trademarks, no UI screenshots, no watermarks, no recognizable faces. Subject: "

const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini"
const QUALITY = process.env.BLOG_IMAGE_QUALITY || "medium" // low | medium | high
const W = 1600
const H = 900
const MAX_BYTES = 200 * 1024

function fail(msg) {
  console.error(`blog-image: ${msg}`)
  process.exit(1)
}

const [slug, ...rest] = process.argv.slice(2)
const userPrompt = rest.join(" ").trim()
if (!slug || !userPrompt) fail('usage: node scripts/blog-image.mjs <slug> "<prompt>"')
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail(`slug must be lowercase-kebab-case, got "${slug}"`)
if (!process.env.OPENAI_API_KEY) {
  fail("OPENAI_API_KEY is not set. Run it through Railway so the key comes from the project env:\n  railway run node scripts/blog-image.mjs " + slug + ' "..."')
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

let b64
try {
  const res = await client.images.generate(
    { model: MODEL, prompt: STYLE + userPrompt, size: "1536x1024", quality: QUALITY, output_format: "png", n: 1 },
    { timeout: 180_000 },
  )
  b64 = res.data?.[0]?.b64_json
} catch (err) {
  // Error messages from the SDK don't include the key; print only the message.
  fail(`image generation failed (${MODEL}): ${err?.status ?? ""} ${err?.message ?? err}`.trim())
}
if (!b64) fail("the API returned no image (possibly refused by the safety system). Try a plainer prompt.")

const raw = Buffer.from(b64, "base64")
const resized = sharp(raw).resize(W, H, { fit: "cover", position: "attention" })

let out
let q = 78
for (;;) {
  out = await resized.clone().webp({ quality: q, effort: 6 }).toBuffer()
  if (out.length <= MAX_BYTES || q <= 50) break
  q -= 6
}

const dir = path.join(process.cwd(), "public", "blog")
mkdirSync(dir, { recursive: true })
const file = path.join(dir, `${slug}.webp`)
writeFileSync(file, out)

const meta = await sharp(out).metadata()
const rel = `public/blog/${slug}.webp`
console.log(`${rel}  ${meta.width}x${meta.height}  ${(out.length / 1024).toFixed(0)}KB  (webp q${q}, ${MODEL}/${QUALITY})`)
console.log(`image: { src: "/blog/${slug}.webp", alt: "<describe the image>", width: ${meta.width}, height: ${meta.height} },`)
if (out.length > MAX_BYTES) console.warn(`warning: ${(out.length / 1024).toFixed(0)}KB is over the 200KB target even at q${q}`)
