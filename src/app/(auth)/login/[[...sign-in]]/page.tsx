import { SignIn } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"
import { safeNext } from "@/lib/auth-redirect"

// `redirect_url` (e.g. a Webflow/Shopify connect callback) must survive sign-in, and the
// switch to sign-up, or the store connection is lost and the owner has to authorize twice.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const { redirect_url } = await searchParams
  const after = safeNext(redirect_url, "/dashboard")
  const afterSignUp = safeNext(redirect_url, "/onboarding")
  const signUpUrl = after === "/dashboard" ? "/signup" : `/signup?redirect_url=${encodeURIComponent(after)}`
  return <SignIn routing="path" path="/login" signUpUrl={signUpUrl} forceRedirectUrl={after} signUpForceRedirectUrl={afterSignUp} appearance={clerkAppearance} />
}
