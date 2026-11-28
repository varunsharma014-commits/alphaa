// Everything the agent writes for a business's own website, from
// the business's facts only — unknown facts become [bracketed] placeholders.
import { withQuota } from "@/lib/quotas"
import { relevantGaps } from "@/lib/competitor-relevance"
import { ownScanWhere } from "@/lib/scan-match"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { getAgentSettings, type Location } from "@/lib/agent/settings"
import { latestQuestionScan } from "@/lib/questions"
import { ensureVoice, voiceFor, voiceText } from "@/lib/voice"
import { enforce, finishBlog, finishSocial } from "@/lib/guardrails"
import { buildBrief, briefNumbersText, type ContentBrief } from "@/lib/content-brief"
import { nextClusterArticle } from "@/lib/clusters"
import { withRelated } from "@/lib/cluster-rules"
import { allowedNumbers, cleanLinks, dropSentencesWith, flagNumbers, numberProblems } from "@/lib/content-check"

const anthropic = claudeFor("blog")

const SONNET = "claude-sonnet-4-6"
// The blog writer (2026-11-28): Sonnet 5.5, cheaper than 4.6 per token and better at long briefs.
const WRITER = "claude-sonnet-5-5"
const text = (r: { content: { type: string; text?: string }[] }) => r.content.find((c) => c.type === "text")?.text?.trim() ?? ""

type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

export function factsOf(user: U, voice?: string | null): string {
  return [
    `Business: ${user.businessName ?? "unknown"}`,
    `Type: ${user.businessType ?? "unknown"}`,
    `Location: ${[user.city, user.state].filter(Boolean).join(", ") || "unknown"}`,
    `Website: ${user.websiteUrl ?? "unknown"}`,
    user.voiceDescription ? `About them (their words): ${user.voiceDescription}` : "",
    voice ?? "",
    user.topicsToAvoid ? `Avoid: ${user.topicsToAvoid}` : "",
  ].filter(Boolean).join("\n")
}

const RULES = `Use only the facts given; for anything you'd have to invent (prices, hours, years in business, staff names, insurance, guarantees) write a [bracketed placeholder]. Plain English, no hype, never claim to be "the best". Answer-first: the first sentence under every heading answers it directly.`

