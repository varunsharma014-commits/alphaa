import { GlassCard } from "@/components/common/GlassCard"
import { Sparkles } from "lucide-react"

export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="max-w-6xl mx-auto">
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-brand-orange" />
        </div>
        <h2 className="text-white font-semibold text-xl mb-2">{title}</h2>
        <p className="text-muted text-sm max-w-xs">
          {description ?? "This feature is being built. It will appear here soon."}
        </p>
      </GlassCard>
    </div>
  )
}
