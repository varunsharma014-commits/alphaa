// "Refresh this post": an updated version of a page that is losing Google traffic, written from
// the page itself, the owner's own facts/site, the search terms the page shows up for and the
// customer questions tracked for the AIs. Saved as a post_draft with metadata.refresh, so it goes
// through the normal approve / Autopilot (Going out soon) path, and is published as an UPDATE to
// the same CMS item (lib/connector/publish.ts updateContentOnSite; Undo restores the old version).
// "Fix the links" makes the same kind of draft without AI: broken links unwrapped, redirect chains
// pointed straight at their final address.
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { safeFetch } from "@/lib/safe-fetch"
import { withQuota, isQuotaError } from "@/lib/quotas"
import { factsOf } from "@/lib/content"
import { voiceFor } from "@/lib/voice"
import { readSiteFacts, siteFactsText } from "@/lib/site-facts"
import { latestQuestionScan } from "@/lib/questions"
import { getPageQueries, gscWindows } from "@/lib/gsc"
import { getAgentSettings } from "@/lib/agent/settings"
import { CantUpdateError, updateContentOnSite } from "@/lib/connector/publish"
import { latestPageSnapshot } from "@/lib/seo/page-stats"
import { detectDecay, evidenceLines, DECAY } from "@/lib/seo/decay"
import { articleFromHtml, extractArticle, fixLinks, newNumbers, plainMarkdown, sanitizeArticle, stampUpdated, toAbs, type Article } from "@/lib/seo/article-html"
import type { CrawlIssue } from "@/lib/crawler"

const anthropic = claudeFor("refresh")
const SONNET = "claude-sonnet-4-6"
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
const MAX_BODY = 30_000

type U = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

export type RefreshInfo = {
  url: string
  kind: "refresh" | "links"
  /** Why: the dated Search Console numbers, or the broken links found by the crawl. */
  evidence: string[]
  /** What changed, in plain words (shown before approval). */
  changes: string[]
  /** Numbers in the new text that aren't in the old page or the owner's facts: blocks Autopilot. */
  unverified: string[]
  prevTitle: string
  at: string
}
export type RefreshDraftMeta = { title: string; html: string; markdown: string; excerpt: string; status: string; topic: string; imageId: null; refresh: RefreshInfo; url?: string; changeId?: string }

export type DraftResult = { ok: true; draftId: string; meta: RefreshDraftMeta } | { ok: false; error: string; quota?: boolean }

const bare = (u: string) => {
  try {
    return new URL(/^https?:/i.test(u) ? u : `https://${u}`).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** Only the owner's own site (their website or the connected one). */
export async function ownsUrl(user: U, url: string): Promise<boolean> {
  const host = bare(url)
  if (!host) return false
  const s = await getAgentSettings(user.id)
  const mine = [user.websiteUrl, s.wp?.siteUrl, s.site?.siteUrl, s.site?.label].filter(Boolean).map((x) => bare(x!))
  return mine.includes(host)
}

/** The page's body: WordPress's public REST copy when the page says it's WordPress (exact), else the live page. */
export async function loadArticle(url: string): Promise<Article | null> {
  let pageHtml: string
  let finalUrl = url
  try {
    const r = await safeFetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(12_000) })
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("html")) return null
    pageHtml = (await r.text()).slice(0, 3_000_000)
    finalUrl = r.url || url
  } catch {
    return null
  }
  // WordPress advertises its REST root (<link rel="https://api.w.org/" href=".../wp-json/">), also for sites in a subfolder.
  const api = /<link[^>]+rel=["']https:\/\/api\.w\.org\/["'][^>]*href=["']([^"']+)["']/i.exec(pageHtml)?.[1] ?? /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']https:\/\/api\.w\.org\/["']/i.exec(pageHtml)?.[1]
  const slug = (() => {
    try {
      return new URL(finalUrl).pathname.replace(/\/+$/, "").split("/").pop()
    } catch {
      return undefined
    }
  })()
  if (api && slug) {
    const base = api.endsWith("/") ? api : `${api}/`
    for (const kind of ["posts", "pages"]) {
      try {
        const r = await safeFetch(`${base}wp/v2/${kind}?slug=${encodeURIComponent(slug)}&_fields=link,title,content`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(8000) })
        if (!r.ok) continue
        const list = (await r.json().catch(() => [])) as { link?: string; title?: { rendered?: string }; content?: { rendered?: string } }[]
        const same = (a: string, b: string) => a.replace(/\/+$/, "").toLowerCase() === b.replace(/\/+$/, "").toLowerCase()
        const hit = Array.isArray(list) ? list.find((p) => p.link && (same(p.link, url) || same(p.link, finalUrl))) : null
        if (hit?.content?.rendered) {
          const a = articleFromHtml(hit.title?.rendered ?? "", hit.content.rendered, url)
          if (a) return a
        }
      } catch {
        break
      }
    }
  }
  return extractArticle(pageHtml, finalUrl)
}

