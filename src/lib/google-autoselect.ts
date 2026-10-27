// After Google OAuth, Alphaa picks the owner's properties itself — no dropdowns.
// Search Console: the property for the business's own website (domain property preferred).
// Business Profile: the location whose website is the business's site, else whose name matches,
// else the only location. Analytics: only when the GA scope is enabled, same matching.
// Anything that can't be matched with confidence is left empty and reported, never guessed.
import { db } from '@/lib/db'
import { getAuthenticatedClient } from '@/lib/google'
import { getSiteList } from '@/lib/gsc'
import { getLocationList } from '@/lib/gmb'
import { getPropertyHosts, getPropertyList } from '@/lib/ga'

const bare = (h: string) => h.toLowerCase().replace(/^www\./, '')
function hostOf(u: string | null | undefined): string | null {
  if (!u) return null
  try {
    return bare(new URL(/^[a-z]+:\/\//i.test(u) ? u : `https://${u}`).hostname)
  } catch {
    return null
  }
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export type AutoSelectResult = { gsc: string | null; gbp: string | null; ga: string | null; siteHost: string | null }

export async function autoSelectGoogle(userId: string): Promise<AutoSelectResult> {
  const [user, integration] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true, businessName: true } }),
    db.integration.findUnique({ where: { userId } }),
  ])
  const siteHost = hostOf(user?.websiteUrl)
  const out: AutoSelectResult = { gsc: null, gbp: null, ga: null, siteHost }
  if (!integration) return out

  const client = await getAuthenticatedClient({
    accessToken: integration.accessToken,
    refreshToken: integration.refreshToken,
    expiresAt: integration.expiresAt,
  })
  const token = (await client.getAccessToken()).token ?? integration.accessToken
  const [sites, locations, gaProps] = await Promise.allSettled([
    getSiteList(token),
    getLocationList(token),
    // Fails (403) unless this grant included analytics.readonly; allSettled absorbs that.
    getPropertyList(token),
  ])

  const data: Record<string, string | null> = {}

  if (siteHost && sites.status === 'fulfilled') {
    const domain = sites.value.find((s) => s.toLowerCase() === `sc-domain:${siteHost}`)
    const prefix = sites.value.find((s) => !s.startsWith('sc-domain:') && hostOf(s) === siteHost)
    out.gsc = domain ?? prefix ?? null
    if (out.gsc) data.gscSiteUrl = out.gsc
  }

  if (locations.status === 'fulfilled' && locations.value.length) {
    const locs = locations.value
    const name = user?.businessName ? norm(user.businessName) : ''
    const pick =
      (siteHost && locs.find((l) => hostOf(l.website) === siteHost)) ||
      (name && locs.find((l) => norm(l.locationName) === name)) ||
      (locs.length === 1 ? locs[0] : null)
    if (pick) {
      out.gbp = pick.locationName
      Object.assign(data, { gmbAccountId: pick.accountId, gmbLocationId: pick.locationId, gmbLocationName: pick.locationName })
    }
  }

  if (gaProps.status === 'fulfilled' && gaProps.value.length) {
    const props = gaProps.value
    // Display names are free text ("GrowthTurbine - GA4"), so match on the web stream's
    // address first, then on the name with spaces removed.
    const hosts = siteHost ? await getPropertyHosts(token, props.map((p) => p.id)).catch(() => new Map<string, string[]>()) : new Map<string, string[]>()
    const squash = (s: string) => norm(s).replace(/ /g, '')
    const name = user?.businessName ? squash(user.businessName) : ''
    const pick =
      (siteHost && props.find((p) => hosts.get(p.id)?.includes(siteHost))) ||
      (siteHost && props.find((p) => squash(p.name).includes(squash(siteHost.split('.')[0])))) ||
      (name && props.find((p) => squash(p.name).includes(name))) ||
      (props.length === 1 ? props[0] : null)
    if (pick) {
      out.ga = pick.name
      Object.assign(data, { gaPropertyId: pick.id, gaPropertyName: pick.name })
    }
  }

  if (Object.keys(data).length) await db.integration.update({ where: { userId }, data })
  return out
}
