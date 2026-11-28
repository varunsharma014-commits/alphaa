// Runs the agent's weekly background checks and caches each result as a
// MockActivity row ("check_<kind>") so threads open instantly.
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { getLocationInfo } from "@/lib/gmb"
import { checkSecurity, type SecurityCheck } from "./security"
import { checkProfiles, findProfileUrls, missingNetworks, networkOf, type ProfileFinding, type ProfileNetwork } from "./profiles"
import { checkNap, napSummary, type NapFinding } from "./nap"
import { outsideReviews, reviewSites, type OutsideReview } from "./reviews-elsewhere"
import { bingSummary, decryptSecret } from "./bing-webmaster"
import { ownerRequest } from "@/lib/usage"

export type CheckKind = "security" | "profiles" | "listings" | "bing"
export type ProfilesResult = { findings: ProfileFinding[]; missing: ProfileNetwork[] }
export type ListingsResult = { nap: NapFinding[]; summary: ReturnType<typeof napSummary>; reviews: OutsideReview[] }
export type BingResult = Exclude<Awaited<ReturnType<typeof bingSummary>>, { error: string }> | { error: string }

const DAY = 86_400_000
const site = (u: string) => (u.startsWith("http") ? u : `https://${u}`)

export async function cachedCheck<T>(userId: string, kind: CheckKind, maxAgeMs = DAY): Promise<{ data: T; at: Date } | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: `check_${kind}` }, orderBy: { createdAt: "desc" } })
  if (!row?.metadata || Date.now() - row.createdAt.getTime() > maxAgeMs) return null
  return { data: row.metadata as unknown as T, at: row.createdAt }
}

async function save(userId: string, kind: CheckKind, title: string, data: unknown) {
  await db.mockActivity.create({ data: { userId, type: `check_${kind}`, title, metadata: data as object } })
}

export async function runCheck(userId: string, kind: CheckKind): Promise<unknown> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { integration: true } })
  if (!user) return null
  const s = await getAgentSettings(userId)

  if (kind === "security") {
    if (!user.websiteUrl) return null
    const r: SecurityCheck | null = await checkSecurity(site(user.websiteUrl))
    if (r) await save(userId, kind, `Security check: ${r.passed} of ${r.total} pass`, r)
    return r
  }

  if (kind === "profiles") {
    if (!user.websiteUrl) return null
    const loc = user.integration ? await getLocationInfo(user.integration).catch(() => null) : null
    const findings = await checkProfiles({ siteUrl: site(user.websiteUrl), businessName: user.businessName ?? "", phone: loc?.phone ?? null, extraUrls: s.profiles, userId })
    const missing = missingNetworks(findings.map((f) => f.network), user.businessType)
    const r: ProfilesResult = { findings, missing }
    await save(userId, kind, `Checked ${findings.length} profiles`, r)
    return r
  }

  if (kind === "listings") {
    const urls = Array.from(new Set((s.profiles ?? []).filter((u) => reviewSites([u]).length))).slice(0, 12)
    const loc = user.integration ? await getLocationInfo(user.integration).catch(() => null) : null
    const addr = loc?.address ?? ""
    const facts = {
      name: user.businessName ?? "",
      phone: loc?.phone ?? null,
      street: addr.split(",")[0]?.trim() || null,
      city: user.city,
      zip: addr.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] ?? user.zip ?? null,
    }
    // DataForSEO's standard tasks: a short wait when the owner is waiting (the rest is collected next time).
    const waitMs = ownerRequest() ? 35_000 : 150_000
    const ratingUser = { id: user.id, businessName: user.businessName, businessType: user.businessType, city: user.city, state: user.state, websiteUrl: user.websiteUrl }
    const [nap, reviews] = await Promise.all([
      urls.length ? checkNap(urls, facts) : Promise.resolve([]),
      outsideReviews(urls, facts.name, { user: ratingUser, googleConnected: !!loc, waitMs }),
    ])
    const r: ListingsResult = { nap, summary: napSummary(nap), reviews }
    await save(userId, kind, `Checked your details on ${nap.length} listings`, r)
    return r
  }

  if (kind === "bing") {
    if (!s.bingKeyEnc || !s.bingSite) return null
    const r: BingResult = await bingSummary(decryptSecret(s.bingKeyEnc), s.bingSite)
    await save(userId, kind, "error" in r ? "Bing: couldn’t read your data" : `Bing: ${r.clicks7} clicks this week`, r)
    return r
  }
  return null
}

export { networkOf }
