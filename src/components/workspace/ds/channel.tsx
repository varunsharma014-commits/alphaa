import type { ReactNode } from "react"
import { Glyph } from "./glyphs"

// Channel marks drawn from simple shapes (no copied logos). `ChannelBadge` = mark + label,
// `PlatformIcons` = a compact overlapping stack with the names in the tooltip.
export type Channel = "facebook" | "instagram" | "linkedin" | "google" | "web" | "email" | "x"

export const CHANNEL_LABEL: Record<Channel, string> = {
  facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", google: "Google", web: "Website", email: "Email", x: "X",
}

/** Map loose names ("Facebook & Instagram", "FB", "Google listing", "Website", "blog") to channels. */
export function channelsOf(text: string | null | undefined): Channel[] {
  if (!text) return []
  const t = text.toLowerCase()
  const out: Channel[] = []
  const add = (c: Channel) => { if (!out.includes(c)) out.push(c) }
  if (/facebook|\bfb\b|\bmeta\b/.test(t)) add("facebook")
  if (/instagram|\big\b/.test(t)) add("instagram")
  if (/linkedin/.test(t)) add("linkedin")
  if (/google|\bgbp\b|listing/.test(t)) add("google")
  if (/website|\bweb\b|blog|\bsite\b|page/.test(t)) add("web")
  if (/e-?mail|newsletter/.test(t)) add("email")
  if (/^x$|twitter|x\.com|(^|[,&/] *)x( *[,&/]|$)/.test(t)) add("x")
  return out
}

const BG: Record<Channel, string> = {
  facebook: "#1877f2",
  instagram: "linear-gradient(45deg,#f9a12e 0%,#e1306c 50%,#8a3ab9 100%)",
  linkedin: "#0a66c2",
  google: "#fff",
  web: "#6e6e73",
  email: "#af52de",
  x: "#111114",
}

export function ChannelMark({ channel, size = 18 }: { channel: Channel; size?: number }) {
  const s = size
  const style = { width: s, height: s, background: BG[channel], borderRadius: channel === "facebook" || channel === "google" ? 999 : Math.round(s * 0.28), fontSize: Math.round(s * 0.62) }
  let inner: ReactNode
  switch (channel) {
    case "facebook": inner = <span style={{ fontFamily: "Helvetica, Arial, sans-serif", transform: "translateY(6%)" }}>f</span>; break
    case "linkedin": inner = <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: Math.round(s * 0.5) }}>in</span>; break
    case "x": inner = <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: Math.round(s * 0.55) }}>X</span>; break
    case "google": inner = <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: Math.round(s * 0.62), background: "conic-gradient(from -45deg,#ea4335 0 25%,#4285f4 0 50%,#34a853 0 75%,#fbbc05 0)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>G</span>; break
    case "instagram": inner = (
      <svg viewBox="0 0 24 24" width={s * 0.66} height={s * 0.66} fill="none" stroke="#fff" strokeWidth={2.2} aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="#fff" stroke="none" /></svg>
    ); break
    case "web": inner = <Glyph name="globe" size={Math.round(s * 0.7)} stroke={2} />; break
    case "email": inner = <Glyph name="mail" size={Math.round(s * 0.68)} stroke={2} />; break
  }
  return <span className="xd-ch__m" style={{ ...style, boxShadow: channel === "google" ? "inset 0 0 0 1px rgba(0,0,0,.1)" : undefined }} aria-hidden="true">{inner}</span>
}

export function ChannelBadge({ channel, label, size = 18 }: { channel: Channel; label?: string | false; size?: number }) {
  const name = label === false ? null : label ?? CHANNEL_LABEL[channel]
  return (
    <span className="xd-ch" title={CHANNEL_LABEL[channel]}>
      <ChannelMark channel={channel} size={size} />
      {name ? <span>{name}</span> : <span className="sr-only">{CHANNEL_LABEL[channel]}</span>}
    </span>
  )
}

export function PlatformIcons({ channels, size = 20 }: { channels: Channel[]; size?: number }) {
  if (!channels.length) return null
  const names = channels.map((c) => CHANNEL_LABEL[c]).join(", ")
  return (
    <span className="xd-chs" title={names} role="img" aria-label={names}>
      {channels.map((c) => <ChannelMark key={c} channel={c} size={size} />)}
    </span>
  )
}
