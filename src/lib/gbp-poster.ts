import { anthropic } from "./claude"

// True when generated content still contains bracket placeholders like
// "[City]", "[address]" or "[phone]". The old prompt *asked* the model to emit
// placeholders for unknown facts, and one draft reached the calendar reading
// "based right here in [City]" — one autopilot tick away from publishing it to
// Google. Publishing paths must refuse content that fails this check.
export function containsPlaceholders(content: string): boolean {
  return /\[[^\]\n]{1,40}\]/.test(content)
}

export async function generateGbpPost(
  businessName: string,
  businessType: string,
  city: string,
  postType: "UPDATE" | "OFFER" | "EVENT",
  topic?: string
): Promise<{ content: string; callToAction: string }> {
  const topicLine = topic ? `Topic/focus: ${topic}` : "Choose a relevant topic for this business."

  const postTypeGuide = {
    UPDATE: "a business update post — share news, highlights, or what's happening",
    OFFER: "a special offer post — promote a deal, discount, or promotion",
    EVENT: "an event post — announce or promote an upcoming event",
  }[postType]

  // Guard against an empty profile city: never inject blank fragments like
  // "in " / ", " into the prompt, and never let the model reach for a
  // "[City]" placeholder because we handed it an empty value.
  const locality = city.trim()

  const prompt = `You are an SEO content writer helping a business owner write a Google Business Profile post.

Business: ${businessName}
Business type: ${businessType}
${locality ? `City: ${locality}` : "City: not provided — do NOT reference a city, location, or 'local area' in the post."}
Post type: ${postType} — ${postTypeGuide}
${topicLine}

Write a compelling Google Business Profile post that is 150-200 words. Make it sound natural and warm. Mention the business naturally${locality ? `, and reference the city/location where it is relevant (e.g. a business that serves a local area) — but don't force a location reference if the business primarily serves customers online, nationally, or B2B` : ""}. Include a clear call to action.

AEO (AI-engine optimization) hard rules — these are mandatory and apply even within the short word count. Do NOT add a multi-question FAQ section (it will not fit a short GBP post):
1. Open with a clear question that someone might ask an AI engine when looking for what this business offers, e.g. "Looking for the best ${businessType}?" or "What is the best ${businessType}?"${locality ? " — include the city only if the business serves a local area." : ""}
2. Answer that question directly in the first 1-2 sentences — AI engines favor direct, up-front answers. Lead with "${businessName}" as the answer${locality ? ` (add "in ${locality}" if the business is location-based)` : ""}.
3. Include the business name (${businessName}) naturally in the first paragraph${locality ? `, and the city (${locality}) too if location is relevant` : ""}.
4. End with a single short line stating the business name${locality ? `, city` : ""} and website or phone IF you know them from the details above. NEVER invent an address or phone number, and NEVER write bracket placeholders like "[address]" or "[phone]" — if you don't know a fact, leave it out entirely.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "content": "<the full post text, 150-200 words>",
  "callToAction": "<a short CTA phrase like 'Call us today', 'Visit us this weekend', 'Book your appointment now'>"
}`

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const parsed = JSON.parse(text.trim())
    return {
      content: parsed.content ?? "",
      callToAction: parsed.callToAction ?? "Learn more",
    }
  } catch {
    // Fallback: try to extract JSON from text
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return {
        content: parsed.content ?? "",
        callToAction: parsed.callToAction ?? "Learn more",
      }
    }
    throw new Error("Failed to parse AI response for GBP post generation")
  }
}

export async function postToGmb(
  accessToken: string,
  accountId: string,
  locationId: string,
  content: string,
  postType: string
): Promise<{ success: boolean; gmbPostId?: string; error?: string }> {
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`

  const body: Record<string, unknown> = {
    languageCode: "en",
    summary: content,
    topicType: postType === "OFFER" ? "OFFER" : postType === "EVENT" ? "EVENT" : "STANDARD",
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("[GBP] postToGmb error:", response.status, errorBody)
      return {
        success: false,
        error: `GMB API error ${response.status}: ${errorBody}`,
      }
    }

    const data = (await response.json()) as { name?: string }
    // name is like "accounts/123/locations/456/localPosts/789"
    const gmbPostId = data.name?.split("/").pop()

    return { success: true, gmbPostId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[GBP] postToGmb unexpected error:", message)
    return { success: false, error: message }
  }
}