/** A waiting draft for this URL from the last 7 days (so a second tap doesn't write a second one). */
async function waitingDraft(userId: string, url: string, kind: RefreshInfo["kind"]) {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "post_draft", createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) }, metadata: { path: ["refresh", "url"], equals: url } }, orderBy: { createdAt: "desc" }, take: 5 })
  return rows.find((r) => {
    const m = r.metadata as RefreshDraftMeta
    return m.refresh?.kind === kind && (m.status === "ready" || m.status === "scheduled")
  }) ?? null
}

async function saveDraft(userId: string, meta: RefreshDraftMeta, label: string): Promise<string> {
  const row = await db.mockActivity.create({ data: { userId, type: "post_draft", title: label, metadata: meta as object } })
  return row.id
}

const stripFences = (s: string) => s.replace(/^```(?:json)?\n?/m, "").replace(/\n?```\s*$/m, "").trim()

/** Write the refreshed version of a page (one blog piece on the plan's quota). */
export async function draftRefresh(user: U, url: string): Promise<DraftResult> {
  if (!(await ownsUrl(user, url))) return { ok: false, error: "I can only refresh pages on your own website." }
  const existing = await waitingDraft(user.id, url, "refresh")
  if (existing) return { ok: true, draftId: existing.id, meta: existing.metadata as RefreshDraftMeta }
  const article = await loadArticle(url)
  if (!article) return { ok: false, error: "I couldn’t read the text of that page (it may be built from widgets rather than a post body). Send it to your web person instead." }
  if (article.html.length > MAX_BODY) return { ok: false, error: "That page is too long for me to refresh safely in one go. Send it to your web person instead." }
  try {
    return await withQuota(user, "content_piece:blog", () => writeRefresh(user, url, article))
  } catch (e) {
    if (isQuotaError(e)) return { ok: false, error: e.message, quota: true }
    console.error("[refresh] draft failed", e instanceof Error ? e.message : e)
    return { ok: false, error: e instanceof Error && e.message.startsWith("I ") ? e.message : "I couldn’t write the refresh just now. Try again in a minute." }
  }
}

async function evidenceFor(userId: string, url: string): Promise<string[]> {
  const snap = await latestPageSnapshot(userId)
  if (!snap) return []
  const p = detectDecay(snap, DECAY, 500).find((d) => d.page === url)
  return p ? evidenceLines(p, snap) : []
}

/** Broken links / redirect chains the newest crawl found on this page. */
async function linkFixesFor(userId: string, url: string): Promise<{ broken: Set<string>; redirects: Map<string, string>; issues: CrawlIssue[]; at: Date | null }> {
  const crawl = await db.crawlResult.findFirst({ where: { userId }, orderBy: { crawledAt: "desc" } })
  const issues = (Array.isArray(crawl?.issues) ? (crawl!.issues as unknown as CrawlIssue[]) : []).filter((i) => i.sources?.includes(url) && i.target)
  return {
    broken: new Set(issues.filter((i) => i.type === "broken_internal_link" || i.type === "broken_outbound_link").map((i) => i.target!)),
    redirects: new Map(issues.filter((i) => i.type === "redirect_chain" && i.finalUrl).map((i) => [i.target!, i.finalUrl!])),
    issues,
    at: crawl?.crawledAt ?? null,
  }
}

