import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  style?: React.CSSProperties
}

export function GlassCard({ children, className, hover, glow, style }: GlassCardProps) {
  return (
    <div
      style={style}
      className={cn(
        "glass-card rounded-[18px] p-6",
        hover && "transition-[box-shadow,transform] duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01]",
        glow && "hover:shadow-glow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}
