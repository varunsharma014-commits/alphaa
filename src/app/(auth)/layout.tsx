import { Sparkles } from "lucide-react"
import Link from "next/link"
import { ClerkProvider } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"

// Clerk's browser SDK is mounted here rather than in the root layout so that
// marketing visitors never download it. <SignIn>/<SignUp> need the provider.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
    <div data-theme="light" data-brand="blue" className="radial-bg min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Sparkles className="w-5 h-5 text-brand-orange" />
        <span className="text-fg font-semibold text-xl font-sans">alphaa</span>
      </Link>
      {children}
    </div>
    </ClerkProvider>
  )
}