async function writeRefresh(user: U, url: string, original: Article): Promise<DraftResult> {
  // Links the site check found broken are fixed first (same as "Fix the links"), so the refresh never keeps them.
  const lf = await linkFixesFor(user.id, url)
  const fixedLinks = lf.broken.size || lf.redirects.size ? fixLinks(original.html, url, lf.broken, lf.redirects) : null
  const article: Article = fixedLinks ? { ...original, html: fixedLinks.html } : original
  const [voice, siteFacts, scan, integ, evidence] = await Promise.all([
    voiceFor(user.id).catch(() => null),
    user.websiteUrl ? readSiteFacts(user.websiteUrl).then(siteFactsText).catch(() => "") : Promise.resolve(""),
    latestQuestionScan(user.id).catch(() => null),
    db.integration.findUnique({ where: { userId: user.id } }),
    evidenceFor(user.id, url),
  ])

  // Search terms this page shows up for: the last 28 days vs the 28 before.
  let queries = ""
  if (integ?.gscSiteUrl) {
    try {
      const { cur, prev } = gscWindows()
      const i = { accessToken: integ.accessToken, refreshToken: integ.refreshToken, expiresAt: integ.expiresAt, gscSiteUrl: integ.gscSiteUrl }
      const [a, b] = await Promise.all([getPageQueries(i, url, cur), getPageQueries(i, url, prev)])
      const before = new Map(b.map((r) => [r.query, r]))
      const all = new Map<string, string>()
      for (const r of a) {
        const p = before.get(r.query)
        all.set(r.query, `"${r.query}": ${r.clicks} clicks, ${r.impressions} impressions, position ${r.position.toFixed(1)}${p ? ` (before: ${p.clicks} clicks, position ${p.position.toFixed(1)})` : " (new)"}`)
      }
      for (const r of b) if (!all.has(r.query)) all.set(r.query, `"${r.query}": 0 clicks now (before: ${r.clicks} clicks, ${r.impressions} impressions, position ${r.position.toFixed(1)})`)
      queries = [...all.values()].slice(0, 25).join("\n")
    } catch (e) {
      console.error("[refresh] page queries", e instanceof Error ? e.message : e)
    }
  }
  const questions = (scan?.scan.questions ?? []).map((q) => `${q.q}${Object.values(q.engines).some((e) => e?.appeared) ? "" : " (the AIs don’t name this business for it yet)"}`).slice(0, 12)

  const siteHost = bare(url)
  const allowLinks = new Set(article.links)
  const allowHref = (abs: string) => allowLinks.has(abs) || bare(abs) === siteHost
  const sources = [article.text, factsOf(user), siteFacts, queries, questions.join("\n")].join("\n")

  const prompt = `You are refreshing an existing page on a business's website. Your version REPLACES the page at the same address (${url}), so it must stay the same page: same topic, same purpose, same promises.

CURRENT PAGE
Title: ${article.title}
Body (HTML):
${article.html}

FACTS ABOUT THE BUSINESS (the only facts you may add or correct from)
${factsOf(user)}
${siteFacts ? `\nWHAT THEIR OWN WEBSITE SAYS\n${siteFacts}\n` : ""}
${queries ? `SEARCH TERMS THIS PAGE SHOWS UP FOR ON GOOGLE (last 28 days, with the 28 days before)\n${queries}\n` : ""}
${questions.length ? `QUESTIONS CUSTOMERS ASK AI ASSISTANTS (tracked weekly)\n${questions.join("\n")}\n` : ""}
${voice ? `HOW TO WRITE\n${voice}\n` : ""}
RULES
- Keep every section, fact and link of the current page that is still right (the links were already checked; don't remove working ones). Keep the owner's own wording where it works; tighten, don't rewrite for the sake of it.
- Correct only what the FACTS or their website contradict (services, prices, areas, hours). Never invent numbers, prices, dates, statistics, names, quotes, awards, guarantees or results. Don't add any number that isn't already in the current page or the facts.
- Add at most 3 new sections, ONLY for search terms or questions listed above (none listed = no new sections) that this page's topic should answer but doesn't yet: a "<h2>" phrased as the question, then a direct one- or two-sentence answer first. Skip terms that belong to a different page. Don't stuff keywords.
- If the page has a FAQ, keep it and add a missing question there instead of a new section when that fits better.
- HTML only: <h2> <h3> <p> <ul> <ol> <li> <a href> <strong> <em> <blockquote>. Keep existing <img> tags exactly as they are. Keep existing links; new links only to pages on ${siteHost}. No <h1> (the title is separate), no "Updated on" line (it's added for you), no [placeholders], no dashes as punctuation.
- Title: keep the current one unless it's clearly unclear or outdated; under 65 characters.

Reply with JSON only:
{"title": "...", "excerpt": "one sentence for Google, under 160 characters", "html": "...", "changes": ["only what you actually changed and why, in plain words, max 6 items (empty if nothing)"]}`

  let parsed: { title?: string; excerpt?: string; html?: string; changes?: string[] } | null = null
  let html = ""
  let unverified: string[] = []
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await anthropic.messages.create({
      model: SONNET,
      max_tokens: 8000,
      messages: [{ role: "user", content: attempt === 0 ? prompt : `${prompt}\n\nYour last version added numbers that aren't in the page or the facts: ${unverified.join(", ")}. Leave them out.` }],
    })
    const raw = res.content.find((c) => c.type === "text")?.text ?? ""
    try {
      parsed = JSON.parse(stripFences(raw))
    } catch {
      const m = raw.match(/\{[\s\S]*\}/)
      parsed = m ? (JSON.parse(m[0]) as typeof parsed) : null
    }
    if (!parsed?.html) continue
    html = sanitizeArticle(parsed.html, url, { allowHref, allowImg: new Set(article.images) })
    unverified = newNumbers(html.replace(/<[^>]+>/g, " ") + " " + (parsed.title ?? ""), sources)
    if (!unverified.length) break
  }
  if (!parsed?.html || !html) throw new Error("I couldn’t write the refresh just now. Try again in a minute.")
  const newText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  if (newText.length < article.text.length * 0.7) throw new Error("I wrote a version that dropped too much of your page, so I threw it away. Try again in a minute.")
  if (/\[[^\]]{2,}\]/.test(newText)) throw new Error("I couldn’t write the refresh without guessing facts. Try again in a minute.")

  const title = (parsed.title ?? article.title).trim().slice(0, 120) || article.title
  const stamped = stampUpdated(html)
  const meta: RefreshDraftMeta = {
    title,
    html: stamped,
    markdown: plainMarkdown(stamped),
    excerpt: (parsed.excerpt ?? "").trim().slice(0, 300),
    status: "ready",
    topic: title,
    imageId: null,
    refresh: {
      url,
      kind: "refresh",
      evidence,
      changes: [
        ...(fixedLinks?.removed ? [`Removed ${fixedLinks.removed} broken link${fixedLinks.removed === 1 ? "" : "s"} my site check found (the words stay).`] : []),
        ...(fixedLinks?.repointed ? [`Pointed ${fixedLinks.repointed} link${fixedLinks.repointed === 1 ? "" : "s"} straight at the final address instead of a chain of redirects.`] : []),
        ...(parsed.changes ?? []).filter((c) => typeof c === "string"),
      ].slice(0, 8),
      unverified,
      prevTitle: article.title,
      at: new Date().toISOString(),
    },
  }
  const draftId = await saveDraft(user.id, meta, `Drafted a refresh of “${article.title}”`)
  return { ok: true, draftId, meta }
}

