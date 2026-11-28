// Outside ratings from DataForSEO Business Data, for the weekly listings check:
//   Google listing (my_business_info, live)  only when the owner hasn't connected their Google
//                                           listing (then the GMB API already has the real numbers)
//   Trustpilot (reviews, standard)          the Trustpilot page the owner linked, else their domain
//   Tripadvisor (reviews, standard)         the Tripadvisor page the owner linked, else a search by
//                                           name in their city, only for places people visit
//                                           (restaurants, hotels, tours, attractions…)
// A result is kept only when it is clearly this business (its domain, or its name on the listing).
// Trustpilot / Tripadvisor tasks that aren't ready in time are kept in agent settings `ratingTasks`
// and collected (free) on the next check instead of being bought again.
import { checkAppearance } from "@/lib/ai-engines"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { dataforseoConfigured, getTask, googleBusinessInfo, locationFor, postTask, type Endpoint } from "@/lib/dataforseo"
import { parseReviewSite, type Rating } from "@/lib/dataforseo-parse"

export type RatingsUser = { id: string; businessName: string | null; businessType: string | null; city: string | null; state: string | null; websiteUrl: string | null }

const VISITED = /\b(restaurant|cafe|café|coffee|bar|pub|bistro|bakery|brewery|winery|hotel|motel|inn|b&b|bed and breakfast|resort|hostel|lodge|tour|attraction|museum|gallery|spa|escape room|camp|marina|golf|zoo|aquarium|theatre|theater|venue)\b/i
const host = (u: string) => { try { return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "").toLowerCase() } catch { return "" } }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The domain in a trustpilot.com/review/<domain> link. */
export function trustpilotDomain(url: string): string | null {
  const m = url.match(/trustpilot\.com\/review\/([a-z0-9.-]+\.[a-z]{2,})/i)
  return m ? m[1].toLowerCase() : null
}
/** The path after tripadvisor.<tld>/ in a business page link. */
export function tripadvisorPath(url: string): string | null {
  const m = url.match(/tripadvisor\.[a-z.]+\/([A-Za-z_]+_Review-[^?#\s]+\.html)/)
  return m ? m[1] : null
}

type Job = { site: "trustpilot" | "tripadvisor"; key: string; task: Record<string, unknown>; verify: (r: Rating) => boolean }

async function runJob(userId: string, job: Job, waitMs: number): Promise<{ rating: Rating | null; pending: boolean }> {
  const ep: Endpoint = job.site
  const s = await getAgentSettings(userId)
  const saved = s.ratingTasks?.[job.site]
  let id = saved && saved.key === job.key && Date.now() - Date.parse(saved.at) < 3 * 86_400_000 ? saved.id : null
  if (!id) {
    const p = await postTask(ep, job.task, 0.002)
    if (!p) return { rating: null, pending: false }
    id = p.id
  }
  const until = Date.now() + waitMs
  let wait = 4000
  for (;;) {
    const g = await getTask(ep, id)
    if (g.ready) {
      if (saved) await saveAgentSettings(userId, { ratingTasks: { ...(s.ratingTasks ?? {}), [job.site]: undefined } }).catch(() => null)
      const r = g.ok ? parseReviewSite(g.result, job.site === "trustpilot" ? "Trustpilot" : "Tripadvisor") : null
      return { rating: r && job.verify(r) ? r : null, pending: false }
    }
    if (Date.now() + wait > until) break
    await sleep(wait)
    wait = Math.min(12_000, wait + 2000)
  }
  // Not ready yet: collect it next time instead of paying for a new task.
  await saveAgentSettings(userId, { ratingTasks: { ...(s.ratingTasks ?? {}), [job.site]: { id, key: job.key, at: saved?.key === job.key ? saved.at : new Date().toISOString() } } }).catch(() => null)
  return { rating: null, pending: true }
}

export type DataRating = Rating & { pending?: boolean }

/**
 * Ratings this business has on Google (when its listing isn't connected), Trustpilot and
 * Tripadvisor. `waitMs`: how long to wait for the standard tasks (short when the owner is waiting).
 */
export async function dataRatings(user: RatingsUser, profileUrls: string[], opts: { googleConnected: boolean; waitMs: number }): Promise<DataRating[]> {
  if (!dataforseoConfigured()) return []
  const name = user.businessName?.trim() ?? ""
  const own = user.websiteUrl ? host(user.websiteUrl) : ""
  const named = (title: string | null) => !!title && !!name && checkAppearance(title, name).appeared
  const out: DataRating[] = []

  const jobs: Job[] = []
  const tpLink = profileUrls.map(trustpilotDomain).find(Boolean) ?? null
  const tpDomain = tpLink ?? (own || null)
  if (tpDomain) jobs.push({ site: "trustpilot", key: tpDomain, task: { domain: tpDomain, depth: 20, sort_by: "recency" }, verify: () => true }) // the domain is the Trustpilot page's own id
  const taLink = profileUrls.map(tripadvisorPath).find(Boolean) ?? null
  if (taLink) jobs.push({ site: "tripadvisor", key: taLink, task: { url_path: taLink, depth: 10 }, verify: () => true })
  else if (name && user.city && VISITED.test(user.businessType ?? "")) {
    const loc = await locationFor({ city: user.city, state: user.state, websiteUrl: user.websiteUrl })
    if (loc.level === "city") jobs.push({ site: "tripadvisor", key: `${name}|${loc.name}`, task: { keyword: name.slice(0, 200), location_name: loc.name, depth: 10 }, verify: (r) => named(r.title) })
  }

  const [google, ...rest] = await Promise.all([
    !opts.googleConnected && name ? googleBusinessInfo(name, { city: user.city, state: user.state, websiteUrl: user.websiteUrl }).catch(() => null) : Promise.resolve(null),
    ...jobs.map((j) => runJob(user.id, j, opts.waitMs).catch(() => ({ rating: null, pending: false }))),
  ])
  // The Google listing must be this business: its website is the owner's, or it carries their name.
  if (google && ((own && google.domain && host(google.domain) === own) || named(google.title))) out.push({ site: "Google", title: google.title, url: google.url, rating: google.rating, count: google.count })
  rest.forEach((r, i) => {
    if (r.rating) out.push(r.rating)
    // Still running and the owner linked that page: say so instead of leaving it out.
    else if (r.pending && (jobs[i].site === "trustpilot" ? !!tpLink : !!taLink)) out.push({ site: jobs[i].site === "trustpilot" ? "Trustpilot" : "Tripadvisor", title: null, url: null, rating: null, count: null, pending: true })
  })
  return out
}
