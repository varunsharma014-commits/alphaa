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
        "glass-card rounded-2xl p-6",
        hover && "transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.05]",
        glow && "hover:shadow-glow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}
