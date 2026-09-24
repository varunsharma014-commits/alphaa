import { SignUp } from "@clerk/nextjs"

// `scan` is the ScanLead id from /start; onboarding prefills the business from
// it so a visitor who just watched the agent work never retypes anything.
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan } = await searchParams
  const next = scan && /^[a-z0-9]{10,64}$/i.test(scan) ? `/onboarding?scan=${scan}` : "/onboarding"
  return (
    <SignUp
      forceRedirectUrl={next}
      appearance={{
        variables: {
          colorPrimary: "#0071E3",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#F1ECE4",
          colorInputText: "#1A1410",
          colorText: "#1A1410",
          colorTextSecondary: "#6B635E",
          borderRadius: "12px",
          fontFamily: "Inter Tight, sans-serif",
        },
        elements: {
          card: "shadow-none border border-line/[0.08]",
          headerTitle: "text-fg font-semibold",
          headerSubtitle: "text-muted",
          formButtonPrimary: "bg-brand-orange hover:bg-brand-orange-light rounded-full",
          footerActionLink: "text-brand-orange hover:text-brand-orange-light",
          formFieldInput: "border-line/10",
          socialButtonsBlockButton: "bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-full font-medium",
          socialButtonsBlockButtonText: "text-gray-900 font-medium",
          dividerLine: "bg-fg/10",
          dividerText: "text-fg/40",
        },
      }}
    />
  )
}
