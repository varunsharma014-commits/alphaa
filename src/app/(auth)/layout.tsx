import { Sparkles } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="radial-bg min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Sparkles className="w-5 h-5 text-brand-orange" />
        <span className="text-white font-semibold text-xl font-sans">alphaa</span>
      </Link>
      {children}
    </div>
  )
}
