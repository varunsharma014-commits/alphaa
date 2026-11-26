// Shared bits for the workspace pages (Briefing, Research, Social, Email, Ads, Tracking).
// Every number a workspace shows comes from a DB row or a connected account; when there is no
// data the page says so. Nothing here invents a figure.

/** Resolve to the value, or to `fallback` if it takes longer than `ms` or throws. */
export async function within<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([p.catch(() => fallback), new Promise<T>((res) => { t = setTimeout(() => res(fallback), ms) })])
  } finally {
    if (t) clearTimeout(t)
  }
}

/** Tiny in-process cache (Railway runs one replica): slow third-party reads at most every `ttl` ms. */
const store = new Map<string, { at: number; v: unknown }>()
export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.v as T
  const v = await fn()
  store.set(key, { at: Date.now(), v })
  if (store.size > 2000) for (const k of [...store.keys()].slice(0, 500)) store.delete(k)
  return v
}

export const n = (x: number) => Math.round(x).toLocaleString("en-US")

export function money(x: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: x >= 100 ? 0 : 2 }).format(x)
  } catch {
    return `$${x.toFixed(2)}`
  }
}

/** Percent change, or null when there is nothing to compare with. */
export function pctChange(now: number, prev: number | null | undefined): number | null {
  if (prev == null || prev <= 0) return null
  return Math.round(((now - prev) / prev) * 100)
}

/** "18m ago", "3h ago", "Mon", "Nov 12". */
export function ago(iso: string): string {
  const t = Date.parse(iso)
  const mins = Math.floor((Date.now() - t) / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ago`
  if (mins < 6 * 24 * 60) return new Date(t).toLocaleDateString("en-US", { weekday: "short" })
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** "Today 5:30 PM", "Tomorrow 9 AM", "Thu 5:30 PM", "Dec 2". */
export function whenAhead(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const diff = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - day0) / 86_400_000)
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined })
  if (diff <= 0) return `Today ${time}`
  if (diff === 1) return `Tomorrow ${time}`
  if (diff < 7) return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${time}`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const short = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}…` : s)

/** First line / sentence of a post, for a card title. */
export function headlineOf(text: string, max = 80): string {
  const first = text.replace(/[#*_>`]/g, "").split(/\n+/).map((l) => l.trim()).find(Boolean) ?? ""
  const sentence = first.split(/(?<=[.!?])\s/)[0] ?? first
  return short(sentence, max)
}

/** Gradient art for card headers (decorative only, no images). */
export const ART = {
  social: "linear-gradient(135deg,#4f46e5,#7c3aed,#db2777)",
  google: "linear-gradient(135deg,#0f172a,#1e3a8a,#0071e3)",
  email: "linear-gradient(135deg,#0f766e,#0891b2,#06b6d4)",
  blog: "linear-gradient(135deg,#111827,#1e3a8a,#0071e3)",
  ads: "linear-gradient(135deg,#9a3412,#ea580c,#f59e0b)",
  ai: "linear-gradient(135deg,#065f46,#0d9488,#06b6d4)",
  gray: "linear-gradient(135deg,#3f3f46,#71717a)",
  pink: "linear-gradient(135deg,#be185d,#ec4899,#f9a8d4)",
  blue: "linear-gradient(135deg,#1e3a8a,#2563eb,#38bdf8)",
} as const
export const ART_CYCLE = [ART.social, ART.google, ART.ai, ART.ads, ART.blue, ART.pink, ART.email, ART.blog]

/** Ledger row type → the channel chip on "Done on my own". */
export function channelOf(type: string): string {
  if (/^(gbp_post|gbp_post_draft)$/.test(type)) return "Google"
  if (/review/.test(type)) return "Reviews"
  if (/social/.test(type)) return "Social"
  if (/email/.test(type)) return "Email"
  if (/ads/.test(type)) return "Ads"
  if (/(post_draft|draft_written|site_change|site_check|handoff)/.test(type)) return "Website"
  if (/(question_scan|visibility_scan|citation_scan|win)/.test(type)) return "AI answers"
  if (/(competitors|content_gaps|insights)/.test(type)) return "Research"
  return "Work"
}
