import { cn } from "@/lib/utils"

interface MonoNumberProps {
  children: React.ReactNode
  className?: string
}

export function MonoNumber({ children, className }: MonoNumberProps) {
  return (
    <span className={cn("mono tabular-nums", className)}>
      {children}
    </span>
  )
}
