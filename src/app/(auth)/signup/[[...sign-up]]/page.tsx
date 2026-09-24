import { SignUp } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"

// `scan` is the ScanLead id from /start; onboarding prefills the business from
// it so a visitor who just watched the agent work never retypes anything.
//
// Both redirects are forced: when someone taps "Continue with Google" here but
// already has an account, Clerk turns the sign-up into a sign-in — and without
// signInForceRedirectUrl it dropped them on the homepage instead of the path
// to payment. Onboarding sends finished users on to /dashboard → /start-trial.
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan } = await searchParams
  const next = scan && /^[a-z0-9]{10,64}$/i.test(scan) ? `/onboarding?scan=${scan}` : "/onboarding"
  return <SignUp forceRedirectUrl={next} signInForceRedirectUrl={next} appearance={clerkAppearance} />
}
