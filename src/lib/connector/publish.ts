// One place that publishes approved work to whichever site is connected:
// the WordPress plugin, or a Webflow / Shopify / Wix app connection. Every
// publish is logged as a "site_change" with the id needed to undo it.
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { wpCall, pingIndexNow, mdToHtml, mdFaq } from "@/lib/connector/wordpress"
import { imageUrl } from "@/lib/images"
import { bingSubmitUrls, decryptSecret } from "@/lib/checks/bing-webmaster"
import type { SiteConnector, SiteConnection } from "@/lib/connector/types"
import { webflow } from "@/lib/connector/webflow"
import { shopify } from "@/lib/connector/shopify"
import { wix } from "@/lib/connector/wix"

const CONNECTORS: Record<SiteConnection["platform"], SiteConnector> = { webflow, shopify, wix }
export const PLATFORM_NAME = { wordpress: "WordPress", webflow: "Webflow", shopify: "Shopify", wix: "Wix" } as const

export type ContentInput = {
  kind: "post" | "page"
  title: string
  markdown: string
  excerpt?: string
  jsonld?: object[]
  imageId?: string | null
}
export type Published = { url: string; changeId: string; platform: keyof typeof PLATFORM_NAME; indexed: boolean; note?: string }

const faqLd = (faq: { q: string; a: string }[]) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) })

/** Tell search engines a URL changed: IndexNow via the WP plugin's key, or Bing Webmaster if connected. */
async function announce(userId: string, siteUrl: string, url: string, viaWp: boolean): Promise<boolean> {
  if (viaWp) return pingIndexNow(userId, siteUrl, [url])
  const s = await getAgentSettings(userId)
  if (s.bingKeyEnc && s.bingSite) {
    const r = await bingSubmitUrls(decryptSecret(s.bingKeyEnc), s.bingSite, [url]).catch(() => ({ ok: false }))
    return r.ok
  }
  return false
}

export async function publishContent(userId: string, input: ContentInput, label: string): Promise<Published> {
  const s = await getAgentSettings(userId)
  const user = await db.user.findUnique({ where: { id: userId } })
  const html = mdToHtml(input.markdown)
  const faq = mdFaq(input.markdown)
  const jsonld: object[] = [...(input.jsonld ?? [])]
  if (input.kind === "post") jsonld.unshift({ "@context": "https://schema.org", "@type": "BlogPosting", headline: input.title, datePublished: new Date().toISOString(), author: { "@type": "Organization", name: user?.businessName ?? undefined }, publisher: { "@type": "Organization", name: user?.businessName ?? undefined } })
  if (faq.length) jsonld.push(faqLd(faq))
  const image = input.imageId ? { url: imageUrl(input.imageId), alt: input.title } : undefined

  let out: Published
  if (s.wp) {
    const r = await wpCall<{ id: string; url: string }>(userId, s.wp, input.kind, { title: input.title, html, jsonld, excerpt: input.excerpt, ...(image ? { image } : {}) })
    out = { url: r.url, changeId: r.id, platform: "wordpress", indexed: await announce(userId, s.wp.siteUrl, r.url, true) }
  } else if (s.site) {
    const r = await CONNECTORS[s.site.platform].publish(s.site, { kind: input.kind, title: input.title, html, excerpt: input.excerpt, jsonld, image })
    out = { url: r.url, changeId: `${s.site.platform}:${r.id}`, platform: s.site.platform, indexed: await announce(userId, s.site.siteUrl, r.url, false), note: r.note }
  } else {
    throw new Error("Your website isn’t connected yet.")
  }
  await db.mockActivity.create({ data: { userId, type: "site_change", title: label, metadata: { op: input.kind, changeId: out.changeId, url: out.url, platform: out.platform, indexed: out.indexed, undone: false } } })
  return out
}

export async function updateMetaOnSite(userId: string, url: string, title: string, description: string): Promise<Published> {
  const s = await getAgentSettings(userId)
  if (!s.site) throw new Error("Your website isn’t connected yet.")
  const c = CONNECTORS[s.site.platform]
  if (!c.updateMeta) throw new Error(`${PLATFORM_NAME[s.site.platform]} doesn’t let apps change page titles — I’ll email your web person instead.`)
  const r = await c.updateMeta(s.site, { url, title, description })
  const out: Published = { url: r.url, changeId: `${s.site.platform}:${r.id}`, platform: s.site.platform, indexed: false, note: r.note }
  await db.mockActivity.create({ data: { userId, type: "site_change", title: "Updated your page title and description", metadata: { op: "meta", changeId: out.changeId, url: out.url, platform: out.platform, undone: false } } })
  return out
}

/** Undo any logged change. WordPress changes go through the plugin; the rest through their connector. */
export async function undoChange(userId: string, changeId: string): Promise<void> {
  const s = await getAgentSettings(userId)
  const [platform, ...rest] = changeId.split(":")
  if (platform in CONNECTORS && s.site?.platform === platform) {
    await CONNECTORS[platform as SiteConnection["platform"]].undo(s.site, rest.join(":"))
  } else if (s.wp) {
    await wpCall(userId, s.wp, "undo", { id: changeId })
  } else {
    throw new Error("That site isn’t connected any more.")
  }
  const rows = await db.mockActivity.findMany({ where: { userId, type: "site_change" }, orderBy: { createdAt: "desc" }, take: 200 })
  const row = rows.find((r) => (r.metadata as { changeId?: string } | null)?.changeId === changeId)
  if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...(row.metadata as object), undone: true } } })
}
