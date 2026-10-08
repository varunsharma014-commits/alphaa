import { SignUp } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"
import { safeNext } from "@/lib/auth-redirect"

// `scan` is the ScanLead id from /start; onboarding prefills the business from
// it so a visitor who just watched the agent work never retypes anything.
//
// Both redirects are forced: when someone taps "Continue with Google" here but
// already has an account, Clerk turns the sign-up into a sign-in — and without
// signInForceRedirectUrl it dropped them on the homepage instead of the path
// to payment. path/signInUrl keep every step (email code, etc.) on
// alphaa.app: the Clerk instance's own defaults point at the accounts.alphaa.app
// portal, whose after-sign-up URL is the homepage — new users landed there
// signed in but stranded. /onboarding is the agent conversation that ends in checkout.
// `redirect_url` (a connector flow such as a Webflow install) wins over the default.
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ scan?: string; redirect_url?: string }> }) {
  const { scan, redirect_url } = await searchParams
  const fallback = scan && /^[a-z0-9]{10,64}$/i.test(scan) ? `/onboarding?scan=${scan}` : "/onboarding"
  const next = safeNext(redirect_url, fallback)
  const signInUrl = next === fallback ? "/login" : `/login?redirect_url=${encodeURIComponent(next)}`
  return <SignUp routing="path" path="/signup" signInUrl={signInUrl} forceRedirectUrl={next} signInForceRedirectUrl={next} appearance={clerkAppearance} />
}