/** Broken links + redirect chains on one page (from the newest crawl), fixed in its body. No AI. */
export async function draftLinkFix(user: U, url: string): Promise<DraftResult> {
  if (!(await ownsUrl(user, url))) return { ok: false, error: "I can only fix pages on your own website." }
  const existing = await waitingDraft(user.id, url, "links")
  if (existing) return { ok: true, draftId: existing.id, meta: existing.metadata as RefreshDraftMeta }
  const { broken, redirects, issues, at } = await linkFixesFor(user.id, url)
  if (!broken.size && !redirects.size) return { ok: false, error: "My last site check found no broken links on that page." }
  const article = await loadArticle(url)
  if (!article) return { ok: false, error: "I couldn’t read the text of that page. Send it to your web person instead." }
  const fixed = fixLinks(article.html, url, broken, redirects)
  if (!fixed.removed && !fixed.repointed) return { ok: false, error: "Those links are in your site’s menu, header or footer, not in the page text, so they’re changed in your site’s theme. Send it to your web person." }
  const changes = [
    ...issues.filter((i) => broken.has(i.target!) && article.links.includes(toAbs(i.target!, url) ?? "")).map((i) => `Removed the link to ${i.target} (${i.status ? `it returns ${i.status}` : "it doesn’t answer"}); the words stay.`),
    ...issues.filter((i) => redirects.has(i.target!) && article.links.includes(toAbs(i.target!, url) ?? "")).map((i) => `Pointed the link to ${i.target} straight at ${i.finalUrl} (it went through ${i.hops?.length ?? 2} redirects).`),
  ].slice(0, 8)
  const meta: RefreshDraftMeta = {
    title: article.title,
    html: fixed.html,
    markdown: plainMarkdown(fixed.html),
    excerpt: "",
    status: "ready",
    topic: article.title,
    imageId: null,
    refresh: {
      url,
      kind: "links",
      evidence: at ? [`Found in my site check on ${at.toISOString().slice(0, 10)}: ${fixed.removed} broken link${fixed.removed === 1 ? "" : "s"}${fixed.repointed ? `, ${fixed.repointed} redirect chain${fixed.repointed === 1 ? "" : "s"}` : ""}.`] : [],
      changes: changes.length ? changes : [`Fixed ${fixed.removed + fixed.repointed} link${fixed.removed + fixed.repointed === 1 ? "" : "s"}.`],
      unverified: [],
      prevTitle: article.title,
      at: new Date().toISOString(),
    },
  }
  const draftId = await saveDraft(user.id, meta, `Fixed the links on “${article.title}”`)
  return { ok: true, draftId, meta }
}

