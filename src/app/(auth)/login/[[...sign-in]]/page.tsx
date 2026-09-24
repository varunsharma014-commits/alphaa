import { SignIn } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"

// A new Google user who taps "Continue with Google" here gets turned into a
// sign-up by Clerk; force that path to onboarding too (it used to fall back
// to the homepage).
export default function LoginPage() {
  return <SignIn forceRedirectUrl="/dashboard" signUpForceRedirectUrl="/onboarding" appearance={clerkAppearance} />
}
