// One sitemap per market (/sitemaps/de.xml …) so Search Console reports
// indexing per country. Every URL here is also in /sitemap.xml.
import { MARKETS, HREFLANG, type LocaleKey } from "@/content/locales"
import { GUIDES } from "@/content/markets/guides"
import { tradeAlternates } from "@/content/markets/equivalents"

const SITE = "https://alphaa.app"
const UPDATED = "2026-10-30"

export const dynamic = "force-static"
export function generateStaticParams() {
  return Object.keys(MARKETS).map((k) => ({ file: `${k}.xml` }))
}

function entry(path: string, alternates?: Record<string, string>) {
  const links = alternates
    ? Object.entries(alternates)
        .map(([lang, p]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${SITE}${p === "/" ? "" : p}"/>`)
        .join("")
    : ""
  return `<url><loc>${SITE}${path}</loc><lastmod>${UPDATED}</lastmod>${links}</url>`
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const key = (await params).file.replace(/\.xml$/, "") as LocaleKey
  const m = MARKETS[key]
  if (!m) return new Response("Not found", { status: 404 })
  const g = GUIDES[key]
  const urls = [
    entry(m.copy.path, HREFLANG),
    ...m.extra.industries.map((i) => entry(`${m.copy.path}/${i.slug}`, tradeAlternates(key, i.slug))),
    entry(`${m.copy.path}/${g.base}`),
    ...g.guides.map((x) => entry(`${m.copy.path}/${g.base}/${x.slug}`)),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
