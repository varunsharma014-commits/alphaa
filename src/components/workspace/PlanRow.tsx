"use client"

// One planned or scheduled piece (Briefing "Going out soon" and "This week's plan"): a thumbnail
// or channel mark, the title, where and when, and its actions (Preview / Edit / Stop). The whole
// row opens it; the buttons in `actions` still work on their own. Built on ListRow.
import type { ReactNode } from "react"
import { ChannelMark, CHANNEL_LABEL, ListRow, type Channel } from "./ui"
import "./briefing.css"

export function PlanRow({ channels, label, image, title, when, stopped = false, actions, onOpen, href }: {
  /** Where it goes (the marks); empty = a generic mark with `label`. */
  channels: Channel[]
  /** Plain name of where it goes when there is no channel ("Social"). */
  label?: string
  image?: string | null
  title: ReactNode
  /** "Goes out Tue 9:00 AM" (already formatted, or a <When>). */
  when?: ReactNode
  stopped?: boolean
  actions?: ReactNode
  onOpen?: () => void
  href?: string
}) {
  const where = channels.length ? channels.map((c) => CHANNEL_LABEL[c]).join(", ") : label ?? ""
  const lead = (
    <span className={`xb-thumb${image ? "" : " none"}`} aria-hidden="true">
      {image ? <img src={image} alt="" loading="lazy" /> : channels[0] ? <ChannelMark channel={channels[0]} size={22} /> : <span className="xb-thumb__dot" />}
      {image && channels[0] && <span className="xb-thumb__ch"><ChannelMark channel={channels[0]} size={16} /></span>}
    </span>
  )
  return (
    <ListRow
      lead={lead}
      title={<span className={stopped ? "xb-struck" : undefined}>{title}</span>}
      meta={<>{where && <span>{where}</span>}{where && when ? <span aria-hidden="true">·</span> : null}{when && <span>{when}</span>}</>}
      end={actions}
      onClick={onOpen}
      href={href}
      chevron={false}
      wrapEnd
      label={typeof title === "string" ? `Open ${title}` : "Open"}
    />
  )
}
