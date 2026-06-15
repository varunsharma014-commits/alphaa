import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <SignUp
      forceRedirectUrl="/onboarding"
      appearance={{
        variables: {
          colorPrimary: "#FF6B1A",
          colorBackground: "#13100C",
          colorInputBackground: "#1F1812",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#A8A29E",
          borderRadius: "12px",
          fontFamily: "Inter Tight, sans-serif",
        },
        elements: {
          card: "shadow-none border border-white/[0.08]",
          headerTitle: "text-white font-semibold",
          headerSubtitle: "text-muted",
          formButtonPrimary: "bg-brand-orange hover:bg-brand-orange-light rounded-full",
          footerActionLink: "text-brand-orange hover:text-brand-orange-light",
          formFieldInput: "border-white/10",
          socialButtonsBlockButton: "bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-full font-medium",
          socialButtonsBlockButtonText: "text-gray-900 font-medium",
          dividerLine: "bg-white/10",
          dividerText: "text-white/40",
        },
      }}
    />
  )
}
