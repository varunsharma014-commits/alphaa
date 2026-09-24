import { cn } from "@/lib/utils"

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        // Apple eyebrow: sentence case, semibold, warm accent — not spaced caps.
        "text-[17px] font-semibold tracking-[-0.022em] text-[#bf4800]",
        className
      )}
    >
      {children}
    </span>
  )
}