export type PublishRefreshResult = { ok: true; url: string | null; changeId?: string; note?: string } | { ok: false; error: string; quota?: boolean; handoff?: boolean }

/** Publish a refresh draft as an UPDATE of the same page (approveSitePost routes here). */
export async function publishRefreshDraft(userId: string, draftId: string): Promise<PublishRefreshResult> {
  const row = await db.mockActivity.findFirst({ where: { id: draftId, userId, type: "post_draft" } })
  const m = row?.metadata as RefreshDraftMeta | null
  if (!row || !m?.refresh?.url) return { ok: false, error: "That draft isn’t here any more." }
  if (m.status === "published") return { ok: true, url: m.url ?? m.refresh.url }
  try {
    const r = await updateContentOnSite(userId, { url: m.refresh.url, title: m.title, html: m.html, excerpt: m.excerpt || undefined }, m.refresh.kind === "links" ? `Fixed the links on “${m.title}”` : `Refreshed “${m.title}” on your site`)
    const cur = await db.mockActivity.findUnique({ where: { id: row.id } })
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...((cur?.metadata ?? m) as object), status: "published", url: r.url, changeId: r.changeId, publishedAt: new Date().toISOString() } } })
    return { ok: true, url: r.url, changeId: r.changeId, note: r.note }
  } catch (e) {
    if (isQuotaError(e)) return { ok: false, error: e.message, quota: true }
    if (e instanceof CantUpdateError) return { ok: false, error: e.message, handoff: true }
    const msg = e instanceof Error ? e.message : String(e)
    // Connector refusals ("Webflow only lets apps change CMS items…") are a hand-off, not a retry.
    const handoff = /only lets apps|couldn’t find|couldn't find|isn’t in your|doesn’t let apps/i.test(msg)
    return { ok: false, error: `Your site didn’t take the update: ${msg}`, handoff }
  }
}