/** One specific customer question this business hasn't written about yet (Haiku, ~1s). */
async function suggestTopic(user: U, posted: string[]): Promise<string | null> {
  const res = await anthropic.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 120,
    messages: [{
      role: "user",
      content: `${factsOf(user)}
Website: ${user.websiteUrl ?? "unknown"}
${user.voiceDescription ? `How they talk: ${user.voiceDescription}\n` : ""}Already written about (don't repeat or rephrase these): ${posted.length ? posted.map((p) => `"${p}"`).join("; ") : "nothing yet"}

Give ONE question a real prospective customer of this specific business would type into ChatGPT before choosing a provider — specific to what they sell (name the actual service or product category), not generic advice about "hiring a local business". Only mention a city if one is given above. Reply with the question only.`,
    }],
  })
  const q = text(res).replace(/^["'\s]+|["'\s]+$/g, "")
  return q.length > 10 && q.length < 160 ? q : null
}

/** writePost, counted against the brand's plan quota (content_piece:blog; lib/quotas.ts). Throws a QuotaError when out. The brief's planning call runs inside it (AI ceiling). */
export function writePost(...args: Parameters<typeof writePostUnmetered>): ReturnType<typeof writePostUnmetered> {
  // Brand guardrails (lib/guardrails.ts): banned words rejected + one retry, blog disclaimer appended.
  return withQuota(args[0], "content_piece:blog", () => enforce(args[0].id, "blog", () => writePostUnmetered(...args), { texts: (p) => [p.title, p.excerpt, p.markdown], finish: (p, g) => ({ ...p, markdown: finishBlog(p.markdown, g) }) }))
}

export type WrittenPost = {
  title: string
  markdown: string
  excerpt: string
  topic: string
  /** The brief it followed (lib/content-brief.ts), when one was made. */
  briefId?: string | null
  /** The Topic plan article it was written for ("<mapId>:<articleId>", lib/clusters.ts). */
  cluster?: string | null
  /** What the checks did: numbers "ok" | "fixed" (retry) | "removed" | "flagged" (left as [check: …]). */
  checks?: { numbers: "ok" | "fixed" | "removed" | "flagged"; unverified: string[]; links: number }
}

/**
 * A blog post answering a real customer question — Markdown with ## question headings.
 * Follows a BRIEF (lib/content-brief.ts): outline, internal links, facts, FAQ, competitor benchmark.
 * `brief: undefined` = I make one first (best effort); `brief: null` = write without one.
 * Every number must come from the facts or the brief (lib/content-check.ts): one retry with the
 * problems named, then unverified numbers are removed (autopublish) or flagged as [check: …].
 */
async function writePostUnmetered(user: U, topic?: string, opts: { noPlaceholders?: boolean; brief?: ContentBrief | null; gapId?: string | null; competitor?: string | null; cluster?: string | null } = {}): Promise<WrittenPost> {
  // Write in the owner's chosen voice (learned from their own words the first time).
  const learned = await ensureVoice(user.id).catch(() => null)
  const voice = learned ? voiceText(learned) : null
  let t = topic
  let cluster = opts.cluster ?? null
  let gapId = opts.gapId ?? null
  let competitor = opts.competitor ?? null
  // My own pick: the next unwritten article in the brand's Topic plan comes first (lib/clusters.ts).
  if (!t) {
    const next = await nextClusterArticle(user.id).catch(() => null)
    if (next) { t = next.title; cluster = next.ref; gapId ??= next.gapId; competitor ??= next.competitor }
  }
  if (!t) {
    // Prefer a tracked question the AIs didn't name us for; else a content gap.
    const qs = await latestQuestionScan(user.id)
    const missed = qs?.scan.questions.filter((q) => !Object.values(q.engines).some((e) => e?.appeared)).map((q) => q.q) ?? []
    const posted = (await db.mockActivity.findMany({ where: { userId: user.id, type: "post_draft" }, select: { metadata: true }, take: 50, orderBy: { createdAt: "desc" } })).map((r) => (r.metadata as { topic?: string } | null)?.topic)
    t = missed.find((q) => !posted.includes(q))
    if (!t) {
      // Only gaps from real competitors (shared gate: lib/competitor-relevance.ts).
      const gap = (await relevantGaps(user.id, await db.contentGap.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 5 })))[0] ?? null
      const gaps = (Array.isArray(gap?.gaps) ? gap!.gaps : []) as { topic?: string; suggestedTitle?: string }[]
      t = gaps.map((g) => g.suggestedTitle || g.topic).find((x): x is string => !!x && !posted.includes(x))
    }
    // New accounts have no tracked questions yet: the question their /start scan asked comes next.
    if (!t) {
      const lead = await db.scanLead.findFirst({
        where: await ownScanWhere(user),
        orderBy: { createdAt: "desc" },
        select: { ogData: true },
      })
      const q = (lead?.ogData as { insights?: { query?: unknown } } | null)?.insights?.query
      if (typeof q === "string" && q.trim().length > 10 && !posted.includes(q.trim())) t = q.trim()
    }
    // Still nothing: ask for one specific question a customer of THIS business would ask, not a
    // template ("…a local business in your area" came out three times for the same account).
    if (!t) t = (await suggestTopic(user, posted.filter((x): x is string => !!x)).catch(() => null)) ?? undefined
    t ??= `What to know before hiring a ${user.businessType ?? "local business"}${user.city ? ` in ${user.city}` : ""}`
  }
  let brief = opts.brief
  if (brief === undefined) {
    brief = await buildBrief(user, { topic: t, gapId, competitor, cluster }).catch((err) => {
      console.warn("[content] brief skipped:", err instanceof Error ? err.message : err)
      return null
    })
  }
  const siteHost = user.websiteUrl ? (() => { try { return new URL(/^https?:\/\//.test(user.websiteUrl!) ? user.websiteUrl! : `https://${user.websiteUrl}`).hostname.replace(/^www\./, "") } catch { return null } })() : null
  const facts = factsOf(user, voice)
  const allowed = allowedNumbers([factsOf(user), t, brief ? briefNumbersText(brief) : ""])
  const placeholderRule = opts.noPlaceholders ? "This will publish automatically: NEVER write [placeholders] — if a fact isn't given, leave it out and write around it." : RULES
  const numberRule = "Numbers: use ONLY numbers that appear in the facts below (prices, years, percentages, durations, counts of customers or anything else). No statistics or figures from general knowledge. Write around anything you don't have."
  const prompt = brief ? `Write a blog post for this business's website that answers: "${brief.question}". It should be the page an AI assistant quotes when a customer asks this.
Search intent: ${brief.intent}. Reader: ${brief.audience}. Main search phrase: "${brief.keyword}" (in the title and the first paragraph, naturally).
Length: about ${brief.wordTarget} words.
Format: first line "TITLE: <title, under 65 characters>", second line "EXCERPT: <one sentence>", then the body in Markdown:
- Open with a 2-3 sentence paragraph that answers the question directly (answer first, no preamble).
- Then these sections in this order as "## " headings (with the "### " sub-headings listed), each starting with a sentence that answers its heading directly:
${brief.outline.map((s, i) => `  ${i + 1}. ${s.h2}${s.h3.length ? `\n${s.h3.map((h) => `     ### ${h}`).join("\n")}` : ""}`).join("\n")}
${brief.internalLinks.length ? `- Link to these pages on the business's own site, each exactly once, as Markdown links inside the section named, with this anchor text:\n${brief.internalLinks.map((l) => `  [${l.anchor}](${l.url})${l.section ? ` in “${l.section}”` : " where it fits naturally"}`).join("\n")}\n- No other links.` : "- No links."}${brief.cluster ? `\n- This page is part of the business's topic “${brief.cluster.pillar}”${brief.cluster.isPillar ? " (it is the main guide; the linked pages go deeper)" : " (the main guide is linked above when it's live)"}.` : ""}
- Short paragraphs. Use "- " bullets, "1." numbered steps or one small Markdown table (| a | b |) only where they help the reader. No images. Bold sparingly.
- Mention the business naturally once or twice${user.city?.trim() ? `, with its city` : ""}. Write in the business's own voice (HOW TO WRITE below).
- End with "## Frequently asked questions" and these questions as "### " headings, each answered in 2-3 sentences:
${brief.faq.map((f) => `  ### ${f.q}`).join("\n")}
${brief.competitor ? `- A competitor's page on this (${brief.competitor.words ? `${brief.competitor.words} words, ` : ""}headings: ${brief.competitor.headings.slice(0, 20).join(" | ") || "unknown"}) is what this page must beat: cover everything useful in it from this business's side. ${brief.angle} Never name, quote or link the competitor.` : `- ${brief.angle}`}
- ${numberRule}
- ${placeholderRule}

FACTS (the only facts you may state)
${facts}
${brief.facts.map((f) => `- ${f.text}`).join("\n")}` : `Write a blog post (650–900 words) for this business's website that answers: "${t}". It should be the page an AI assistant quotes when a customer asks this.
Format: first line "TITLE: <title, under 65 characters>", second line "EXCERPT: <one sentence>", then the body in Markdown: a 2-sentence direct answer paragraph, then 4–6 sections with "## " headings phrased as questions, short paragraphs and "- " bullet lists where useful, ending with a "## Frequently asked questions" section of 3 "### " questions. Mention the business naturally once or twice, with its city. Write in the business's own voice (see HOW TO WRITE below). No links and no images. ${numberRule} ${placeholderRule}

FACTS
${facts}`

  const linkTargets = brief?.internalLinks.map((l) => l.url) ?? []
  const parse = (out: string) => {
    const title = out.match(/^TITLE:\s*(.+)$/m)?.[1]?.trim() ?? t!
    const excerpt = out.match(/^EXCERPT:\s*(.+)$/m)?.[1]?.trim() ?? ""
    const markdown = cleanLinks(out.replace(/^TITLE:.*$/m, "").replace(/^EXCERPT:.*$/m, "").trim(), { siteHost, allowed: linkTargets })
    return { title, excerpt, markdown }
  }
  const problemsOf = (p: { title: string; excerpt: string; markdown: string }) => numberProblems(`${p.title}\n${p.excerpt}\n${p.markdown}`, allowed)
  const linked = (md: string) => linkTargets.filter((u) => md.includes(`](${u}`)).length
  // Topic plan pages (pillar + live siblings) are required, not optional (lib/clusters.ts).
  const mustLink = brief?.internalLinks.filter((l) => l.cluster) ?? []
  const missingMust = (md: string) => mustLink.filter((l) => !md.includes(`](${l.url}`))

  const first = await anthropic.messages.create({ model: WRITER, max_tokens: brief && brief.wordTarget > 1100 ? 4500 : 3200, messages: [{ role: "user", content: prompt }] })
  let post = parse(text(first))
  let bad = problemsOf(post)
  let numbers: NonNullable<WrittenPost["checks"]>["numbers"] = "ok"
  const missingLinks = linkTargets.length && linked(post.markdown) === 0
  const missingTopic = missingMust(post.markdown)
  if (bad.length || missingLinks || missingTopic.length) {
    const why = [
      bad.length ? `It uses numbers that aren't in the facts: ${bad.join(", ")}. Remove them or say it without a number.` : "",
      missingLinks ? `It doesn't link to the business's pages. Add these links where they fit: ${brief!.internalLinks.map((l) => `[${l.anchor}](${l.url})`).join(", ")}.` : "",
      !missingLinks && missingTopic.length ? `It must also link to these pages on the same topic, each once where it fits: ${missingTopic.map((l) => `[${l.anchor}](${l.url})`).join(", ")}.` : "",
    ].filter(Boolean).join(" ")
    const second = await anthropic.messages.create({
      model: WRITER,
      max_tokens: brief && brief.wordTarget > 1100 ? 4500 : 3200,
      messages: [{ role: "user", content: prompt }, { role: "assistant", content: text(first) }, { role: "user", content: `Rewrite the whole post with the same format. ${why} Keep everything else.` }],
    }).catch(() => null)
    if (second) {
      const retry = parse(text(second))
      const retryBad = problemsOf(retry)
      if (retry.markdown.length > 400 && retryBad.length <= bad.length) { post = retry; bad = retryBad; numbers = "fixed" }
    }
  }
  if (bad.length) {
    // Still unverified: autopublish drafts lose those sentences; drafts for the owner get [check: …].
    if (opts.noPlaceholders) { post = { ...post, markdown: dropSentencesWith(post.markdown, bad), excerpt: dropSentencesWith(post.excerpt, bad), title: post.title }; numbers = "removed" }
    else { post = { ...post, markdown: flagNumbers(post.markdown, bad) }; numbers = "flagged" }
  }
  // Still missing a Topic plan link after the retry: one plain "Related reading" line before the FAQ.
  const still = missingMust(post.markdown)
  if (still.length) post = { ...post, markdown: withRelated(post.markdown, still) }
  return { ...post, topic: t, briefId: brief?.id ?? null, cluster: brief?.cluster?.ref ?? cluster, checks: { numbers, unverified: bad, links: linked(post.markdown) } }
}

/** writeMeta, counted against the brand's plan quota (content_piece:draft; lib/quotas.ts). Throws a QuotaError when out. */
export function writeMeta(...args: Parameters<typeof writeMetaUnmetered>): ReturnType<typeof writeMetaUnmetered> {
  return withQuota(args[0], "content_piece:draft", () => enforce(args[0].id, "blog", () => writeMetaUnmetered(...args), { texts: (t) => [t] }))
}

/** Homepage title (≤60) + meta description (≤155), as "Title: …\nDescription: …". */
async function writeMetaUnmetered(user: U, page: { url: string; currentTitle?: string | null; currentDescription?: string | null }): Promise<string> {
  const voice = await voiceFor(user.id).catch(() => null)
  const res = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Write a better page title and meta description for ${page.url}.
Current title: ${page.currentTitle || "(none)"}
Current description: ${page.currentDescription || "(none)"}
Title: under 60 characters, "<what they do> in <city> | <business name>" style if local. Description: under 155 characters, says what they do, where, and one concrete reason to choose them from the facts — no invented claims.
Output exactly two lines: "Title: …" and "Description: …".

FACTS
${factsOf(user, voice)}`,
    }],
  })
  return text(res)
}

export function parseMeta(s: string): { title: string; description: string } {
  return { title: s.match(/^Title:\s*(.+)$/im)?.[1]?.trim() ?? "", description: s.match(/^Description:\s*(.+)$/im)?.[1]?.trim() ?? "" }
}

/** writeLocationPage, counted against the brand's plan quota (content_piece:draft; lib/quotas.ts). Throws a QuotaError when out. */
export function writeLocationPage(...args: Parameters<typeof writeLocationPageUnmetered>): ReturnType<typeof writeLocationPageUnmetered> {
  return withQuota(args[0], "content_piece:draft", () => enforce(args[0].id, "blog", () => writeLocationPageUnmetered(...args), { texts: (p) => [p.title, p.markdown], finish: (p, g) => ({ ...p, markdown: finishBlog(p.markdown, g) }) }))
}

/** A page for one location — markdown, answer-first, with the location's facts. */
async function writeLocationPageUnmetered(user: U, loc: Location): Promise<{ title: string; markdown: string }> {
  const voice = await voiceFor(user.id).catch(() => null)
  const res = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 1600,
    messages: [{
      role: "user",
      content: `Write the location page for ${user.businessName}'s ${loc.city} location (400–600 words). First line "TITLE: <${user.businessType ?? "Business"} in ${loc.city} — ${user.businessName}>", then Markdown: a 2-sentence intro saying what they do at this location and exactly where; "## Where are we in ${loc.city}?" with the address and what's nearby only if known; "## What can you get done at our ${loc.city} location?"; "## How do you book or contact us?" with the phone; then "## Frequently asked questions" with 3 "### " questions. ${RULES}

LOCATION
Name: ${loc.name}
Address: ${[loc.street, loc.city, loc.state, loc.zip].filter(Boolean).join(", ")}
Phone: ${loc.phone || "[phone]"}
Hours: ${loc.hours || "[hours]"}

BUSINESS FACTS
${factsOf(user, voice)}`,
    }],
  })
  const out = text(res)
  return { title: out.match(/^TITLE:\s*(.+)$/m)?.[1]?.trim() ?? `${user.businessName} — ${loc.city}`, markdown: out.replace(/^TITLE:.*$/m, "").trim() }
}

export async function locationsOf(userId: string): Promise<Location[]> {
  return (await getAgentSettings(userId)).locations ?? []
}


/** writeSocial, counted against the brand's plan quota (content_piece:social; lib/quotas.ts). Throws a QuotaError when out. */
export function writeSocial(...args: Parameters<typeof writeSocialUnmetered>): ReturnType<typeof writeSocialUnmetered> {
  // Mandatory hashtags + social disclaimer here; each platform's own hashtags/limit at publish (lib/social/publish.ts).
  return withQuota(args[0], "content_piece:social", () => enforce(args[0].id, "social", () => writeSocialUnmetered(...args), { texts: (p) => [p.text, p.headline], finish: (p, g) => ({ ...p, text: finishSocial(p.text, g).text }) }))
}

/** A social post (Facebook / Instagram / LinkedIn) in the owner's voice, plus a 4-5 word headline for its image. */
async function writeSocialUnmetered(user: U, topic: string, context?: string): Promise<{ text: string; headline: string }> {
  const voice = await voiceFor(user.id).catch(() => null)
  return writeSocialFrom(factsOf(user, voice), topic, context)
}

/** The same, from a facts block (a visitor with no account yet). */
export async function writeSocialFrom(facts: string, topic: string, context?: string): Promise<{ text: string; headline: string }> {
  const res = await anthropic.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 800,
    messages: [{ role: "user", content: `Write one social media post (Facebook / Instagram / LinkedIn) for this business about: "${topic}".${context ? `\nWhy now: ${context}` : ""}
Hook in the first line, then 2-4 short lines that give the reader something useful, then one simple call to action. Under 90 words. At most 3 hashtags at the end, only if they fit. Use only the facts below; never invent prices, numbers, awards or guarantees. Never say "best", "#1" or "leading".
Then on a last line write "HEADLINE: " and a complete 4 to 6 word headline for the image (a full phrase, never cut off), in the same language, readable in two seconds.

${facts}` }],
  })
  const out = text(res)
  const m = out.match(/\n?HEADLINE:\s*(.+)\s*$/i)
  // Keep the whole headline (the image shrinks the type to fit); only a runaway one is cut.
  const words = (m?.[1] ?? topic).replace(/^["“«]\s*|\s*["”»]$/g, "").trim().split(/\s+/)
  const headline = words.length <= 9 ? words.join(" ") : words.slice(0, 5).join(" ")
  return { text: out.replace(/\n?HEADLINE:[\s\S]*$/i, "").trim(), headline }
}
