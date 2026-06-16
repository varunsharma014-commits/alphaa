import { cn } from "@/lib/utils"

interface HeadlineWithSerifProps {
  /** Split the headline into parts. The serifWord is rendered in Instrument Serif italic. */
  before: string
  serifWord: string
  after?: string
  className?: string
  as?: "h1" | "h2" | "h3"
}

export function HeadlineWithSerif({
  before,
  serifWord,
  after,
  className,
  as: Tag = "h2",
}: HeadlineWithSerifProps) {
  return (
    <Tag className={cn("text-fg text-balance", className)}>
      {before && <span>{before} </span>}
      <span className="serif-italic text-brand-orange">{serifWord}</span>
      {after && <span> {after}</span>}
    </Tag>
  )
}
