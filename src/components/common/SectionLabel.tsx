import { cn } from "@/lib/utils"

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-xs font-medium tracking-[0.18em] uppercase text-brand-orange",
        className
      )}
    >
      {children}
    </span>
  )
}
