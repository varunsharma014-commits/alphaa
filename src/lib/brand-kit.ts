// The business's look, read from its own website: logo, main colours and font. Used for the
// images on social posts. The owner can change any of it in the "Your brand & voice" thread.
import { db } from "@/lib/db"
import { safeFetch } from "@/lib/safe-fetch"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { pickLogo } from "@/lib/brand-logo"

export type BrandKit = {
  logo: string | null
  /** Main colours, most used first (hex). */
  colors: string[]
  primary: string | null
  font: string | null
  source: "site" | "owner"
  at: string
  /** A sample social image in this brand (post_image row id). */
  sampleId?: string | null
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"

async function get(url: string, max = 600_000): Promise<string> {
  try {
    const r = await safeFetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) })
    return r.ok ? (await r.text()).slice(0, max) : ""
  } catch {
    return ""
  }
}

export { pickLogo, logoCandidates, brandTokens } from "@/lib/brand-logo"

export const HEX_RE = /^#[0-9a-f]{6}$/i

function normHex(raw: string): string | null {
  let h = raw.trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(h)) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  if (/^#[0-9a-f]{8}$/.test(h)) h = h.slice(0, 7)
  return HEX_RE.test(h) ? h : null
}
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("")}`
}
function hsl(hex: string): { s: number; l: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  return { s, l }
}
/** Brand-like: not white, black or grey. */
const isBrandish = (hex: string) => { const { s, l } = hsl(hex); return s >= 0.2 && l > 0.12 && l < 0.92 }

export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Read logo, colours and font from the site. Null if it can't be opened. */
export async function readBrandKit(siteUrl: string, opts: { name?: string | null } = {}): Promise<Omit<BrandKit, "source" | "at"> | null> {
  const base = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`
  const html = await get(base)
  if (!html) return null
  const abs = (u: string) => { try { return new URL(u, base).toString() } catch { return null } }

  // Colours, weighted by where they appear.
  const score = new Map<string, number>()
  const add = (hex: string | null, w: number) => { if (hex && isBrandish(hex)) score.set(hex, (score.get(hex) ?? 0) + w) }
  const theme = html.match(/<meta[^>]+name=["']theme-color["'][^>]*content=["']([^"']+)/i)?.[1]
  if (theme) add(normHex(theme), 40)
  const cssHrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)/gi)].map((m) => abs(m[1])).filter((u): u is string => !!u).slice(0, 3)
  const css = [html.match(/<style[\s\S]*?<\/style>/gi)?.join("\n") ?? "", ...(await Promise.all(cssHrefs.map((u) => get(u, 800_000))))].join("\n")
  const scan = (text: string, w: number) => {
    for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) add(normHex(m[0]), w)
    for (const m of text.matchAll(/rgba?\(\s*(\d{1,3})[ ,]+(\d{1,3})[ ,]+(\d{1,3})/g)) add(rgbToHex(+m[1], +m[2], +m[3]), w)
  }
  for (const m of css.matchAll(/--[\w-]*(?:primary|brand|accent|main|theme)[\w-]*\s*:\s*([^;}{]+)/gi)) scan(m[1], 12)
  for (const m of css.matchAll(/(?:\.btn|button|\.button|\.wp-block-button__link|a)[^{]{0,80}\{[^}]*background(?:-color)?\s*:\s*([^;}]+)/gi)) scan(m[1], 6)
  scan(css, 1)
  scan((html.match(/style=["'][^"']*["']/gi) ?? []).join(" "), 2)
  // Merge near-identical shades.
  const colors: string[] = []
  for (const [hex] of [...score.entries()].sort((a, b) => b[1] - a[1])) {
    const close = colors.some((c) => [1, 3, 5].every((i) => Math.abs(parseInt(c.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16)) < 24))
    if (!close) colors.push(hex)
    if (colors.length >= 4) break
  }

  const logo = pickLogo(html, base, opts.name)

  const gf = html.match(/fonts\.googleapis\.com\/css2?\?family=([^&:"'@]+)/i)?.[1]
  const fam = css.match(/font-family\s*:\s*["']?([^"',;}{]+)/i)?.[1]?.trim()
  const font = gf ? decodeURIComponent(gf).replace(/\+/g, " ") : fam && !/^(inherit|sans-serif|serif|system-ui|-apple-system|var\()/i.test(fam) ? fam : null

  return { logo, colors, primary: colors[0] ?? null, font }
}

/** The saved brand kit, reading the site first if needed (and drawing a sample image). */
export async function ensureBrandKit(userId: string, opts: { force?: boolean } = {}): Promise<BrandKit | null> {
  const s = await getAgentSettings(userId)
  if (s.brand && !opts.force) return s.brand
  const user = await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true, businessName: true } })
  const site = s.wp?.siteUrl ?? s.site?.siteUrl ?? user?.websiteUrl
  const read = site ? await readBrandKit(site, { name: user?.businessName }).catch(() => null) : null
  if (!read && s.brand) return s.brand
  // Re-reading keeps what the owner set by hand.
  const owner = s.brand?.source === "owner" ? s.brand : null
  const kit: BrandKit = {
    logo: owner?.logo ?? read?.logo ?? null,
    colors: read?.colors ?? [],
    primary: owner?.primary ?? read?.primary ?? null,
    font: read?.font ?? null,
    source: owner ? "owner" : "site",
    at: new Date().toISOString(),
  }
  kit.sampleId = await sampleCard(userId, kit, user?.businessName ?? null)
  await saveAgentSettings(userId, { brand: kit })
  return kit
}

export async function saveBrand(userId: string, patch: Partial<Pick<BrandKit, "logo" | "primary" | "colors" | "font">>): Promise<BrandKit> {
  const s = await getAgentSettings(userId)
  const user = await db.user.findUnique({ where: { id: userId }, select: { businessName: true } })
  const kit: BrandKit = { logo: null, colors: [], primary: null, font: null, ...(s.brand ?? {}), ...patch, source: "owner", at: new Date().toISOString() }
  kit.sampleId = await sampleCard(userId, kit, user?.businessName ?? null)
  await saveAgentSettings(userId, { brand: kit })
  return kit
}

async function sampleCard(userId: string, kit: BrandKit, name: string | null): Promise<string | null> {
  const { renderSocialCard } = await import("@/lib/social-card")
  const card = await renderSocialCard(userId, { headline: "Your posts will look like this", businessName: name, brand: kit }).catch(() => null)
  return card?.id ?? null
}
