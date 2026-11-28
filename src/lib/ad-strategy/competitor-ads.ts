// What the owner's competitors run on Google search, from Google's own Ads Transparency Center via
// DataForSEO (serp/google/ads_search, standard mode, $0.0006 per competitor: 40 newest ads).
// The Transparency Center shows a picture of each text ad, not its words, so Haiku reads the words
// off the newest few pictures (copied as written, nothing added). An ad whose words can't be read
// keeps its format and dates only.
// Competitors' Meta (Facebook / Instagram) ads have no source: Meta's Ad Library API only returns
// political and issue ads in the US and Canada. The plan says so and leans on the playbook's hook
// types for Meta.
import { relevantCompetitors } from "@/lib/competitor-relevance"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { safeFetch } from "@/lib/safe-fetch"
import { adsForDomain, dataforseoConfigured } from "@/lib/dataforseo"
import { activeAds, META_ADS_NOTE, toCompetitorAd, type CompetitorAd } from "./competitor-ad-rows"

export { activeAds, META_ADS_NOTE, toCompetitorAd, type CompetitorAd }

const anthropic = claudeFor("ad-plan")

const MAX_COMPETITORS = 3
const PER = 8
const READ_PER = 3 // pictures read per competitor
const host = (u: string) => { try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "") } catch { return u } }
const nameOf = (c: { name: string | null; url: string }) => (c.name?.trim() || host(c.url).split(".")[0]).slice(0, 80)

/** Reads the words of a few ad pictures in one Haiku call. Index → text ("" = unreadable). */
async function readAdPictures(urls: string[]): Promise<string[]> {
  if (!urls.length) return []
  const pics = await Promise.all(urls.map(async (u) => {
    try {
      const r = await safeFetch(u, { signal: AbortSignal.timeout(10_000) })
      const type = r.headers.get("content-type") ?? ""
      if (!r.ok || !/^image\/(png|jpeg|gif|webp)/.test(type)) return null
      const buf = Buffer.from(await r.arrayBuffer())
      return buf.length > 0 && buf.length < 2_000_000 ? { type: type.split(";")[0] as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: buf.toString("base64") } : null
    } catch {
      return null
    }
  }))
  const have = pics.map((p, i) => ({ p, i })).filter((x): x is { p: NonNullable<typeof x.p>; i: number } => !!x.p)
  if (!have.length) return urls.map(() => "")
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: [
        ...have.flatMap(({ p }, k) => [{ type: "text" as const, text: `Picture ${k + 1}:` }, { type: "image" as const, source: { type: "base64" as const, media_type: p.type, data: p.data } }]),
        { type: "text", text: `Each picture is a Google search ad. For each one, copy the ad's headline and description exactly as written (not the "Sponsored" label or the web address). If you can't read a picture clearly, give "". Return ONLY JSON: {"ads": ["picture 1 text", ...]} with ${have.length} strings in order.` },
      ] }],
    })
    const raw = res.content.find((c) => c.type === "text")
    const txt = raw && raw.type === "text" ? raw.text.replace(/```json\n?|```/g, "").trim() : ""
    const parsed = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)) as { ads?: unknown[] }
    const out = urls.map(() => "")
    have.forEach(({ i }, k) => { const t = parsed.ads?.[k]; out[i] = typeof t === "string" ? t.slice(0, 400) : "" })
    return out
  } catch (err) {
    console.error("[ad-plan] reading ad pictures", err instanceof Error ? err.message : err)
    return urls.map(() => "")
  }
}

/** Active Google search ads for the owner's real competitors. Empty when DataForSEO is off or nothing runs. */
export async function competitorAds(userId: string, country: string | null): Promise<{ looked: string[]; ads: CompetitorAd[]; note: string }> {
  // Only real competitors (shared gate): never look up ads for a wiki, a directory or another industry.
  const all = await db.competitor.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 30, select: { name: true, url: true, crawlData: true } })
  const rows = (await relevantCompetitors(userId, all)).slice(0, MAX_COMPETITORS)
  const looked = rows.map(nameOf).filter(Boolean)
  if (!dataforseoConfigured() || !rows.length) return { looked, ads: [], note: META_ADS_NOTE }
  const cc = (country ?? "US").toLowerCase()
  const found = await Promise.all(rows.map(async (c) => ({ name: nameOf(c), ads: activeAds((await adsForDomain(host(c.url), { country: cc, mode: "standard" }).catch(() => null)) ?? []).slice(0, PER) })))
  // Words for the newest text ads of each competitor (pictures of other formats aren't read).
  const toRead = found.flatMap((f) => f.ads.filter((a) => a.format === "text" && a.preview).slice(0, READ_PER).map((a) => ({ key: a.creativeId, url: a.preview! })))
  const texts = await readAdPictures(toRead.map((x) => x.url))
  const textOf = new Map(toRead.map((x, i) => [x.key, texts[i] ?? ""]))
  const seen = new Set<string>()
  const ads: CompetitorAd[] = []
  for (const f of found) for (const a of f.ads) {
    const text = textOf.get(a.creativeId) ?? ""
    const k = text ? `${f.name}|${text}` : a.creativeId
    if (seen.has(k)) continue
    seen.add(k)
    ads.push(toCompetitorAd(a, f.name, text))
  }
  // Ads with words first (the plan reads those), then the longest-running.
  ads.sort((x, y) => Number(!!y.text) - Number(!!x.text) || (y.daysRunning ?? 0) - (x.daysRunning ?? 0))
  return { looked, ads: ads.slice(0, MAX_COMPETITORS * PER), note: META_ADS_NOTE }
}
