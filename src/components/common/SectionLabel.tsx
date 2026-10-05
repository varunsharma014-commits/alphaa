import { cn } from "@/lib/utils"

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        // Apple eyebrow: sentence case, semibold, warm accent — not spaced caps.
        "text-[17px] font-semibold tracking-[-0.022em] text-[#6e6e73]",
        className
      )}
    >
      {children}
    </span>
  )
}
